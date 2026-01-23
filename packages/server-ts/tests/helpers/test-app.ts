import fs from 'fs';
import os from 'os';
import path from 'path';
import supertest from 'supertest';
import mongoose from 'mongoose';
import { modelRegistry } from '../../src/services/data_provider/model_registry';
import type { RestOptions } from '../../src/config';
import { createRest } from '../../src/application';

import crypto from 'crypto';

const defaultMongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017';

// Generate a valid RSA keypair for the environment
const generated = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const fastKeyPair = {
  public: generated.publicKey,
  private: generated.privateKey,
};

export interface TestAppContext {
  request: supertest.SuperTest<supertest.Test>;
  uploadDir: string;
  adminToken: string;
  dbPrefix: string;
  mongoOption?: RestOptions['mongo'];
  cleanup: () => Promise<void>;
}

export async function createIntegrationTestApp(
  overrides: Partial<RestOptions> = {}
): Promise<TestAppContext> {
  const setupStart = Date.now();
  console.log(`[test-app] Starting context creation...`);

  // Clear model registry to ensure a fresh start with new db prefixes
  await modelRegistry.clear();

  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrest-upload-'));
  const dbPrefix = `mrest_test_${Date.now()}_${Math.random().toString(16).slice(2)}_`;

  const options: RestOptions = {
    dontListen: true, // Use app callback for supertest, no real server needed
    port: 0,
    mongo: {
      mongoBaseAddress: defaultMongoUri,
      dbPrefix,
    },
    uploadDirectoryConfig: {
      directory: uploadDir,
      urlPath: '/assets',
    },
    adminUser: {
      email: 'admin@email.com',
      password: '@dmin',
    },
    keypair: fastKeyPair, // Use pre-generated keys to avoid slow generation
    ...overrides,
  };

  // Add timeout wrapper to catch hanging operations
  let timeoutId: NodeJS.Timeout;
  const createRestWithTimeout = Promise.race([
    createRest(options),
    new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () =>
          reject(
            new Error(
              `createRest timed out after 45s - check MongoDB connection. Prefix: ${dbPrefix}`
            )
          ),
        45000
      );
    }),
  ]) as Promise<{ app: any; server?: any }>;

  let app: any;
  let server: any;

  try {
    const result = await createRestWithTimeout;
    if (timeoutId!) clearTimeout(timeoutId);
    app = result.app;
    server = result.server;
    console.log(`[test-app] createRest resolved (+${Date.now() - setupStart}ms)`);

    // Wait for database to be fully ready for queries
    // This ensures createAdminUser queries don't hang
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    // Cleanup on failure
    if (uploadDir) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create test app: ${errorMessage}.`);
  }

  const request = supertest(app.callback()) as unknown as supertest.SuperTest<supertest.Test>;

  console.log(`[test-app] Attempting admin login... (+${Date.now() - setupStart}ms)`);
  const loginRes = await request.post('/user/login').send({
    id: options.adminUser?.email || 'admin@email.com',
    idType: 'email',
    password: options.adminUser?.password || '@dmin',
  });

  if (loginRes.status >= 300 || loginRes.body.status !== 'success' || !loginRes.body.token) {
    console.error(`[test-app] Login failed:`, loginRes.status, loginRes.body);
    await cleanupConnections(dbPrefix);
    if (uploadDir) fs.rmSync(uploadDir, { recursive: true, force: true });
    throw new Error(`Failed to login admin: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }

  const adminToken = loginRes.body.token as string;
  console.log(`[test-app] Context creation complete (+${Date.now() - setupStart}ms)`);

  const cleanup = async (): Promise<void> => {
    if (server) {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }

    if (uploadDir) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }

    await modelRegistry.clear();
    await cleanupConnections(dbPrefix);
  };

  return {
    request,
    uploadDir,
    adminToken,
    dbPrefix,
    mongoOption: options.mongo,
    cleanup,
  };
}

async function cleanupConnections(dbPrefix: string): Promise<void> {
  await Promise.all(
    mongoose.connections.map(async connection => {
      const dbName = (connection as any).db?.databaseName;
      if (dbName && dbPrefix && dbName.startsWith(dbPrefix)) {
        try {
          await (connection as any).dropDatabase();
        } catch (err) {
          // ignore drop errors during cleanup
        }
      }
      if (connection.readyState !== 0) {
        try {
          await connection.close();
        } catch (err) {
          // ignore close errors during cleanup
        }
      }
    })
  );

  await mongoose.disconnect().catch(() => {
    /* ignore */
  });
}

export function ensureUploadPath(uploadDir: string, format: string, tag: string): void {
  fs.mkdirSync(path.join(uploadDir, format, tag), { recursive: true });
}

export function createTempFile(extension: string, content = 'file-content'): string {
  const filePath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'mrest-file-')),
    `temp.${extension}`
  );
  fs.writeFileSync(filePath, content);
  return filePath;
}
