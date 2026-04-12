// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { Backend, Message, MessageReply } from '../types/backend.js';
import {} from '../types/backends.js';

// --------------------------------------------------------------------------------------------------------------------

const createBackendDummy = () => {
    const notImplementedPromiseReject = () => new Promise<void>((_, reject) => reject('Not implemented in Dummy') );

    const date = '2026-04-11T11:14:02.659Z';
    const dummyData = {
        fetch_firmware_version: {
            action: 'fetch_firmware_version_res',
            payload: {
            },
        },
        find_user_files: {
            action: 'find_user_files_res',
            payload: {
                data: [
                    { category: 'Amps', created_at: date, dir_name: 'neural-models', file_name: 'C1.nam', file_size: 283092, gain: 0, id: 1, name: 'test1', original_file_name: 'test1.nam', tags: [], updated_at: date, uris: [], },
                    // "Pedals", "Miscellaneous"
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A10.wav', file_size: 393260, gain: 0, id: 2, name: 'test2', original_file_name: 'test2.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A11.wav', file_size: 393260, gain: 0, id: 3, name: 'test3', original_file_name: 'test3.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A12.wav', file_size: 396550, gain: 0, id: 4, name: 'test4', original_file_name: 'test4.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A13.wav', file_size: 396550, gain: 0, id: 5, name: 'test5 with a very long name for testing purposes', original_file_name: 'test5.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
                ],
            },
        },
        remove_user_file: {
            action: 'remove_user_file_res',
            payload: {
                success: 1,
                fs_success: 1,
                err_message: '',
                data: {},
            },
        },
        update_user_file: {
            action: 'update_user_files_res',
            payload: {
                success: 1,
                db_success: 1,
                err_message: '',
                data: {},
            },
        },
    };

    const timeoutFast = 0;
    const timeoutSlow = 0;

    const backend: Backend = {
        data: {
            connected: false,
            connect: (_1: () => void, _2: () => void) => {
                return new Promise((success, _) => {
                    setTimeout(success, timeoutFast);
                });
            },
            postMessageWithReply: (message: Message) => {
                return new Promise((success, reject) => {
                    const action : string = message.action;
                    if (Object.keys(dummyData).indexOf(action) >= 0) {
                        // @ts-ignore
                        const data : MessageReply = dummyData[action];
                        setTimeout(() => { success(data) }, timeoutSlow);
                    } else {
                        reject('invalid action: ' + action);
                    }
                });
            },
            postMessageWithoutReply: (_: Message) => {
                return new Promise((success, _) => {
                    setTimeout(success, timeoutFast);
                });
            },
        },
        files: {
            connected: false,
            connect: notImplementedPromiseReject,
            release: notImplementedPromiseReject,
            transferPayload: notImplementedPromiseReject,
        },
    };

    return backend;
};

// --------------------------------------------------------------------------------------------------------------------
