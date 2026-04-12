// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import {
    Category,
    DataBackend,
    DirName,
    MessageTypesWithReply,
    MessageReplyTypes,
    RemoveUserFileMessage,
    UpdateUserFileMessage,
} from '../types/backend-data';
import { FilesBackend } from '../types/backend-files';

// --------------------------------------------------------------------------------------------------------------------

const createDataBackendSimulator = (): DataBackend => {
    const date = '2026-04-11T11:14:02.659Z';
    const db: { [index: number]: {
        category: Category;
        createdAt: string;
        dirName: DirName;
        fileName: string;
        fileSize: number;
        gain: 0;
        name: string;
        originalFileName: string;
        tags: Array<string>;
        updatedAt: string;
        uris: Array<string>;
    } } = {
        1: {
            category: 'Amps',
            createdAt: date,
            dirName: 'neural-models',
            fileName: 'C1.nam',
            fileSize: 283092,
            gain: 0,
            name: 'test1',
            originalFileName: 'test1.nam',
            tags: [],
            updatedAt: date,
            uris: [],
        },
        2: {
            category: '',
            createdAt: date,
            dirName: 'cabinets',
            fileName: 'A10.wav',
            fileSize: 393260,
            gain: 0,
            name: 'test2',
            originalFileName: 'test2.wav',
            tags: [],
            updatedAt: date,
            uris: ['urn:darkglass:User Guitar Cabinet'],
        },
        3: {
            category: '',
            createdAt: date,
            dirName: 'cabinets',
            fileName: 'A11.wav',
            fileSize: 393260,
            gain: 0,
            name: 'test3',
            originalFileName: 'test3.wav',
            tags: [],
            updatedAt: date,
            uris: ['urn:darkglass:User Guitar Cabinet'],
        },
        4: {
            category: '',
            createdAt: date,
            dirName: 'cabinets',
            fileName: 'A12.wav',
            fileSize: 393260,
            gain: 0,
            name: 'test4',
            originalFileName: 'test4.wav',
            tags: [],
            updatedAt: date,
            uris: ['urn:darkglass:User Guitar Cabinet'],
        },
        5: {
            category: '',
            createdAt: date,
            dirName: 'cabinets',
            fileName: 'A13.wav',
            fileSize: 396550,
            gain: 0,
            name: 'test5 with a very long name for testing purposes',
            originalFileName: 'test5.wav',
            tags: [],
            updatedAt: date,
            uris: ['urn:darkglass:User Guitar Cabinet'],
        },
    };
    const replies: { [key: string]: (payload: MessageTypesWithReply['payload']) => MessageReplyTypes } = {
        fetch_firmware_version: () => ({
            action: 'fetch_firmware_version_res',
            payload: {
                data: {
                    capabilities: [],
                    version: 'v1.0.0.0',
                },
                err_message: '',
            },
        }),
        check_firmware_licensing: () => ({
            action: 'check_firmware_licensing_res',
            payload: {
                data: {
                    key: '', // 149e897c16e874bea75961557c8fef52567ad3db
                },
                err_message: 'Simulator acts as unauthorized for now',
                success: 0,
            },
        }),
        find_user_files: () => ({
            action: 'find_user_files_res',
            payload: {
                data: Object.keys(db).map(v => {
                    const id = parseInt(v);
                    const file = db[id];
                    return {
                        id,
                        category: file.category,
                        created_at: file.createdAt,
                        dir_name: file.dirName,
                        file_name: file.fileName,
                        file_size: file.fileSize,
                        gain: file.gain,
                        name: file.name,
                        original_file_name: file.originalFileName,
                        tags: file.tags,
                        updated_at: file.updatedAt,
                        uris: file.uris,
                    };
                }),
            },
        }),
        read_all_plugins: () => ({
            action: 'read_all_plugins_res',
            payload: {
                data: [
                    {
                        type: 0, // FIXME kPluginLicenseFree
                        uri: 'https://falktx.com/plugins/auto-drummer',
                        version: '0.0-0',
                    },
                ],
                err_message: '',
                success: 1,
            },
        }),
        remove_user_file: (_payload) => {
            const payload = _payload as RemoveUserFileMessage['payload'];
            let err_message: string;
            let fs_success: 0 | 1;
            let success: 0 | 1;
            if (typeof(db[payload.id]) !== 'undefined') {
                delete db[payload.id];
                err_message = '';
                fs_success = 1;
                success = 1;
            } else {
                err_message = 'Files does not exist';
                fs_success = 0;
                success = 0;
            }
            return {
                action: 'remove_user_file_res',
                payload: {
                    data: payload,
                    err_message,
                    fs_success,
                    success,
                },
            };
        },
        update_user_file: (_payload) => {
            const payload = _payload as UpdateUserFileMessage['payload'];
            const file = db[payload.id];
            let db_success: 0 | 1;
            let err_message: string;
            let success: 0 | 1;
            if (typeof(file) !== 'undefined') {
                file.category = payload.category;
                file.gain = payload.gain;
                file.name = payload.name;
                file.tags = payload.tags;
                file.updatedAt = payload.updated_at;
                file.uris = payload.uris;
                db_success = 1;
                err_message = '';
                success = 1;
            } else {
                db_success = 0;
                err_message = 'Files does not exist';
                success = 0;
            }
            return {
                action: 'update_user_file_res',
                payload: {
                    data: payload,
                    db_success,
                    err_message,
                    success,
                },
            };
        },
    };

    const timeout = 50;

    return {
        connected: false,
        setup: () => {
            return new Promise(async (success, _) => {
                success();
            });
        },
        connect: () => {
            return new Promise(async (_, reject) => {
                reject('Manual connect action is unused in Simulator');
            });
        },
        postMessageWithReply: (message) => {
            return new Promise((success, reject) => {
                let reply = replies[message.action];
                if (reply) {
                    setTimeout(() => { success(reply(message.payload)) }, timeout);
                } else {
                    reject('Unsupported simulator action: ' + message.action);
                }
            });
        },
        postMessageWithoutReply: (_) => {
            return new Promise((success, _) => {
                setTimeout(success, timeout);
            });
        },
    };
};

// --------------------------------------------------------------------------------------------------------------------

const createFilesBackendSimulator = (): FilesBackend => {
    const notImplemented = () => new Promise<any>((_, reject) => reject('Not implemented in Simulator') );

    return {
        connected: false,
        setup: () => {},
        connect: notImplemented,
        release: notImplemented,
        transferPayload: notImplemented,
        receivePayload: notImplemented,
    };
};

// --------------------------------------------------------------------------------------------------------------------
// @anagram-comm-layer begin-exports

export { createDataBackendSimulator, createFilesBackendSimulator }

// --------------------------------------------------------------------------------------------------------------------
