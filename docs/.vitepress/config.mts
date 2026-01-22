import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Modular Rest",

  description:
    "A set of libraries to bring database access into client side (web/mobile) except bother yourself by developing backend side. ",

  base: "/modular-rest/",

  sitemap: {
    hostname: "https://navidshad.github.io/modular-rest/",
    lastmodDateOnly: true,
  },

  // https://vitepress.dev/guide/mpa-mode#mpa-mode
  mpa: true,

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Home", link: "/" }],

    sidebar: [
      {
        text: "Introduction",
        items: [
          {
            text: "What is Modular Rest?",
            link: "/intro/what-is-modular-rest.md",
          },
          // {
          //   text: "Getting Started",
          //   link: "/intro/getting-started.md",
          // },
        ],
      },
      {
        text: "Server",
        items: [
          { text: "Install", link: "/server-client-ts/install" },
          { text: "Quick Start", link: "/server-client-ts/quick-start" },
          { text: "Key Concepts", link: "/server-client-ts/key-concepts" },
          {
            text: "Define Module",
            items: [
              { text: "Intro", link: "/server-client-ts/modules/intro" },
              {
                text: "Database",
                link: "/server-client-ts/modules/database",
              },
              {
                text: "Functions",
                link: "/server-client-ts/modules/functions",
              },
              {
                text: "Custom Route",
                link: "/server-client-ts/modules/custom-route",
              },
            ],
          },
          {
            text: "Toolbox",
            items: [
              { text: "Database", link: "/server-client-ts/utility/database" },
              { text: "Router", link: "/server-client-ts/utility/router" },
              { text: "Validator", link: "/server-client-ts/utility/validator" },
              {
                text: "Type Casters",
                link: "/server-client-ts/utility/type-casters",
              },
              { text: "File", link: "/server-client-ts/utility/file" },
              {
                text: "UserManager",
                link: "/server-client-ts/utility/user-manager",
              },
              {
                text: "Model Registry",
                link: "/server-client-ts/utility/model-registry",
              },
            ],
          },
          {
            text: "Advanced Topics",
            items: [
              { text: "Cors", link: "/server-client-ts/advanced/cors" },
              {
                text: "Permission And User Access",
                link: "/server-client-ts/advanced/permission-and-user-access.md",
              },
            ],
          },
          {
            text: "LLM Context",
            link: "/server-client-ts/llm-context.md",
          },
        ],
      },
      // {
      //   text: "Server",
      //   items: [
      //     { text: "Install", link: "/server-client/install" },
      //     { text: "Key Concepts", link: "/server-client/key-concepts" },
      //     { text: "Configuration", link: "/server-client/configuration" },
      //     {
      //       text: "Modules",
      //       items: [
      //         { text: "Intro", link: "/server-client/modules/intro" },
      //         { text: "Database", link: "/server-client/modules/database" },
      //         { text: "Functions", link: "/server-client/modules/functions" },
      //         {
      //           text: "Custom Route",
      //           link: "/server-client/modules/custom-route",
      //         },
      //       ],
      //     },
      //     {
      //       text: "Utility",
      //       items: [
      //         { text: "Database", link: "/server-client/utility/database" },
      //         { text: "Router", link: "/server-client/utility/router" },
      //         { text: "File", link: "/server-client/utility/file" },
      //         {
      //           text: "UserManager",
      //           link: "/server-client/utility/user-manager",
      //         },
      //       ],
      //     },
      //     {
      //       text: "Advanced Topics",
      //       items: [{ text: "Cors", link: "/server-client/advanced/cors" }],
      //     },
      //   ],
      // },
      {
        text: "Client",
        items: [
          { text: "Install", link: "/js-client/install" },
          { text: "Authentication", link: "/js-client/authentication" },
          { text: "Data Provider", link: "/js-client/data-provider" },
          { text: "File Provider", link: "/js-client/file-provider" },
          { text: "Function Provider", link: "/js-client/function-provider" },
          { text: "LLM Context", link: "/js-client/llm-context" },

        ],
      },
      // {
      //   text: "Flutter Client",
      //   items: [{ text: "Install", link: "/flutter-client/install" }],
      // },
      // {
      //   text: "Http Api",
      //   items: [{ text: "Intro", link: "/http-api/intro" }],
      // },
    ],

    search: {
      provider: "local",
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/navidshad/modular-rest" },
    ],
  },
});
