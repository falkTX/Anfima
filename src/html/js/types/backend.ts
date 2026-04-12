// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

interface Message {
    action: string;
    payload: any;
};

interface MessageReply {
    action: string;
    payload: any;
};

interface DataBackend {
    connected: boolean;
    connect: (connectedCallback: () => void, disconnectedCallback: () => void) => Promise<void>;
    postMessageWithReply: (message: Message) => Promise<MessageReply>;
    postMessageWithoutReply: (message: Message) => Promise<void>;
};

interface FilesBackend {
    connected: boolean;
    connect: (connectedCallback: () => void, disconnectedCallback: () => void) => Promise<void>;
    release: () => Promise<void>;
    transferPayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => Promise<void>;
};

interface Backend {
    data: DataBackend,
    files: FilesBackend,
    postInit?: () => void,
}

interface BackendWithMethods extends Backend {
    // postInit always valid
    postInit: () => void,
    // functions with reply
    exportAnagramLogs: () => Promise<MessageReply>;
    fetchFirmwareVersion: () => Promise<MessageReply>;
    findUserFiles: () => Promise<MessageReply>;
    openFileReceiver: (arg: any) => Promise<MessageReply>;
    updateUserFile: (arg: any) => Promise<MessageReply>;
    removeUserFile: (arg: any) => Promise<MessageReply>;
    // functions without reply
    firmwareTransferCompleted: () => Promise<void>;
    reboot: () => Promise<void>;
    // utilities
    transferSinglePayload: (payload: Uint8Array, progressCallback: (progress: number) => void) => Promise<void>;
}

declare global {
    const initBackend: () => BackendWithMethods;
}

export { Backend, BackendWithMethods, DataBackend, FilesBackend, Message, MessageReply };
