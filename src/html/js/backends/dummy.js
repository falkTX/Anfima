// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

// --------------------------------------------------------------------------------------------------------------------

const createBackendDummy = () => {
    const notImplementedPromiseReject = () => new Promise((_, reject) => reject('Not implemented in Dummy') );

    const dummyData = {
        find_user_files: {
            payload: {
                data: [
                    { dir_name: 'cabinet', category: 'cabinets', id: 1, fileName: 'test1.wav', name: 'test1' },
                    { dir_name: 'cabinet', category: 'cabinets', id: 2, fileName: 'test2.wav', name: 'test2' },
                    { dir_name: 'cabinet', category: 'cabinets', id: 3, fileName: 'test3.wav', name: 'test3' },
                    { dir_name: 'cabinet', category: 'cabinets', id: 4, fileName: 'test4.wav', name: 'test4' },
                ],
            },
        },
        update_user_file: {
            payload: {
                success: 1,
                err_message: '',
                data: {
                    name: 'dummy name for rename complete',
                },
            },
        },
    };

    const timeoutFast = 0;
    const timeoutSlow = 0;

    return {
        data: {
            connected: false,
            connect: () => {
                return new Promise((success, reject) => {
                    setTimeout(success, timeoutFast);
                });
            },
            postMessageWithReply: (message) => {
                return new Promise((success, reject) => {
                    const data = dummyData[message.action];
                    setTimeout(() => { success(data) }, timeoutSlow);
                });
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
    };
};

// --------------------------------------------------------------------------------------------------------------------
