// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

import { Backend, DataBackend, FilesBackend } from './backend.js';

declare global {
    const createBackendDPF: () => Backend;
    const createBackendDummy: () => Backend;
    const createDataBackendWebBluetooth: () => DataBackend;
    const createDataBackendWebHID: () => DataBackend;
    const createFilesBackendWebMIDI: () => FilesBackend;
    const createFilesBackendWebSerial: () => FilesBackend;
    const createBackendHTTP: () => Backend;
}

export {};
