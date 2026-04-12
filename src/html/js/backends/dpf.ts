// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { Backend, Message, MessageReply } from '../types/backend.js';
import {} from '../types/backends.js';
import {} from '../types/dpf.js';

// --------------------------------------------------------------------------------------------------------------------

const createBackendDPF = () => {
    // call dpf postMessage and wait for a reply
    // reply will be empty for success, otherwise an error string
    // an object is not a valid reply in this case
    const postMessageWithAsyncEmptyReply = (message: string) => {
        return new Promise<void>((success, reject) => {
            const triggerRejectFromTimeout = () => {
                dpfIdle = dpfReceive = undefined;
                reject('Timed out waiting for Anagram reply');
            };

            let timeout = setTimeout(triggerRejectFromTimeout, 1000);

            dpfIdle = () => {
                clearTimeout(timeout);
                timeout = setTimeout(triggerRejectFromTimeout, 1000);
            };

            dpfReceive = (reply: MessageReply | string | undefined) => {
                dpfIdle = dpfReceive = undefined;
                clearTimeout(timeout);
                if (typeof(reply) === 'undefined') {
                    success();
                } else if (typeof(reply) === 'string') {
                    reject(reply);
                } else {
                    reject('Received invalid reply');
                }
            };

            postMessage(message);
        });
    };

    // call dpf postMessage and wait for a reply
    // reply will be an object for success, otherwise an error string
    // an empty/undefined is not a valid reply in this case
    const postMessageWithAsyncObjectReply = (message: string) => {
        return new Promise<MessageReply>((success, reject) => {
            const triggerRejectFromTimeout = () => {
                dpfIdle = dpfReceive = undefined;
                reject('Timed out waiting for Anagram reply');
            };

            let timeout = setTimeout(triggerRejectFromTimeout, 1000);

            dpfIdle = () => {
                clearTimeout(timeout);
                timeout = setTimeout(triggerRejectFromTimeout, 1000);
            };

            dpfReceive = (reply: MessageReply | string | undefined) => {
                dpfIdle = dpfReceive = undefined;
                clearTimeout(timeout);
                if (typeof(reply) === 'object') {
                    success(reply);
                } else if (typeof(reply) === 'string') {
                    reject(reply);
                } else {
                    reject('Received invalid reply');
                }
            };

            postMessage(message);
        });
    };

    const dpf: Backend = {
        data: {
            connected: false,
            connect: (_1: () => void, _2: () => void) => {
                return new Promise(async (_, reject) => {
                    reject('Manual connect action is unused in DPF backend');
                });
            },
            postMessageWithReply: (message: Message) => {
                return postMessageWithAsyncObjectReply(JSON.stringify(message));
            },
            postMessageWithoutReply: (message: Message) => {
                return new Promise<void>((success, reject) => {
                    postMessage(JSON.stringify(message));
                    success();
                });
            },
        },
        files: {
            connected: false,
            connect: (_1: () => void, _2: () => void) => {
                return postMessageWithAsyncEmptyReply('|serial|connect|');
            },
            release: () => {
                return postMessageWithAsyncEmptyReply('|serial|release|');
            },
            transferPayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => {
                return new Promise<void>((success, reject) => {
                    let msg;
                    // TODO polyfill
                    /*
                    if (false) {
                        payload = payload.toBase64();
                    } else
                    */
                    {
                        let output = [];
                        for (var i = 0, length = payload.length; i < length; ++i) {
                            output.push(String.fromCharCode(payload[i]));
                        }
                        msg = '|serial|send|' + btoa(output.join(''));
                    }

                    postMessageWithAsyncEmptyReply(msg).then(() => {
                        progressCallback(0);

                        dpfSerialTransferDone = (error: string | undefined) => {
                            dpfSerialTransferDone = dpfSerialTransferProgress = undefined;
                            if (error) {
                                reject(error);
                            } else {
                                success();
                            }
                        };

                        dpfSerialTransferProgress = (progress: number) => {
                            progressCallback(progress);
                        };
                    }).catch(reject);
                });
            },
        },
        postInit: () => postMessage('|started|'),
    };

    return dpf;
};

// --------------------------------------------------------------------------------------------------------------------
