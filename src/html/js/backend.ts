// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

// --------------------------------------------------------------------------------------------------------------------

import { DataBackend } from './types/backend-data';
import { FilesBackend } from './types/backend-files';
import {} from './types/web';

import { AnfimaBackend } from './anfima-types/backend.js';
import {} from './anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------

const initAnfimaBackend = (): AnfimaBackend => {
    const notImplementedPromiseReject = () => new Promise<any>((_, reject) => reject('Not implemented') );
    const unsupportedPromiseReject = () => new Promise<any>((_, reject) => reject('Unsupported web browser') );

    let data: DataBackend | undefined;
    let files: FilesBackend | undefined;
    let postInit: (() => void) | undefined;

    if (typeof(RunningFromDPF) !== 'undefined' && RunningFromDPF) {
        // running through DPF standalone
        data = createDataBackendDPF();
        files = createFilesBackendDPF();
        postInit = dpfPostInit;
    } else {
        // running through web browser, find best possible backend
        if (typeof(navigator.hid) !== 'undefined') {
            data = createDataBackendWebHID();
        }
        else if (typeof(navigator.bluetooth) !== 'undefined') {
            data = createDataBackendWebBluetooth();
        }
        else if (typeof(navigator.requestMIDIAccess) !== 'undefined') {
            data = createDataBackendWebMIDI();
        }

        if (typeof(navigator.serial) !== 'undefined') {
            files = createFilesBackendWebSerial();
        }
        else if (typeof(navigator.requestMIDIAccess) !== 'undefined') {
            files = createFilesBackendWebMIDI();
        }
    }

    if (typeof(data) === 'undefined') {
        data = {
            connected: false,
            setup: unsupportedPromiseReject,
            connect: unsupportedPromiseReject,
            postMessageWithReply: notImplementedPromiseReject,
            postMessageWithoutReply: notImplementedPromiseReject,
        };
    }
    if (typeof(files) === 'undefined') {
        files = {
            connected: false,
            setup: unsupportedPromiseReject,
            connect: unsupportedPromiseReject,
            release: notImplementedPromiseReject,
            transferPayload: notImplementedPromiseReject,
            receivePayload: notImplementedPromiseReject,
        };
    }
    if (typeof(postInit) === 'undefined') {
        postInit = () => {};
    }

    return {
        data,
        files,
        postInit,
        ...initDataBackend(data),
        ...initFilesBackend(files),
    };
};

// --------------------------------------------------------------------------------------------------------------------
