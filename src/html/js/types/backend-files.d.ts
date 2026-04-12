// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@darkglass.com>
// SPDX-License-Identifier: ISC

interface FilesBackend {
    connected: boolean;
    setup: (reconnectedCallback: () => void, disconnectedCallback: () => void) => void;
    connect: () => Promise<void>;
    release: () => Promise<void>;
    transferPayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => Promise<void>;
    receivePayload: (progressCallback: (progress: number) => void) => Promise<Uint8Array>;
}

interface FilesBackendMethods {
    // check/request permission
    prepareForPayload: () => Promise<void>;
    // utilities
    transferSinglePayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => Promise<void>;
    receiveSinglePayload: (connectedCallback: () => Promise<void>,
                           progressCallback: (progress: number) => void) => Promise<Uint8Array>;
}

export { FilesBackend, FilesBackendMethods };
