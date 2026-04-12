// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import {
    DataBackend,
    MessageReplyTypes,
    MessageTypesWithReply,
    MessageTypesWithoutReply
} from './types/backend-data';
import { FilesBackend } from './types/backend-files';
import {} from './anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------

const createDataBackendDPF = (): DataBackend => {
    const DATA_TIMEOUT_MS = 15000;

    // call dpf postMessage and wait for a message reply
    // reply will be an object for success, otherwise an error string
    // an empty/undefined is not a valid reply in this case
    const postMessageWithMessageReply = (message: MessageTypesWithReply) => {
        return new Promise<MessageReplyTypes>((success, reject) => {
            if (typeof(dpfIdleMessageReply) !== 'undefined' || typeof(dpfReceiveMessageReply) !== 'undefined') {
                reject('Backend failure, multiple non-sequential requests are not supported!');
                return;
            }

            const triggerRejectFromTimeout = () => {
                dpfIdleMessageReply = dpfReceiveMessageReply = undefined;
                reject('Timed out waiting for Anagram reply');
            };

            let timeout = setTimeout(triggerRejectFromTimeout, DATA_TIMEOUT_MS);

            dpfIdleMessageReply = () => {
                clearTimeout(timeout);
                timeout = setTimeout(triggerRejectFromTimeout, DATA_TIMEOUT_MS);
            };

            dpfReceiveMessageReply = (reply: MessageReplyTypes | string) => {
                dpfIdleMessageReply = dpfReceiveMessageReply = undefined;
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

    return {
        connected: false,
        setup: (reconnectedCallback: () => void, disconnectedCallback: () => void) => {
            return new Promise((success, _) => {
                dpfConnected = () => { setTimeout(reconnectedCallback, 0) };
                dpfDisconnected = () => { setTimeout(disconnectedCallback, 0) };
                success();
            });
        },
        connect: () => {
            return new Promise((_, reject) => {
                reject('Manual connect action is unused in DPF backend');
            });
        },
        postMessageWithReply: (message: MessageTypesWithReply) => {
            return postMessageWithMessageReply(message);
        },
        postMessageWithoutReply: (message: MessageTypesWithoutReply) => {
            return new Promise<void>((success, _) => {
                postMessage(JSON.stringify(message));
                success();
            });
        },
    };
};

// --------------------------------------------------------------------------------------------------------------------

const createFilesBackendDPF = (): FilesBackend => {
    const DPF_FILES_BLOCK_SIZE = 0x80000;

    // call dpf postMessage and wait for an IPC response
    // response will be empty for success, otherwise an error string
    // an object is not a valid response in this case
    const postMessageForIPC = (message: string, timeoutInSecs = 1) => {
        return new Promise<void>((success, reject) => {
            if (typeof(dpfIdleIPC) !== 'undefined' || typeof(dpfReceiveIPC) !== 'undefined') {
                reject('Backend failure, multiple non-sequential requests are not supported!');
                return;
            }

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

    return {
        connected: false,
        setup: () => {},
        connect: () => {
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
                    dpfSerialTransferData = dpfSerialTransferDone = dpfSerialTransferProgress = undefined;
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
        receivePayload: (progressCallback: (progress: number) => void) => {
            return new Promise<Uint8Array>((success, reject) => {
                let transferError = '';

                const payload = new Uint8Array;

                const maybeTriggerPromise = () => {
                    if (transferError) {
                        reject(transferError);
                    } else {
                        success(payload);
                    }
                };

                dpfSerialTransferData = (data: string) => {
                    // TODO payload
                };

                dpfSerialTransferDone = (error: string | undefined) => {
                    dpfSerialTransferData = dpfSerialTransferDone = dpfSerialTransferProgress = undefined;
                    if (error && ! transferError) {
                        transferError = error;
                    }
                    maybeTriggerPromise();
                };

                dpfSerialTransferProgress = (progress: number) => {
                    progressCallback(progress);
                };

                postMessageForIPC('|serial|receive|')
                .then(() => {})
                .catch((error) => { reject(error); });
            });
        },
    };
};

// --------------------------------------------------------------------------------------------------------------------

const dpfPostInit = () => postMessage('|started|');

// --------------------------------------------------------------------------------------------------------------------
