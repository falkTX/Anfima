// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { DataBackend, Message, MessageReply } from '../types/backend.js';
import { HIDConnectionEvent, HIDDevice, HIDInputReportEvent } from '../types/web.js';
import {} from '../types/backends.js';
import {} from '../types/constants.js';

// --------------------------------------------------------------------------------------------------------------------

interface DataBackendHID extends DataBackend {
    device?: HIDDevice;
};

// --------------------------------------------------------------------------------------------------------------------

const createDataBackendWebHID = () => {
    const HID_DEVICE_ID = 0;
    const HID_REPORT_ID = 1;
    const HID_REPORT_SIZE = 64;

    const HID_MESSAGE_START = 'DSTART';
    const HID_MESSAGE_END = 'DEND';

    const hid: DataBackendHID = {
        connected: false,
        connect: (connectedCallback: () => void, disconnectedCallback: () => void) => {
            return new Promise(async (success, reject) => {
                if (typeof(navigator.hid) === 'undefined') {
                    reject('Web HID is not supported in this browser');
                    return;
                }
                if (typeof(hid.device) !== 'undefined') {
                    reject('Already connected');
                    return;
                }

                navigator.hid.addEventListener('connect', (ev: HIDConnectionEvent) => {
                    // console.log(`HID device connected: ${ev.device.productName}`);
                    // console.dir(ev);

                    // already connected
                    if (typeof(hid.device) !== 'undefined') {
                        return;
                    }

                    // wrong device?
                    if (ev.device.vendorId != DEVICE_VENDOR_ID || ev.device.productId != DEVICE_PRODUCT_ID) {
                        return;
                    }

                    const connect = () => {
                        hid.device = ev.device;
                        connectedCallback();
                    };

                    if (ev.device.opened) {
                        connect();
                    } else {
                        ev.device.open().then(connect);
                    }
                });

                navigator.hid.addEventListener('disconnect', (ev: HIDConnectionEvent) => {
                    // console.log(`HID device disconnected: ${ev.device.productName}`);
                    // console.dir(ev);

                    if (ev.device == hid.device) {
                        hid.device = undefined;
                        disconnectedCallback();
                    }
                });

                try {
                    const devices = await navigator.hid.requestDevice({
                        filters: [ { vendorId: DEVICE_VENDOR_ID, productId: DEVICE_PRODUCT_ID } ],
                    });

                    if (devices.length === 0) {
                        throw ('Failed to get HID device');
                    }

                    const device = devices[0];

                    if (! device.opened) {
                        await device.open();
                    }

                    hid.device = device;

                } catch (reason) {
                    reject(reason);
                    return;
                }

                success();
            });
        },
        postMessageWithReply: (message: Message) => {
            return new Promise<MessageReply>((success, reject) => {
                // only reject once
                let rejected = false;
                const maybeReject = (reason?: any) => {
                    if (! rejected) {
                        rejected = true;
                        reject(reason);
                    }
                };

                const waitForReply = () => {
                    addInputReportListener(hid.device, success, maybeReject);
                };

                try {
                    writeMessage(hid.device, JSON.stringify(message), waitForReply, maybeReject);
                } catch (reason) {
                    maybeReject(reason);
                }
            });
        },
        postMessageWithoutReply: async (message: Message) => {
            return new Promise<void>((success, reject) => {
                try {
                    writeMessage(hid.device, JSON.stringify(message), success, reject);
                } catch (reason) {
                    reject(reason);
                }
            });
        },
    };

    const addInputReportListener = (device: HIDDevice | undefined,
                                    success: (reply: MessageReply) => void,
                                    reject: (reason?: any) => void) =>
    {
        if (! device) {
            reject('Anagram is not connected');
            return;
        }

        // trigger time-out if no data received for 1s
        const triggerRejectFromTimeout = () => {
            removeListenerAndReject('Timed out waiting for Anagram reply');
        };
        let timeout = setTimeout(triggerRejectFromTimeout, 1000);

        // helper for reject, handle timeout and event listener
        const removeListenerAndReject = (reason?: any) => {
            clearTimeout(timeout);
            device.removeEventListener('inputreport', inputReportCallback);
            reject(reason);
        };

        // hid input report callback
        const errorMarker = 'ERROR-MISSING-DSTART-SEQUENCE';
        let _msgRecv = errorMarker;
        let _msgRecvStartSentinel = -1;
        let _msgRecvEndSentinel = -1;

        const inputReportCallback = (e: HIDInputReportEvent) => {
            // const { data, device, reportId } = e;
            const buffer = new Uint8Array(e.data.buffer);
            // console.log(`data: ${buffer}`);

            if (buffer[0] != HID_REPORT_ID) {
                removeListenerAndReject('invalid report id');
                return;
            }

            clearTimeout(timeout);
            timeout = setTimeout(triggerRejectFromTimeout, 1000);

            for (let i = 1; i < buffer.length; ++i) {
                // intermittent null chars
                if (buffer[i] == 0) {
                    if (_msgRecvStartSentinel < HID_MESSAGE_START.length) {
                        _msgRecvStartSentinel = -1;
                    }
                    if (_msgRecvEndSentinel < HID_MESSAGE_END.length) {
                        _msgRecvEndSentinel = -1;
                    }
                    continue;
                }

                // initial sentinel
                if (buffer[i] == 68) {
                    if (_msgRecvStartSentinel == -1) {
                        _msgRecvStartSentinel = 0;
                        continue;
                    }
                    if (_msgRecvEndSentinel == -1) {
                        _msgRecvEndSentinel = 0;
                        continue;
                    }
                }

                // start sentinel?
                switch (_msgRecvStartSentinel) {
                case 0:
                    if (buffer[i] == 83) {
                        ++_msgRecvStartSentinel;
                        _msgRecvEndSentinel = -1;
                        continue;
                    } else {
                        _msgRecv += 'D';
                        _msgRecvStartSentinel = _msgRecvEndSentinel = -1;
                    }
                    break;
                case 1:
                    if (buffer[i] == 84) {
                        ++_msgRecvStartSentinel;
                        _msgRecvEndSentinel = -1;
                        continue;
                    } else {
                        _msgRecv += 'DS';
                        _msgRecvStartSentinel = _msgRecvEndSentinel = -1;
                    }
                    break;
                case 2:
                    if (buffer[i] == 65) {
                        ++_msgRecvStartSentinel;
                        _msgRecvEndSentinel = -1;
                        continue;
                    } else {
                        _msgRecv += 'DST';
                        _msgRecvStartSentinel = _msgRecvEndSentinel = -1;
                    }
                    break;
                case 3:
                    if (buffer[i] == 82) {
                        ++_msgRecvStartSentinel;
                        _msgRecvEndSentinel = -1;
                        continue;
                    } else {
                        _msgRecv += 'DSTA';
                        _msgRecvStartSentinel = _msgRecvEndSentinel = -1;
                    }
                    break;
                case 4:
                    if (buffer[i] == 84) {
                        _msgRecv = '';
                        _msgRecvStartSentinel = HID_MESSAGE_START.length;
                        _msgRecvEndSentinel = -1;
                        continue;
                    } else {
                        _msgRecv += 'DSTAR';
                        _msgRecvStartSentinel = _msgRecvEndSentinel = -1;
                    }
                    break;
                }

                // end sentinel?
                switch (_msgRecvEndSentinel) {
                case 0:
                    if (buffer[i] == 69) {
                        ++_msgRecvEndSentinel;
                        continue;
                    } else {
                        _msgRecv += 'D';
                        _msgRecvEndSentinel = -1;
                    }
                    break;
                case 1:
                    if (buffer[i] == 78) {
                        ++_msgRecvEndSentinel;
                        continue;
                    } else {
                        _msgRecv += 'DE';
                        _msgRecvEndSentinel = -1;
                    }
                    break;
                case 2:
                    if (buffer[i] == 68) {
                        clearTimeout(timeout);
                        device.removeEventListener('inputreport', inputReportCallback);

                        try {
                            const jsonRecv = JSON.parse(_msgRecv);
                            success(jsonRecv);
                        } catch (error) {
                            reject(error);
                        }

                        _msgRecv = errorMarker;
                        _msgRecvStartSentinel = _msgRecvEndSentinel = -1;
                        break;
                    } else {
                        _msgRecv += 'DEN';
                        _msgRecvStartSentinel = _msgRecvEndSentinel = -1;
                    }
                    break;
                }

                _msgRecv += String.fromCharCode(buffer[i]);
            }
        };

        device.addEventListener('inputreport', inputReportCallback);
    };

    // hid message writer
    const writeMessage = async (device: HIDDevice | undefined,
                                message: string,
                                success: () => void,
                                reject: (reason?: any) => void) =>
    {
        if (! device) {
            reject('Anagram is not connected');
            return;
        }

        // trigger time-out if no data sent for 1s
        let timedout = false;
        const triggerRejectFromTimeout = () => {
            timedout = true;
        };
        let timeout = setTimeout(triggerRejectFromTimeout, 1000);

        const hasTimedout = (message: string) => {
            if (timedout) {
                reject(message);
                return true;
            }

            clearTimeout(timeout);
            timeout = setTimeout(triggerRejectFromTimeout, 1000);
            return false;
        };

        try {
            let done = false;

            // send message 1 HID block at a time
            for (let m = 0; m < message.length;)
            {
                const bytes = new Uint8Array(HID_REPORT_SIZE);
                const usableSize = Math.min(message.length - m, HID_REPORT_SIZE - 1);

                let b = 0;
                bytes[b++] = HID_REPORT_ID;

                if (m == 0)
                {
                    for (let i = 0; i < HID_MESSAGE_START.length; ++i, ++b) {
                        bytes[b] = HID_MESSAGE_START.charCodeAt(i);
                    }
                    for (; m < usableSize && b < HID_REPORT_SIZE; ++b, ++m) {
                        bytes[b] = message.charCodeAt(m);
                    }
                }
                else
                {
                    for (let i = 0; i < usableSize; ++i, ++b, ++m) {
                        bytes[b] = message.charCodeAt(m);
                    }
                }

                if (m === message.length && b + HID_MESSAGE_END.length < HID_REPORT_SIZE - 1) {
                    for (let i = 0; i < HID_MESSAGE_END.length; ++i, ++b) {
                        bytes[b] = HID_MESSAGE_END.charCodeAt(i);
                    }
                    done = true;
                }

                await device.sendReport(HID_DEVICE_ID, bytes);

                if (hasTimedout('Timed out writing Anagram message')) {
                    return;
                }
            }

            // sending terminator after all data
            if (! done)
            {
                const bytes = new Uint8Array(HID_REPORT_SIZE);
                bytes[0] = HID_REPORT_ID;

                for (let i = 0; i < HID_MESSAGE_END.length; ++i) {
                    bytes[i + 1] = HID_MESSAGE_END.charCodeAt(i);
                }

                // console.log(`writeMessage: ${bytes}`);
                await device.sendReport(HID_DEVICE_ID, bytes);

                if (hasTimedout('Timed out writing Anagram message terminator')) {
                    return;
                }
            }
        } catch (error) {
            clearTimeout(timeout);
            reject(error);
            return;
        }

        clearTimeout(timeout);
        success();
    };

    return hid;
};

// --------------------------------------------------------------------------------------------------------------------
