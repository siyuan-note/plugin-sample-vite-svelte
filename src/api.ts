/**
 * Copyright (c) 2023-2026 frostime. All rights reserved.
 * https://github.com/frostime/sy-plugin-template-vite
 *
 * See API Document in [API.md](https://github.com/siyuan-note/siyuan/blob/master/API.md)
 * API 文档见 [API_zh_CN.md](https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md)
 */

import { fetchPost, fetchSyncPost } from "siyuan";
import type { IWebSocketData } from "siyuan";

export interface ApiResponse<T = any> {
    ok: boolean;
    raw: IWebSocketData;
    data: T | null;
}

/**
 * Execute a SiYuan kernel API request while retaining its status and raw response.
 */
export async function request<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const raw: IWebSocketData = await fetchSyncPost(url, data);
    const ok = raw.code === 0;

    return {
        ok,
        raw,
        data: ok ? raw.data as T : null,
    };
}


export async function getBlockByID(blockId: string): Promise<ApiResponse<Block>> {
    let sqlScript = `select * from blocks where id ='${blockId}'`;
    const response = await sql(sqlScript);
    return {
        ...response,
        data: response.data?.[0] ?? null,
    };
}


// **************************************** Noteboook ****************************************


export async function lsNotebooks(): Promise<ApiResponse<IReslsNotebooks>> {
    let url = '/api/notebook/lsNotebooks';
    return request(url, '');
}


export async function openNotebook(notebook: NotebookId) {
    let url = '/api/notebook/openNotebook';
    return request(url, { notebook: notebook });
}


export async function closeNotebook(notebook: NotebookId) {
    let url = '/api/notebook/closeNotebook';
    return request(url, { notebook: notebook });
}


export async function renameNotebook(notebook: NotebookId, name: string) {
    let url = '/api/notebook/renameNotebook';
    return request(url, { notebook: notebook, name: name });
}


export async function createNotebook(name: string): Promise<ApiResponse<Notebook>> {
    let url = '/api/notebook/createNotebook';
    return request(url, { name: name });
}


export async function removeNotebook(notebook: NotebookId) {
    let url = '/api/notebook/removeNotebook';
    return request(url, { notebook: notebook });
}


export async function getNotebookConf(notebook: NotebookId): Promise<ApiResponse<IResGetNotebookConf>> {
    let data = { notebook: notebook };
    let url = '/api/notebook/getNotebookConf';
    return request(url, data);
}


export async function setNotebookConf(notebook: NotebookId, conf: NotebookConf): Promise<ApiResponse<NotebookConf>> {
    let data = { notebook: notebook, conf: conf };
    let url = '/api/notebook/setNotebookConf';
    return request(url, data);
}


// **************************************** File Tree ****************************************

export async function listDocTree(notebook: NotebookId, path: string): Promise<ApiResponse<IDocTreeNode[]>> {
    let data = {
        notebook: notebook,
        path: path
    }
    let url = '/api/filetree/listDocTree';
    const response = await request<{ tree?: IDocTreeNode[] }>(url, data);
    return {
        ...response,
        data: response.data?.tree ?? null,
    };
}

export async function listDocsByPath(notebook: NotebookId, path: string) {
    let url = '/api/filetree/listDocsByPath'
    let payload = { notebook: notebook, path: path };
    return request(url, payload);
}

export async function createDocWithMd(notebook: NotebookId, path: string, markdown: string): Promise<ApiResponse<DocumentId>> {
    let data = {
        notebook: notebook,
        path: path,
        markdown: markdown,
    };
    let url = '/api/filetree/createDocWithMd';
    return request(url, data);
}


export async function renameDoc(notebook: NotebookId, path: string, title: string): Promise<ApiResponse<DocumentId>> {
    let data = {
        notebook: notebook,
        path: path,
        title: title
    };
    let url = '/api/filetree/renameDoc';
    return request(url, data);
}


export async function renameDocByID(id: string, title: string) {
    let data = {
        id: id,
        title: title
    };
    let url = '/api/filetree/renameDocByID';
    return request(url, data);
}


export async function removeDoc(notebook: NotebookId, path: string) {
    let data = {
        notebook: notebook,
        path: path,
    };
    let url = '/api/filetree/removeDoc';
    return request(url, data);
}


export async function removeDocByID(id: string) {
    let data = {
        id: id
    };
    let url = '/api/filetree/removeDocByID';
    return request(url, data);
}


export async function moveDocs(fromPaths: string[], toNotebook: NotebookId, toPath: string) {
    let data = {
        fromPaths: fromPaths,
        toNotebook: toNotebook,
        toPath: toPath
    };
    let url = '/api/filetree/moveDocs';
    return request(url, data);
}

export async function moveDocsByID(fromIDs: string[], toID: string) {
    let data = {
        fromIDs,
        toID
    };
    let url = '/api/filetree/moveDocsByID';
    return request(url, data);
}


export async function getHPathByPath(notebook: NotebookId, path: string): Promise<ApiResponse<string>> {
    let data = {
        notebook: notebook,
        path: path
    };
    let url = '/api/filetree/getHPathByPath';
    return request(url, data);
}


export async function getHPathByID(id: BlockId): Promise<ApiResponse<string>> {
    let data = {
        id: id
    };
    let url = '/api/filetree/getHPathByID';
    return request(url, data);
}


export async function getIDsByHPath(notebook: NotebookId, path: string): Promise<ApiResponse<BlockId[]>> {
    let data = {
        notebook: notebook,
        path: path
    };
    let url = '/api/filetree/getIDsByHPath';
    return request(url, data);
}


export async function getPathByID(id: BlockId): Promise<ApiResponse<string>> {
    let data = {
        id: id
    };
    let url = '/api/filetree/getPathByID';
    return request(url, data);
}

// **************************************** Asset Files ****************************************

export async function upload(assetsDirPath: string, files: any[]): Promise<ApiResponse<IResUpload>> {
    let form = new FormData();
    form.append('assetsDirPath', assetsDirPath);
    for (let file of files) {
        form.append('file[]', file);
    }
    let url = '/api/asset/upload';
    return request(url, form);
}

// **************************************** Block ****************************************
type DataType = "markdown" | "dom";
export async function insertBlock(
    dataType: DataType, data: string,
    nextID?: BlockId, previousID?: BlockId, parentID?: BlockId
): Promise<ApiResponse<IResdoOperations[]>> {
    let payload = {
        dataType: dataType,
        data: data,
        nextID: nextID,
        previousID: previousID,
        parentID: parentID
    }
    let url = '/api/block/insertBlock';
    return request(url, payload);
}


export async function prependBlock(dataType: DataType, data: string, parentID: BlockId | DocumentId): Promise<ApiResponse<IResdoOperations[]>> {
    let payload = {
        dataType: dataType,
        data: data,
        parentID: parentID
    }
    let url = '/api/block/prependBlock';
    return request(url, payload);
}


export async function appendBlock(dataType: DataType, data: string, parentID: BlockId | DocumentId): Promise<ApiResponse<IResdoOperations[]>> {
    let payload = {
        dataType: dataType,
        data: data,
        parentID: parentID
    }
    let url = '/api/block/appendBlock';
    return request(url, payload);
}


export async function updateBlock(dataType: DataType, data: string, id: BlockId): Promise<ApiResponse<IResdoOperations[]>> {
    let payload = {
        dataType: dataType,
        data: data,
        id: id
    }
    let url = '/api/block/updateBlock';
    return request(url, payload);
}


export async function deleteBlock(id: BlockId): Promise<ApiResponse<IResdoOperations[]>> {
    let data = {
        id: id
    }
    let url = '/api/block/deleteBlock';
    return request(url, data);
}


export async function moveBlock(id: BlockId, previousID?: PreviousID, parentID?: ParentID): Promise<ApiResponse<IResdoOperations[]>> {
    let data = {
        id: id,
        previousID: previousID,
        parentID: parentID
    }
    let url = '/api/block/moveBlock';
    return request(url, data);
}


export async function foldBlock(id: BlockId) {
    let data = {
        id: id
    }
    let url = '/api/block/foldBlock';
    return request(url, data);
}


export async function unfoldBlock(id: BlockId) {
    let data = {
        id: id
    }
    let url = '/api/block/unfoldBlock';
    return request(url, data);
}


export async function getBlockKramdown(id: BlockId): Promise<ApiResponse<IResGetBlockKramdown>> {
    let data = {
        id: id
    }
    let url = '/api/block/getBlockKramdown';
    return request(url, data);
}


export async function getChildBlocks(id: BlockId): Promise<ApiResponse<IResGetChildBlock[]>> {
    let data = {
        id: id
    }
    let url = '/api/block/getChildBlocks';
    return request(url, data);
}

export async function transferBlockRef(fromID: BlockId, toID: BlockId, refIDs: BlockId[]) {
    let data = {
        fromID: fromID,
        toID: toID,
        refIDs: refIDs
    }
    let url = '/api/block/transferBlockRef';
    return request(url, data);
}

// **************************************** Attributes ****************************************
export async function setBlockAttrs(id: BlockId, attrs: { [key: string]: string }) {
    let data = {
        id: id,
        attrs: attrs
    }
    let url = '/api/attr/setBlockAttrs';
    return request(url, data);
}


export async function getBlockAttrs(id: BlockId): Promise<ApiResponse<{ [key: string]: string }>> {
    let data = {
        id: id
    }
    let url = '/api/attr/getBlockAttrs';
    return request(url, data);
}

// **************************************** SQL ****************************************

export async function sql(sql: string): Promise<ApiResponse<any[]>> {
    let sqldata = {
        stmt: sql,
    };
    let url = '/api/query/sql';
    return request(url, sqldata);
}



// **************************************** Template ****************************************

export async function render(id: DocumentId, path: string): Promise<ApiResponse<IResGetTemplates>> {
    let data = {
        id: id,
        path: path
    }
    let url = '/api/template/render';
    return request(url, data);
}


export async function renderSprig(template: string): Promise<ApiResponse<string>> {
    let url = '/api/template/renderSprig';
    return request(url, { template: template });
}

// **************************************** File ****************************************

export async function getFile(path: string, type?: "text" | "json"): Promise<string | object> {
    let data = {
        path: path
    }
    let url = '/api/file/getFile';
    let promise = new Promise<IWebSocketData>((resolve, reject) => {
        try {
            fetchPost(url, data, (response: any) => {
                let data = type === 'json' ? JSON.parse(response) : response;
                resolve(data);
            });
        } catch (error) {
            reject(error);
        }
    });
    let response: IWebSocketData = await promise;
    return response;
}

/**
 * fetchPost will secretly convert data into json, this func merely return Blob
 * @param endpoint
 * @returns
 */
export const getFileBlob = async (path: string): Promise<Blob | null> => {
    const endpoint = '/api/file/getFile'
    let response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            path: path
        })
    });
    if (!response.ok) {
        return null;
    }
    let data = await response.blob();
    return data;
}

export async function putFile(path: string, isDir: boolean, file: File | Blob) {
    let form = new FormData();
    form.append('path', path);
    form.append('isDir', isDir.toString());

    form.append('modTime', Math.floor(Date.now()).toString());
    // form.append('file', file);
    if (file instanceof File) {
        form.append('file', file);
    } else if (file instanceof Blob) {
        form.append('file', file);
    } else {
        form.append('file', new Blob());
    }

    let url = '/api/file/putFile';
    return request(url, form);
}

export async function removeFile(path: string) {
    let data = {
        path: path
    }
    let url = '/api/file/removeFile';
    return request(url, data);
}



export async function readDir(path: string): Promise<ApiResponse<IResReadDir[]>> {
    let data = {
        path: path
    }
    let url = '/api/file/readDir';
    return request(url, data);
}


export async function saveBlob(filePath: string, data: Blob | File | Object | string) {
    let dataBlob: Blob | File;

    if (data instanceof Blob) {
        dataBlob = data;
    } else if (data instanceof File) {
        dataBlob = data;
    } else if (typeof data === 'object') {
        dataBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    } else if (typeof data === 'string') {
        if (filePath.endsWith('.json')) {
            dataBlob = new Blob([data], { type: 'application/json' });
        } else {
            dataBlob = new Blob([data], { type: 'text/plain' });
        }
    } else {
        throw new Error('Unsupported data type');
    }

    const fname = filePath.split("/").pop();

    const file = new File([dataBlob], fname);

    return putFile(filePath, false, file);
}

export const loadBlob = getFileBlob;


// **************************************** Export ****************************************

/**
 * Export Markdown content
 * See {@link https://github.com/siyuan-note/siyuan/issues/14032}
 * @param id
 * @param options
 * @param options.refMode 2: Anchor text block chain; 3: Anchor text only; 4: Block reference converted to footnote + anchor hash
 * @param options.embedMode 0: Use original text; 1: Use Blockquote
 * @param options.yfm Export YAML information or not
 * @returns
 */
export async function exportMdContent(id: DocumentId, options?: {
    refMode?: 2 | 3 | 4;
    embedMode?: 0 | 1;
    yfm?: boolean;
}): Promise<ApiResponse<IResExportMdContent>> {
    let data = {
        id: id,
        ...(options ?? {})
    }
    let url = '/api/export/exportMdContent';
    return request(url, data);
}

export async function exportResources(paths: string[], name: string): Promise<ApiResponse<IResExportResources>> {
    let data = {
        paths: paths,
        name: name
    }
    let url = '/api/export/exportResources';
    return request(url, data);
}

// **************************************** Convert ****************************************

export type PandocArgs = string;
export async function pandoc(args: PandocArgs[]) {
    let data = {
        args: args
    }
    let url = '/api/convert/pandoc';
    return request(url, data);
}

// **************************************** Notification ****************************************

// /api/notification/pushMsg
// {
//     "msg": "test",
//     "timeout": 7000
//   }
export async function pushMsg(msg: string, timeout: number = 7000) {
    let payload = {
        msg: msg,
        timeout: timeout
    };
    let url = "/api/notification/pushMsg";
    return request(url, payload);
}

export async function pushErrMsg(msg: string, timeout: number = 7000) {
    let payload = {
        msg: msg,
        timeout: timeout
    };
    let url = "/api/notification/pushErrMsg";
    return request(url, payload);
}

// **************************************** Network ****************************************
export async function forwardProxy(
    url: string, method: string = 'GET', payload: any = {},
    headers: any[] = [], timeout: number = 7000, contentType: string = "text/html"
): Promise<ApiResponse<IResForwardProxy>> {
    let data = {
        url: url,
        method: method,
        timeout: timeout,
        contentType: contentType,
        headers: headers,
        payload: payload
    }
    let url1 = '/api/network/forwardProxy';
    return request(url1, data);
}


// **************************************** System ****************************************

export async function bootProgress(): Promise<ApiResponse<IResBootProgress>> {
    return request('/api/system/bootProgress', {});
}


export async function version(): Promise<ApiResponse<string>> {
    return request('/api/system/version', {});
}


export async function currentTime(): Promise<ApiResponse<number>> {
    return request('/api/system/currentTime', {});
}
