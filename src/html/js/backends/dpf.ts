// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { Backend, Message, MessageReply } from '../types/backend.js';
import {} from '../types/backends.js';
import {} from '../types/dpf.js';

// --------------------------------------------------------------------------------------------------------------------

const createBackendDPF = () => {
    const DPF_FILES_BLOCK_SIZE = 0x80000;

    // call dpf postMessage and wait for an IPC response
    // response will be empty for success, otherwise an error string
    // an object is not a valid response in this case
    const postMessageForIPC = (message: string, timeoutInSecs = 1) => {
        return new Promise<void>((success, reject) => {
            const triggerRejectFromTimeout = () => {
                dpfIdleIPC = dpfReceiveIPC = undefined;
                reject('Timed out waiting for Anagram response');
            };

            let timeout = setTimeout(triggerRejectFromTimeout, timeoutInSecs * 1000);

            dpfIdleIPC = () => {
                clearTimeout(timeout);
                timeout = setTimeout(triggerRejectFromTimeout, timeoutInSecs * 1000);
            };

            dpfReceiveIPC = (response: string | undefined) => {
                dpfIdleIPC = dpfReceiveIPC = undefined;
                clearTimeout(timeout);
                if (typeof(response) === 'undefined') {
                    success();
                } else if (typeof(response) === 'string') {
                    reject(response);
                } else {
                    reject('Received invalid response');
                }
            };

            postMessage(message);
        });
    };

    // call dpf postMessage and wait for a message reply
    // reply will be an object for success, otherwise an error string
    // an empty/undefined is not a valid reply in this case
    const postMessageWithMessageReply = (message: Message) => {
        return new Promise<MessageReply>((success, reject) => {
            const triggerRejectFromTimeout = () => {
                dpfIdleMessageReply = dpfIdleMessageReply = undefined;
                reject('Timed out waiting for Anagram reply');
            };

            let timeout = setTimeout(triggerRejectFromTimeout, 1000);

            dpfIdleMessageReply = () => {
                clearTimeout(timeout);
                timeout = setTimeout(triggerRejectFromTimeout, 1000);
            };

            dpfReceiveMessageReply = (reply: MessageReply | string) => {
                dpfIdleMessageReply = dpfIdleMessageReply = undefined;
                clearTimeout(timeout);
                if (typeof(reply) === 'object') {
                    success(reply);
                } else if (typeof(reply) === 'string') {
                    reject(reply);
                } else {
                    reject('Received invalid reply');
                }
            };

            postMessage(JSON.stringify(message));
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
                return postMessageWithMessageReply(message);
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
                return postMessageForIPC('|serial|connect|');
            },
            release: () => {
                return postMessageForIPC('|serial|release|');
            },
            transferPayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => {
                return new Promise<void>(async (success, reject) => {
                    let transferDoneDPF = false;
                    let transferDoneJS = false;
                    let transferError = '';

                    const maybeTriggerPromise = () => {
                        if (transferDoneDPF && transferDoneJS) {
                            if (transferError) {
                                reject(transferError);
                            } else {
                                success();
                            }
                        }
                    };

                    dpfSerialTransferDone = (error: string | undefined) => {
                        dpfSerialTransferDone = dpfSerialTransferProgress = undefined;
                        transferDoneDPF = true;
                        if (error && ! transferError) {
                            transferError = error;
                        }
                        maybeTriggerPromise();
                    };

                    dpfSerialTransferProgress = (progress: number) => {
                        progressCallback(progress);
                    };

                    try {
                        do {
                            await postMessageForIPC('|serial|size|' + payload.length);

                            if (transferDoneDPF) {
                                break;
                            }

                            for (var r = 0, length = payload.length; r < length; r += DPF_FILES_BLOCK_SIZE) {
                                const usableSize = Math.min(DPF_FILES_BLOCK_SIZE, payload.length - r);

                                let output = [];
                                for (var i = 0; i < usableSize; ++i) {
                                    output.push(String.fromCharCode(payload[r + i]));
                                }
                                const b64data = btoa(output.join(''));

                                await postMessageForIPC('|serial|data|' + b64data, 5);
                                await new Promise((success, _) => setTimeout(success, 1));

                                if (transferDoneDPF) {
                                    break;
                                }
                            }
                        } while (false);

                    } catch (error) {
                        if (! transferError) {
                            transferError = error as string;
                        }
                    }

                    transferDoneJS = true;
                    maybeTriggerPromise();
                });
            },
        },
        postInit: () => postMessage('|started|'),
    };

    return dpf;
};

// --------------------------------------------------------------------------------------------------------------------
