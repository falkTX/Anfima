// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@darkglass.com>
// SPDX-License-Identifier: ISC

import { FilesBackend, FilesBackendMethods } from './types/backend-files';

const initFilesBackend = (backend: FilesBackend): FilesBackendMethods => {
    let allowed = false;

    return {
        prepareForPayload: () => {
            return new Promise<void>(async (success, reject) => {
                if (allowed) {
                    success();
                    return;
                }
                try {
                    await backend.connect();
                    await backend.release();
                    allowed = true;
                    success();
                } catch (error) {
                    reject(error);
                }
            });
        },
        transferSinglePayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => {
            return new Promise<void>(async (success, reject) => {
                try {
                    await backend.connect();

                    let filesError = '';
                    try {
                        await backend.transferPayload(payload, progressCallback);
                    } catch (error) {
                        filesError = error as string;
                    }

                    try {
                        await backend.release();
                    } catch (error) {
                        if (filesError.length === 0) {
                            filesError = error as string;
                        }
                    }

                    if (filesError.length !== 0) {
                        throw (filesError);
                    }

                    allowed = true;
                    success();
                } catch (error) {
                    reject(error);
                }
            });
        },
        receiveSinglePayload: (connectedCallback: () => Promise<void>,
                               progressCallback: (progress: number) => void) => {
            return new Promise<Uint8Array>(async (success, reject) => {
                try {
                    await backend.connect();

                    try {
                        await connectedCallback();
                    } catch (error) {
                        await backend.release();
                        throw (error);
                    }

                    let filesError = undefined;
                    let payload: Uint8Array | undefined = undefined;
                    try {
                        payload = await backend.receivePayload(progressCallback);
                    } catch (error) {
                        filesError = '' + error;
                    }

                    try {
                        await backend.release();
                    } catch (error) {
                        if (typeof(filesError) === 'undefined') {
                            filesError = '' + error;
                        }
                    }

                    if (typeof(filesError) !== 'undefined') {
                        throw (filesError);
                    }

                    allowed = true;
                    success(payload as Uint8Array);
                } catch (error) {
                    reject(error);
                }
            });
        }
    };
};

// --------------------------------------------------------------------------------------------------------------------
// @anagram-comm-layer begin-exports

export { initFilesBackend }

// --------------------------------------------------------------------------------------------------------------------
