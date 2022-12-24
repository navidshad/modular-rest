import HttpClient from '../class/http';
import GlobalOptions from '../class/global_options';
import { bus, tokenReceivedEvent } from '../class/event-bus'
import { FileDocument } from '../types/types';

class FileProvider {

    private static instance: FileProvider;
    private http: HttpClient;

    private constructor() {

        this.http = new HttpClient();

        bus.subscribe(tokenReceivedEvent, (event) => {
            this.http.setCommonHeader({
                'authorization': event.payload.token
            })
        })
    };

    static getInstance() {

        if (FileProvider.instance)
            return FileProvider.instance;

        FileProvider.instance = new FileProvider();
        return FileProvider.instance;
    }

    uploadFile(file: string | Blob, onProgress: Function, tag: string) {
        return this.http.uploadFile('/file', file, { tag }, onProgress)
            .then(body => body['file'] as FileDocument);
    }

    uploadFileToURL(url:string, file: string | Blob, body:any={}, onProgress: Function, tag: string) {
        return this.http.uploadFile(url, file, body, onProgress);
    }

    removeFile(id: string) {
        return this.http.delete('/file', { 'query': { 'id': id } });
    }

    getFileLink(fileDoc: { fileName: string, format: string, tag: String }) {
        return new URL('/assets/' + `${fileDoc.format}/${fileDoc.tag}/` + fileDoc.fileName, GlobalOptions.host).toString();
    }
}

export default FileProvider;