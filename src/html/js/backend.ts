// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { Backend, BackendWithMethods, Message } from './types/backend.js';
import {} from './types/backends.js';
import {} from './types/dpf.js';
import {} from './types/web.js';

// --------------------------------------------------------------------------------------------------------------------

const initBackend = () => {
    const notImplementedPromiseReject = () => new Promise<any>((_, reject) => reject('Not implemented') );
    const unsupportedPromiseReject = () => new Promise<any>((_, reject) => reject('Unsupported web browser') );

    const backend: Backend = {
        data: {
            connected: false,
            connect: unsupportedPromiseReject,
            postMessageWithReply: notImplementedPromiseReject,
            postMessageWithoutReply: notImplementedPromiseReject,
        },
        files: {
            connected: false,
            connect: unsupportedPromiseReject,
            release: notImplementedPromiseReject,
            transferPayload: notImplementedPromiseReject,
        },
    };

    if (typeof(RunningFromDPF) !== 'undefined' && RunningFromDPF) {
        // running through DPF standalone
        const dpf = createBackendDPF();
        backend.data = dpf.data;
        backend.files = dpf.files;
        backend.postInit = dpf.postInit;
    } else if (window.location.hash === '#debug') {
        const dummy = createBackendDummy();
        backend.data = dummy.data;
        backend.files = dummy.files;
    } else {
        // running through web browser, find best possible backend
        if (typeof(navigator.hid) !== 'undefined') {
            backend.data = createDataBackendWebHID();
        }
        // else if (typeof(navigator.bluetooth) !== 'undefined') {
        //     backend.data = createDataBackendWebBluetooth();
        // }

        if (typeof(navigator.serial) !== 'undefined') {
            backend.files = createFilesBackendWebSerial();
        }
        // else if (typeof(navigator.requestMIDIAccess) !== 'undefined') {
        //     backend.files = createFilesBackendWebMIDI();
        // }
    }

    // all supported functions
    const backendWithMethods: BackendWithMethods = {
        // postInit always valid
        postInit: () => {},
        ...backend,

        // data functions with reply
        exportAnagramLogs: async () => {
            return await backend.data.postMessageWithReply({
                action: 'export_anagram_logs',
                payload: {},
            });
        },
        fetchFirmwareVersion: async () => {
            return await backend.data.postMessageWithReply({
                action: 'fetch_firmware_version',
                payload: {},
            });
        },
        findUserFiles: async () => {
            return await backend.data.postMessageWithReply({
                action: 'find_user_files',
                payload: {},
            });
        },
        getFileByFilename: async ({ file_name, name }) => {
            return await backend.data.postMessageWithReply({
                action: 'get_file_by_file_name',
                payload: {
                    fileName: file_name,
                    name,
                },
            });
        },
        openFileReceiver: async ({ category, dir_name, file_name, file_size, is_firmware, name, signature, tags, uris }) => {
            const date = (new Date()).toISOString();
            return await backend.data.postMessageWithReply({
                action: 'open_file_receiver',
                payload: {
                    category,
                    createdAt: date,
                    dirName: dir_name,
                    fileName: file_name,
                    fileSize: file_size,
                    isFirmware: is_firmware,
                    name,
                    signature,
                    tags,
                    updatedAt: date,
                    uris,
                },
            });
        },
        removeUserFile: async ({ dir_name, file_name, id }) => {
            return await backend.data.postMessageWithReply({
                action: 'remove_user_file',
                payload: {
                    dirName: dir_name,
                    fileName: file_name,
                    id,
                },
            });
        },
        // removeUserFiles: async ({ dir_name, file_names }) => {
        //     return await backend.data.postMessageWithReply({
        //         action: 'remove_user_files',
        //         payload: {
        //             dirName: dir_name,
        //             fileNames: file_names,
        //         },
        //     });
        // },
        updateUserFile: async ({ category, gain, id, name, tags, uris }) => {
            return await backend.data.postMessageWithReply({
                action: 'update_user_file',
                payload: {
                    category,
                    gain,
                    id,
                    name,
                    tags,
                    uris,
                    updated_at: (new Date()).toISOString(),
                },
            });
        },

        // data functions without reply
        firmwareTransferCompleted: async () => {
            await backend.data.postMessageWithoutReply({
                action: 'firmware_transfer_completed',
                payload: {},
            });
        },
        reboot: async () => {
            await backend.data.postMessageWithoutReply({
                action: 'reboot',
                payload: {},
            });
        },

        // utilities
        transferSinglePayload: async (payload: Uint8Array, progressCallback: (progress: number) => void) => {
            await backend.files.connect(() => {}, () => {});

            let filesError = '';
            try {
                await backend.files.transferPayload(payload, progressCallback);
            } catch (error) {
                filesError = error as string;
            }

            try {
                await backend.files.release();
            } catch (error) {
                if (filesError.length === 0) {
                    filesError = error as string;
                }
            }

            if (filesError.length !== 0) {
                throw(filesError);
            }
        },
    };

    return backendWithMethods;
}

// --------------------------------------------------------------------------------------------------------------------
