// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import {
    DataBackend,
    MessageReplyTypes,
    MessageTypesWithReply,
    MessageTypesWithoutReply
} from '../types/backend-data';
import { FilesBackend } from '../types/backend-files';
import { MIDIAccess, MIDIConnectionEvent, MIDIInput, MIDIMessageEvent, MIDIOutput } from '../types/web';

// --------------------------------------------------------------------------------------------------------------------

interface BackendMIDI {
    connected: boolean;
    access?: MIDIAccess;
    input?: MIDIInput;
    output?: MIDIOutput;
    reconnectedCallback?: () => void;
    disconnectedCallback?: () => void;
}

type DataBackendMIDI = DataBackend & BackendMIDI;
type FilesBackendMIDI = FilesBackend & BackendMIDI;

// --------------------------------------------------------------------------------------------------------------------
// part of MIDI spec

const MIDI_SYSEX_START = 0xf0;
const MIDI_SYSEX_END = 0xf7;

// --------------------------------------------------------------------------------------------------------------------
// shared setup

const MIDI_SYSEX_BLOCK_SIZE = 0xff;
const MIDI_SYSEX_WAIT_COUNTER = 2;
const MIDI_TIMEOUT_MS = 5000;

const requestMIDIAccess = async (midi: BackendMIDI, withListener = true) => {
    if (typeof(navigator.requestMIDIAccess) === 'undefined') {
        throw ('Web MIDI is not supported in this browser');
    }
    if (typeof(midi.access) !== 'undefined') {
        throw ('MIDI already setup, cannot be called again');
    }

    try {
        midi.access = await navigator.requestMIDIAccess({ software: false, sysex: true });
    } catch (error) {
        throw (error);
    }

    if (! withListener) {
        return;
    }

    midi.access.addEventListener('statechange', (e: MIDIConnectionEvent) => {
        console.log("ACCESS statechange", e);
        const port = e.port;
        if (! port) {
            return;
        }
        if (port.state === 'connected') {
            if (! port.name || ! port.name.startsWith('Anagram')) {
                return;
            }
            switch (port.type) {
            case 'input':
                if (typeof(midi.input) === 'undefined') {
                    midi.input = port as MIDIInput;
                }
                break;
            case 'output':
                if (typeof(midi.output) === 'undefined') {
                    midi.output = port as MIDIOutput;
                }
                break;
            }
            if (!midi.connected &&
                typeof(midi.input) !== 'undefined' &&
                typeof(midi.output) !== 'undefined' &&
                typeof(midi.reconnectedCallback) !== 'undefined') {
                midi.reconnectedCallback();
            }
            return;
        }
        if (port.state === 'disconnected') {
            if (port === midi.input) {
                midi.input = undefined;
            }
            else if (port === midi.output) {
                midi.output = undefined;
            }
            if (midi.connected &&
                typeof(midi.input) === 'undefined' &&
                typeof(midi.output) === 'undefined' &&
                typeof(midi.disconnectedCallback) !== 'undefined') {
                midi.disconnectedCallback();
            }
            return;
        }
    });
};

const assignAnagramPorts = (midi: BackendMIDI) => {
    return new Promise<void>(async (success, reject) => {
        try {
            if (typeof(midi.access) === 'undefined') {
                throw ('MIDI access has not been granted yet');
            }

            let inputPort: MIDIInput | undefined;
            let outputPort: MIDIOutput | undefined;

            // NOTE compat with WebMIDI iOS app
            const inputs = [];
            const outputs = [];
            {
                // @ts-ignore
                const iter = midi.access.inputs.values();
                for (let o = iter.next(); !o.done; o = iter.next()) {
                    inputs.push(o.value);
                }
            }
            {
                // @ts-ignore
                const iter = midi.access.outputs.values()
                for (let o = iter.next(); !o.done; o = iter.next()) {
                    outputs.push(o.value);
                }
            }

            for (let port of inputs) {
                if (!port || ! port.name || ! port.name.startsWith('Anagram')) {
                    continue;
                }
                if (port.state !== 'connected') {
                    continue;
                }
                inputPort = port;
                break;
            }

            for (let port of outputs) {
                if (! port || ! port.name || ! port.name.startsWith('Anagram')) {
                    continue;
                }
                if (port.state !== 'connected') {
                    continue;
                }
                outputPort = port;
                break;
            }

            if (typeof(inputPort) === 'undefined' && typeof(outputPort) === 'undefined') {
                throw ('No MIDI ports available, Anagram is not connected?');
            }
            if (typeof(inputPort) === 'undefined') {
                throw ('MIDI Input not available');
            }
            if (typeof(outputPort) === 'undefined') {
                throw ('MIDI Output not available');
            }

            if (inputPort.connection !== 'open') {
                inputPort = await inputPort.open() as MIDIInput;
            }
            if (outputPort.connection !== 'open') {
                outputPort = await outputPort.open() as MIDIOutput;
            }

            midi.input = inputPort;
            midi.output = outputPort;

            success();
        } catch (error) {
            reject(error);
        }
    });
};

// --------------------------------------------------------------------------------------------------------------------

const createDataBackendWebMIDI = (): DataBackend => {
    const MIDI_SYSEX_BLOCK_ACK = [MIDI_SYSEX_START, 0x64, 0x67, 0x64, 0x61, MIDI_SYSEX_END]; // dgda
    const MIDI_SYSEX_BLOCK_START = [MIDI_SYSEX_START, 0x64, 0x67, 0x64, 0x73, MIDI_SYSEX_END]; // dgds
    const MIDI_SYSEX_BLOCK_MSG_PREFIX = [MIDI_SYSEX_START,0x64, 0x67, 0x64, 0x63]; // dgdc
    const MIDI_SYSEX_BLOCK_END = [MIDI_SYSEX_START, 0x64, 0x67, 0x64, 0x65, MIDI_SYSEX_END]; // dgde

    let busy = false;
    const midi: DataBackendMIDI = {
        connected: false,
        setup: (reconnectedCallback: () => void, disconnectedCallback: () => void) => {
            return new Promise(async (success, reject) => {
                try {
                    await requestMIDIAccess(midi);
                } catch (error) {
                    reject(error);
                    return;
                }

                // try to connect at start, ignore errors (Anagram might not be connected yet)
                try {
                    await assignAnagramPorts(midi);
                } catch (_) {}

                midi.reconnectedCallback = reconnectedCallback;
                midi.disconnectedCallback = disconnectedCallback;

                success();

                if (typeof(midi.input) !== 'undefined' && typeof(midi.output) !== 'undefined') {
                    reconnectedCallback();
                }
            });
        },
        connect: () => {
            return new Promise(async (success, reject) => {
                if (typeof(navigator.requestMIDIAccess) === 'undefined') {
                    reject('Web MIDI is not supported in this browser');
                    return;
                }
                if (typeof(midi.access) === 'undefined') {
                    reject('MIDI access has not been granted yet');
                    return;
                }
                if (typeof(midi.input) !== 'undefined' && typeof(midi.output) !== 'undefined') {
                    success();
                    return;
                }

                try {
                    await assignAnagramPorts(midi);
                } catch (reason) {
                    reject(reason);
                    return;
                }

                success();
            });
        },
        postMessageWithReply: (message: MessageTypesWithReply) => {
            return new Promise<MessageReplyTypes>(async (success, reject) => {
                if (busy) {
                    reject('Backend failure, multiple non-sequential requests are not supported!');
                    return;
                }

                busy = true;

                try {
                    await writeMessage(JSON.stringify(message));
                    const reply = await setupMessageReceiver();
                    busy = false;
                    success(reply);
                } catch (error) {
                    busy = false;
                    reject(error);
                }
            });
        },
        postMessageWithoutReply: (message: MessageTypesWithoutReply) => {
            return new Promise<void>(async (success, reject) => {
                busy = true;
                try {
                    await writeMessage(JSON.stringify(message));
                    busy = false;
                    success();
                } catch (reason) {
                    busy = false;
                    reject(reason);
                }
            });
        },
    };

    const setupMessageReceiver = () => {
        return new Promise<MessageReplyTypes>(async (success, reject) => {
            // keep local reference to ports, in case they are disconnected
            const inputPort = midi.input;
            const outputPort = midi.output;
            if (! inputPort || ! outputPort) {
                reject('Anagram is not connected');
                return;
            }

            // trigger time-out if no data received for 1s
            const triggerRejectFromTimeout = () => {
                removeListenerAndReject('Timed out waiting for Anagram reply');
            };
            let timeout = setTimeout(triggerRejectFromTimeout, MIDI_TIMEOUT_MS);

            // helper for reject, handle timeout and event listener
            const removeListenerAndReject = (error: string) => {
                clearTimeout(timeout);
                inputPort.removeEventListener('midimessage', messageReceivedCallback);
                reject(error);
            };

            let msg = 'ERROR-MISSING-START-SEQUENCE';
            const messageReceivedCallback = (ev: MIDIMessageEvent) => {
                if (! ev.data) {
                    return;
                }
                if (ev.data.length < 6) {
                    return;
                }
                if (ev.data[0] != MIDI_SYSEX_START || ev.data[ev.data.length - 1] != MIDI_SYSEX_END) {
                    return;
                }
                // start-type message
                for (let i = 0; i < MIDI_SYSEX_BLOCK_START.length; ++i) {
                    if (ev.data[i] != MIDI_SYSEX_BLOCK_START[i]) {
                        break
                    }
                    if (i === MIDI_SYSEX_BLOCK_START.length - 1) {
                        outputPort.send(MIDI_SYSEX_BLOCK_ACK);
                        msg = '';
                        return;
                    }
                }
                // end-type message
                for (let i = 0; i < MIDI_SYSEX_BLOCK_END.length; ++i) {
                    if (ev.data[i] != MIDI_SYSEX_BLOCK_END[i]) {
                        break
                    }
                    if (i === MIDI_SYSEX_BLOCK_END.length - 1) {
                        // NOTE we intentionally do not send ACK on block end

                        clearTimeout(timeout);
                        inputPort.removeEventListener('midimessage', messageReceivedCallback);

                        try {
                            // console.error("messageReceivedCallback with msg", msg);
                            const jsonRecv = JSON.parse(msg);
                            // console.error("messageReceivedCallback with parsed JSON", JSON.stringify(jsonRecv));
                            success(jsonRecv);
                        } catch (error) {
                            reject(error);
                        }
                        return;
                    }
                }
                // continue-type message
                for (let i = 0; i < MIDI_SYSEX_BLOCK_MSG_PREFIX.length; ++i) {
                    if (ev.data[i] !== MIDI_SYSEX_BLOCK_MSG_PREFIX[i]) {
                        return;
                    }
                }

                outputPort.send(MIDI_SYSEX_BLOCK_ACK);

                // decode 7bit data as string message
                let msgPart = '';
                for (let i = MIDI_SYSEX_BLOCK_MSG_PREFIX.length, bitShiftIndex = 0; i < ev.data.length - 2; ++i) {
                    const currentByte = ev.data[i] & 0x7f;
                    const nextByte = ev.data[i + 1] & 0x7f;
                    const bits = bitShiftIndex + 1;
                    const carry = (nextByte >> (7 - bits)) & ((1 << bits) - 1);
                    const upperPart = currentByte & ((1 << (7 - bitShiftIndex)) - 1);

                    const value = (upperPart << bits) | carry;
                    msgPart += String.fromCharCode(value);
                    ++bitShiftIndex;

                    if (bitShiftIndex == 7) {
                        bitShiftIndex = 0;
                        ++i;
                    }
                }

                clearTimeout(timeout);
                timeout = setTimeout(triggerRejectFromTimeout, MIDI_TIMEOUT_MS);

                msg += msgPart;
            };

            inputPort.addEventListener('midimessage', messageReceivedCallback);
        });
    };

    // MIDI message writer
    const writeMessage = (message: string) => {
        return new Promise<void>(async (success, reject) => {
            // keep local reference to ports, in case they are disconnected
            const inputPort = midi.input;
            const outputPort = midi.output;
            if (! inputPort || ! outputPort) {
                reject('Anagram is not connected');
                return;
            }

            // setup mechanism to wait for ACKs
            let ackSuccessCallback: (() => void) | undefined;
            const waitForACK = () => {
                return new Promise<void>((success, reject) => {
                    const ackTimeout = setTimeout(() => {
                        reject('Timed out waiting for Anagram ACK');
                    }, MIDI_TIMEOUT_MS);
                    ackSuccessCallback = () => {
                        ackSuccessCallback = undefined;
                        clearTimeout(ackTimeout);
                        success();
                    };
                });
            };
            const messageReceivedCallback = (ev: MIDIMessageEvent) => {
                if (! ev.data || ev.data.length !== MIDI_SYSEX_BLOCK_ACK.length) {
                    return;
                }
                for (let i = 0; i < MIDI_SYSEX_BLOCK_ACK.length; ++i) {
                    if (ev.data[i] !== MIDI_SYSEX_BLOCK_ACK[i]) {
                        return;
                    }
                }
                if (typeof(ackSuccessCallback) === 'undefined') {
                    throw ('ACK message received without being requested');
                }
                ackSuccessCallback();
            };
            inputPort.addEventListener('midimessage', messageReceivedCallback);

            // FIXME?
            const leftMask = (n: number) => {
                // return (uint8_t)((1 << n) - 1);
                return (1 << n) - 1;
            };

            try {
                // send sysex block start
                outputPort.send(MIDI_SYSEX_BLOCK_START);
                await waitForACK();

                let waitCounter = 0;

                // send message encoded as 7bit, split in MIDI_SYSEX_BLOCK_SIZE chunks
                for (let m = 0; m < message.length;)
                {
                    const sysex: Array<number> = MIDI_SYSEX_BLOCK_MSG_PREFIX.slice(0);

                    let carry = 0;
                    let carryBits = 0;
                    for (; m < message.length && sysex.length < MIDI_SYSEX_BLOCK_SIZE - 3; ++m)
                    {
                        const current = message.charCodeAt(m);
                        const septet = carry | (current >> (carryBits + 1));
                        sysex.push(septet);

                        carryBits++;
                        carry = (current & leftMask(carryBits)) << (7 - carryBits);

                        if (carryBits == 7) {
                            sysex.push(carry);
                            carry = 0;
                            carryBits = 0;
                        }
                    }
                    if (carryBits != 0) {
                        const septet = carry;
                        sysex.push(septet);
                    }
                    sysex[sysex.length - 1] &= 0x7f;
                    sysex.push(MIDI_SYSEX_END);

                    outputPort.send(sysex);

                    if (++waitCounter == MIDI_SYSEX_WAIT_COUNTER) {
                        waitCounter = 0;
                        await waitForACK();
                    }
                }

                // send sysex block end
                outputPort.send(MIDI_SYSEX_BLOCK_END);

                // NOTE we intentionally do not wait for ACK on block end

            } catch (error) {
                inputPort.removeEventListener('midimessage', messageReceivedCallback);
                reject(error);
                return;
            }

            inputPort.removeEventListener('midimessage', messageReceivedCallback);
            success();
        });
    };

    return midi;
};

const createFilesBackendWebMIDI = (): FilesBackend => {
    const MIDI_SYSEX_BLOCK_ACK = [MIDI_SYSEX_START, 0x64, 0x67, 0x66, 0x61, MIDI_SYSEX_END]; // dgfa
    const MIDI_SYSEX_BLOCK_START = [MIDI_SYSEX_START, 0x64, 0x67, 0x66, 0x73, MIDI_SYSEX_END]; // dgfs
    const MIDI_SYSEX_BLOCK_MSG_PREFIX = [MIDI_SYSEX_START,0x64, 0x67, 0x66, 0x63]; // dgfc
    const MIDI_SYSEX_BLOCK_END = [MIDI_SYSEX_START, 0x64, 0x67, 0x66, 0x65, MIDI_SYSEX_END]; // dgfe

    const midi: FilesBackendMIDI = {
        connected: false,
        setup: (reconnectedCallback: () => void, disconnectedCallback: () => void) => {
        },
        connect: () => {
            return new Promise(async (success, reject) => {
                if (typeof(navigator.requestMIDIAccess) === 'undefined') {
                    reject('Web MIDI is not supported in this browser');
                    return;
                }
                if (typeof(midi.input) !== 'undefined' && typeof(midi.output) !== 'undefined') {
                    success();
                    return;
                }

                if (typeof(midi.access) === 'undefined') {
                    try {
                        await requestMIDIAccess(midi, false);
                    } catch (reason) {
                        reject(reason);
                        return;
                    }
                }

                try {
                    await assignAnagramPorts(midi);
                } catch (reason) {
                    reject(reason);
                    return;
                }

                success();
            });
        },
        release: () => {
            return new Promise(async (success, _) => {
                if (typeof(midi.input) !== 'undefined') {
                    try {
                        await midi.input.close();
                    } catch (error) {}
                    midi.input = undefined;
                }
                if (typeof(midi.output) !== 'undefined') {
                    try {
                        midi.output.close();
                    } catch (error) {}
                    midi.output = undefined;
                }
                success();
            });
        },
        transferPayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => {
            return new Promise<void>(async (success, reject) => {
                // keep local reference to ports, in case they are disconnected
                const inputPort = midi.input;
                const outputPort = midi.output;
                if (! inputPort || ! outputPort) {
                    reject('Anagram is not connected');
                    return;
                }

                // setup mechanism to wait for ACKs
                let ackSuccessCallback: (() => void) | undefined;
                const waitForACK = () => {
                    return new Promise<void>((success, reject) => {
                        const ackTimeout = setTimeout(() => {
                            reject('Timed out waiting for Anagram ACK');
                        }, MIDI_TIMEOUT_MS);
                        ackSuccessCallback = () => {
                            ackSuccessCallback = undefined;
                            clearTimeout(ackTimeout);
                            success();
                        };
                    });
                };
                const messageReceivedCallback = (ev: MIDIMessageEvent) => {
                    if (! ev.data || ev.data.length !== MIDI_SYSEX_BLOCK_ACK.length) {
                        return;
                    }
                    for (let i = 0; i < MIDI_SYSEX_BLOCK_ACK.length; ++i) {
                        if (ev.data[i] !== MIDI_SYSEX_BLOCK_ACK[i]) {
                            return;
                        }
                    }
                    if (typeof(ackSuccessCallback) === 'undefined') {
                        throw ('ACK message received without being requested');
                    }
                    ackSuccessCallback();
                };
                inputPort.addEventListener('midimessage', messageReceivedCallback);

                // FIXME?
                const leftMask = (n: number) => {
                    // return (uint8_t)((1 << n) - 1);
                    return (1 << n) - 1;
                };

                try {
                    // send sysex block start
                    outputPort.send(MIDI_SYSEX_BLOCK_START);
                    await waitForACK();

                    let waitCounter = 0;

                    // send message encoded as 7bit, split in MIDI_SYSEX_BLOCK_SIZE chunks
                    for (let p = 0, last = -1; p < payload.length;)
                    {
                        const sysex: Array<number> = MIDI_SYSEX_BLOCK_MSG_PREFIX.slice(0);

                        let carry = 0;
                        let carryBits = 0;
                        for (; p < payload.length && sysex.length < MIDI_SYSEX_BLOCK_SIZE - 3; ++p)
                        {
                            const progress = parseInt((p / payload.length * 100).toFixed(0));
                            if (progress != last) {
                                last = progress;
                                progressCallback(progress);
                            }

                            const current = payload[p];
                            const septet = carry | (current >> (carryBits + 1));
                            sysex.push(septet);

                            carryBits++;
                            carry = (current & leftMask(carryBits)) << (7 - carryBits);

                            if (carryBits == 7) {
                                sysex.push(carry);
                                carry = 0;
                                carryBits = 0;
                            }
                        }
                        if (carryBits != 0) {
                            const septet = carry;
                            sysex.push(septet);
                        }
                        sysex[sysex.length - 1] &= 0x7f;
                        sysex.push(MIDI_SYSEX_END);

                        outputPort.send(sysex);

                        if (++waitCounter == MIDI_SYSEX_WAIT_COUNTER) {
                            waitCounter = 0;
                            await waitForACK();
                        }
                    }

                    // send sysex block end
                    outputPort.send(MIDI_SYSEX_BLOCK_END);

                    // NOTE we intentionally do not wait for ACK on block end

                } catch (error) {
                    inputPort.removeEventListener('midimessage', messageReceivedCallback);
                    reject(error);
                    return;
                }

                inputPort.removeEventListener('midimessage', messageReceivedCallback);
                success();
            });
        },
        receivePayload: (progressCallback: (progress: number) => void) => {
            return new Promise<Uint8Array>((success, reject) => {
                // keep local reference to ports, in case they are disconnected
                const inputPort = midi.input;
                const outputPort = midi.output;
                if (! inputPort || ! outputPort) {
                    reject('Anagram is not connected');
                    return;
                }

                reject('Not implemented yet');
            });
        },
    };
    return midi;
};

// --------------------------------------------------------------------------------------------------------------------
// @anagram-comm-layer begin-exports

export { createDataBackendWebMIDI, createFilesBackendWebMIDI }

// --------------------------------------------------------------------------------------------------------------------
