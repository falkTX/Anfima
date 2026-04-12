// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { FilesBackend } from '../types/backend-files';
import { SerialPort } from '../types/web';
import {} from '../types/constants';

// --------------------------------------------------------------------------------------------------------------------

interface FilesBackendSerial extends FilesBackend {
    port?: SerialPort;
    reader?: ReadableStreamDefaultReader<Uint8Array>;
    writer?: WritableStreamDefaultWriter<Uint8Array>;
}

// --------------------------------------------------------------------------------------------------------------------

let WebSerialSetupComplete = false;

// --------------------------------------------------------------------------------------------------------------------

const createFilesBackendWebSerial = (): FilesBackend => {
    const SERIAL_CMD_SIZE = 13;
    const SERIAL_MAX_PAYLOAD_SIZE = 0x2000;

    // open a serial port as needed, returning the reader and writer
    const openSerialPort = async (port: SerialPort) => {
        if (! port.readable || ! port.writable) {
            await port.open({ baudRate: 115200, dataBits: 8, flowControl: 'none', parity: 'none' });
        }

        if (port.readable == null) {
            throw('Serial port is not readable');
        }

        if (port.writable == null) {
            throw('Serial port is not writable');
        }

        return {
            reader: port.readable.getReader(),
            writer: port.writable.getWriter(),
        };
    };

    const serial: FilesBackendSerial = {
        connected: false,
        setup: (reconnectedCallback: () => void, disconnectedCallback: () => void) => {
            if (WebSerialSetupComplete) {
                throw ('Serial already setup, cannot be called again');
            }

            navigator.serial.addEventListener('connect', async (e: Event) => {
                // console.log(`Serial device connected`);
                // console.dir(e);

                // already connected
                if (typeof(serial.port) !== 'undefined') {
                    return;
                }

                const port = e.target as SerialPort;
                const info = port.getInfo();

                // wrong device?
                if (info.usbVendorId != DEVICE_VENDOR_ID || info.usbProductId != DEVICE_PRODUCT_ID) {
                    return;
                }

                const { reader, writer } = await openSerialPort(port);

                serial.port = port;
                serial.reader = reader;
                serial.writer = writer;

                reconnectedCallback();
            });

            navigator.serial.addEventListener('disconnect', (e: Event) => {
                // console.log(`Serial device disconnected`);
                // console.dir(e);

                const port = e.target as SerialPort;

                if (port == serial.port) {
                    serial.port = serial.reader = serial.writer = undefined;
                    disconnectedCallback();
                }
            });

            WebSerialSetupComplete = true;
        },
        connect: () => {
            return new Promise<void>(async (success, reject) => {
                if (typeof(navigator.serial) === 'undefined') {
                    reject('Web Serial is not supported in this browser');
                    return;
                }
                if (! WebSerialSetupComplete) {
                    reject('Web Serial has not been setup yet');
                    return;
                }

                // reconnects are allowed but only if we are able to aquire reader and writer
                if (typeof(serial.port) !== 'undefined') {
                    if (typeof(serial.reader) === 'undefined') {
                        if (serial.port.readable) {
                            serial.reader = serial.port.readable.getReader();
                        } else {
                            reject('Failed to reconnect, non-readable serial port');
                            return;
                        }
                    }
                    if (typeof(serial.writer) === 'undefined') {
                        if (serial.port.writable) {
                            serial.writer = serial.port.writable.getWriter();
                        } else {
                            reject('Failed to reconnect, non-writable serial port');
                            return;
                        }
                    }
                    success();
                    return;
                }

                try {
                    let port: SerialPort;

                    const ports = await navigator.serial.getPorts();
                    if (ports.length !== 0) {
                        port = ports[0];
                    } else {
                        port = await navigator.serial.requestPort({
                            filters: [ { usbVendorId: DEVICE_VENDOR_ID, usbProductId: DEVICE_PRODUCT_ID } ],
                        });
                    }

                    if (! port) {
                        throw ('Failed to get serial port');
                    }

                    const { reader, writer } = await openSerialPort(port);

                    serial.port = port;
                    serial.reader = reader;
                    serial.writer = writer;

                } catch (reason) {
                    reject(reason);
                    return;
                }

                success();
            });
        },
        release: () => {
            return new Promise<void>((success, _) => {
                if (serial.reader) {
                    try {
                        serial.reader.releaseLock();
                    } catch (error) {}
                    serial.reader = undefined;
                }
                if (serial.writer) {
                    try {
                        serial.writer.releaseLock();
                    } catch (error) {}
                    serial.writer = undefined;
                }
                success();
            });
        },
        transferPayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => {
            return new Promise<void>(async (success, reject) => {
                const reader = serial.reader;
                const writer = serial.writer;

                if (! reader) {
                    reject('Serial port is not readable');
                    return;
                }
                if (! writer) {
                    reject('Serial port is not writable');
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
                    // encode size command as first byte, followed by total size
                    {
                        const bytes = new Uint8Array(SERIAL_CMD_SIZE);

                        const msg = 's 0x' + payload.length.toString(16);
                        for (let i = 0; i < msg.length; ++i) {
                            bytes[i] = msg.charCodeAt(i);
                        }

                        await writer.write(bytes);

                        if (hasTimedout('Timed out transfering payload size')) {
                            return;
                        }
                    }

                    // process in chunks of SERIAL_MAX_PAYLOAD_SIZE
                    for (let p = 0, last = -1; p < payload.length; p += SERIAL_MAX_PAYLOAD_SIZE)
                    {
                        const progress = parseInt((p / payload.length * 100).toFixed(0));
                        if (progress != last) {
                            last = progress;
                            progressCallback(progress);
                        }

                        const size = Math.min(payload.length - p, SERIAL_MAX_PAYLOAD_SIZE);
                        const bytes = new Uint8Array(SERIAL_CMD_SIZE + size);

                        // encode write command as first byte, followed by payload size, and then the payload
                        const msg = 'w 0x' + size.toString(16);
                        for (let i = 0; i < msg.length; ++i) {
                            bytes[i] = msg.charCodeAt(i);
                        }

                        // payload
                        for (let i = 0; i < size; ++i) {
                            bytes[SERIAL_CMD_SIZE + i] = payload[p + i];
                        }

                        await writer.write(bytes);

                        if (hasTimedout('Timed out transfering payload data')) {
                            return;
                        }

                        // read response
                        // const { value, done } =
                        await reader.read();

                        if (hasTimedout('Timed out receiving payload ACK')) {
                            return;
                        }
                    }

                    // encode quit command as first byte
                    {
                        const bytes = new Uint8Array(SERIAL_CMD_SIZE);

                        // encode quit command
                        const msg = 'q';
                        for (let i = 0; i < msg.length; ++i) {
                            bytes[i] = msg.charCodeAt(i);
                        }

                        await writer.write(bytes);

                        if (hasTimedout('Timed out transfering payload terminator')) {
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
            });
        },
        receivePayload: (progressCallback: (progress: number) => void) => {
            return new Promise<Uint8Array>(async (success, reject) => {
                const reader = serial.reader;
                const writer = serial.writer;

                if (! reader) {
                    reject('Serial port is not readable');
                    return;
                }
                if (! writer) {
                    reject('Serial port is not writable');
                    return;
                }

                // trigger time-out if no data received for 1s
                let timedout = false;
                const triggerRejectFromTimeout = () => {
                    timedout = true;
                };
                let timeout = setTimeout(triggerRejectFromTimeout, 1000);

                const hasTimedout = () => {
                    if (timedout) {
                        return true;
                    }
                    clearTimeout(timeout);
                    timeout = setTimeout(triggerRejectFromTimeout, 1000);
                    return false;
                };

                let recvData = new Uint8Array;
                const reallocData = (other: Uint8Array) => {
                    var merged = new Uint8Array(recvData.length + other.length);
                    merged.set(recvData);
                    merged.set(other, recvData.length);
                    recvData = merged;
                };
                const readCommand = async () => {
                    while (recvData.length < SERIAL_CMD_SIZE) {
                        const { value } = await reader.read();
                        if (hasTimedout()) {
                            throw ('Timed out reading serial command');
                        }
                        if (typeof(value) === 'undefined') {
                            throw ('Missing data while reading serial command');
                        }
                        reallocData(value);
                    }
                    const cmd = recvData.slice(0, SERIAL_CMD_SIZE);
                    recvData = recvData.slice(SERIAL_CMD_SIZE);
                    return cmd;
                };
                const readData = async (size: number) => {
                    while (recvData.length < size) {
                        const { value } = await reader.read();
                        if (hasTimedout()) {
                            throw ('Timed out reading serial data');
                        }
                        if (typeof(value) === 'undefined') {
                            throw ('Missing data while reading serial data');
                        }
                        reallocData(value);
                    }
                    const data = recvData.slice(0, size);
                    recvData = recvData.slice(size);
                    return data;
                };

                const payloadData: Array<Uint8Array> = [];

                try {
                    // expect size command as first byte, followed by total size
                    let cmd = await readCommand();

                    if (cmd[0] != 's'.charCodeAt(0) || cmd[1] != ' '.charCodeAt(0)) {
                        throw ('unexpected data received (invalid first command)');
                    }

                    // size comes as 2nd arg
                    const fullSize = parseInt(cmd.slice(2,-1).reduce((str, c) => str + String.fromCharCode(c), ''), 16);

                    let current = 0, last = -1, quitReceived = false;
                    while (current != fullSize)
                    {
                        const progress = parseInt((current / fullSize * 100).toFixed(0));
                        if (progress != last) {
                            last = progress;
                            progressCallback(progress);
                        }

                        // waiting for command
                        cmd = await readCommand();

                        if (cmd[0] == 'q'.charCodeAt(0) && cmd[1] == 0) {
                            quitReceived = true;
                            break;
                        }

                        if (cmd[0] != 'w'.charCodeAt(0) || cmd[1] != ' '.charCodeAt(0)) {
                            throw ('unexpected data received (invalid command)');
                        }

                        // size comes as 2nd arg
                        const size = parseInt(cmd.slice(2,-1).reduce((str, c) => str + String.fromCharCode(c), ''), 16);

                        // waiting for payload
                        const data = await readData(size);

                        // payload received, sending ACK
                        {
                            const bytes = new Uint8Array(SERIAL_CMD_SIZE);
                            const msg = 'ok';
                            for (let i = 0; i < msg.length; ++i) {
                                bytes[i] = msg.charCodeAt(i);
                            }

                            await writer.write(bytes);

                            if (hasTimedout()) {
                                throw ('Timed out transfering ACK');
                            }
                        }

                        // write received buffer to future merged payload
                        payloadData.push(data);

                        current += size;
                    }

                    // wait for quit command
                    if (! quitReceived) {
                        cmd = await readCommand();

                        if (cmd[0] != 'q'.charCodeAt(0) || cmd[1] != 0) {
                            throw ('unexpected data received (invalid quit command)');
                        }
                    }
                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                    return;
                }

                // merge payload data
                const payloadLength = payloadData.reduce((length, data) => length + data.length, 0);
                const payload = new Uint8Array(payloadLength);

                let length = 0;
                for (let data of payloadData) {
                    payload.set(data, length);
                    length += data.length;
                }

                clearTimeout(timeout);
                success(payload);
            });
        },
    };

    return serial;
};

// --------------------------------------------------------------------------------------------------------------------
// @anagram-comm-layer begin-exports

export { createFilesBackendWebSerial }

// --------------------------------------------------------------------------------------------------------------------
