// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

// --------------------------------------------------------------------------------------------------------------------

const createBackendDummy = () => {
    const notImplementedPromiseReject = () => new Promise((_, reject) => reject('Not implemented in Dummy') );

    const date = '2026-04-11T11:14:02.659Z';
    const dummyData = {
        find_user_files: {
            action: 'find_user_files_res',
            payload: {
                data: [
                    { category: 'Amps', created_at: date, dir_name: 'neural-models', file_name: 'C1.nam', file_size: 283092, gain: 0, id: 1, name: 'test1', original_file_name: 'test1.nam', tags: [], updated_at: date, uris: [], },
                    // "Pedals", "Miscellaneous"
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A10.wav', file_size: 393260, gain: 0, id: 2, name: 'test2', original_file_name: 'test2.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A11.wav', file_size: 393260, gain: 0, id: 3, name: 'test3', original_file_name: 'test3.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A12.wav', file_size: 396550, gain: 0, id: 4, name: 'test4', original_file_name: 'test4.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
                    { category: '', created_at: date, dir_name: 'cabinets', file_name: 'A13.wav', file_size: 396550, gain: 0, id: 5, name: 'test5', original_file_name: 'test5.wav', tags: [], updated_at: date, uris: ['urn:darkglass:User Guitar Cabinet'], },
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
