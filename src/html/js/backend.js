// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

// --------------------------------------------------------------------------------------------------------------------

const initBackend = () => {
    const notImplementedPromiseReject = () => new Promise((_, reject) => reject('Not implemented') );

    const backend = {
        data: {
            connected: false,
            connect: notImplementedPromiseReject,
            postMessageWithReply: (message) => {
                return notImplementedPromiseReject();
            },
            postMessageWithoutReply: (message) => {
            },
        },
        files: {
            connected: false,
            connect: notImplementedPromiseReject,
            release: notImplementedPromiseReject,
            transferPayload: notImplementedPromiseReject,
        },
        postInit: () => {},
    };

    // TESTING
    const dummy = createBackendDummy();
    backend.data = dummy.data;
    backend.files = dummy.files;

    backend.postInit();

    // all supported functions
    backend.findUserFiles = async () => {
        return await backend.data.postMessageWithReply({
            action: 'find_user_files',
            payload: {},
        });
    };

    return backend;
}

// --------------------------------------------------------------------------------------------------------------------
