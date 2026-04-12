// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@darkglass.com>
// SPDX-License-Identifier: ISC

import {
    CheckFirmwareLicensingMessageReply,
    DataBackend,
    DataBackendMethods,
    DeletePluginMessageReply,
    EditSettingsMessageReply,
    ExportAnagramLogsMessageReply,
    ExportSettingsMessageReply,
    FetchFirmwareVersionMessageReply,
    FindUserFilesMessage,
    FindUserFilesMessageReply,
    GetAnagramPresetPositionsMessageReply,
    GetFileByFilenameMessageReply,
    GetPluginInfoMessageReply,
    MessageReply,
    MessageTypesWithReply,
    OpenFileReceiverMessageReply,
    OpenFileSenderMessageReply,
    ReadAllPluginsMessage,
    ReadAllPluginsMessageReply,
    RemoveUserFileMessageReply,
    RequestFirmwareLicensingMessageReply,
    RequestPluginsLicensingMessageReply,
    RevokePluginLicensingMessageReply,
    UpdateUserFileMessageReply,
    kPluginLicenseFree,
    kPluginLicenseTrial,
    kPluginLicensePurchased,
} from './types/backend-data';

// --------------------------------------------------------------------------------------------------------------------

const kPluginLicenseFree: kPluginLicenseFree = 0;
const kPluginLicenseTrial: kPluginLicenseTrial = 1;
const kPluginLicensePurchased: kPluginLicensePurchased = 2;

// --------------------------------------------------------------------------------------------------------------------

const initDataBackend = (backend: DataBackend): DataBackendMethods => {
    const checkBaseReply = <T>(action: string, reply: MessageReply) => {
        if (typeof(reply.action) !== 'string' || typeof(reply.payload) !== 'object') {
            throw (`Invalid reply for ${ action }`);
        }
        // BUG typo
        if (action === 'update_user_file') {
            action += 's';
        }
        if (reply.action !== action + '_res') {
            throw (`Mismatch reply action, expected: ${ action }_res, got: ${ reply.action }`);
        }
        return (reply as unknown) as T;
    };

    return {
        // data functions with reply
        checkFirmwareLicensing: () => {
            return new Promise<CheckFirmwareLicensingMessageReply>((success, reject) => {
                const action = 'check_firmware_licensing';
                backend.postMessageWithReply({
                    action,
                    payload: {},
                }).then(_reply => {
                    const reply = checkBaseReply<CheckFirmwareLicensingMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        deletePlugin: (payload) => {
            return new Promise<DeletePluginMessageReply>((success, reject) => {
                const action = 'delete_plugin';
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<DeletePluginMessageReply>(action, _reply);
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        editSettings: (settings) => {
            return new Promise<EditSettingsMessageReply>((success, reject) => {
                const action = 'edit_settings';
                backend.postMessageWithReply({
                    action,
                    payload: { settings },
                }).then(_reply => {
                    const reply = checkBaseReply<EditSettingsMessageReply>(action, _reply);
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        exportAnagramLogs: () => {
            return new Promise<ExportAnagramLogsMessageReply>((success, reject) => {
                const action = 'export_anagram_logs';
                backend.postMessageWithReply({
                    action,
                    payload: {},
                }).then(_reply => {
                    const reply = checkBaseReply<ExportAnagramLogsMessageReply>(action, _reply);
                    if (typeof(reply.payload.message) !== 'string') {
                        throw (`Invalid reply payload message for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        exportSettings: () => {
            return new Promise<ExportSettingsMessageReply>((success, reject) => {
                const action = 'export_settings';
                backend.postMessageWithReply({
                    action,
                    payload: {},
                }).then(_reply => {
                    const reply = checkBaseReply<ExportSettingsMessageReply>(action, _reply);
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        fetchFirmwareVersion: () => {
            return new Promise<FetchFirmwareVersionMessageReply>((success, reject) => {
                const action = 'fetch_firmware_version';
                backend.postMessageWithReply({
                    action,
                    payload: {},
                }).then(_reply => {
                    const reply = checkBaseReply<FetchFirmwareVersionMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.data.version) !== 'string') {
                        throw (`Invalid reply payload data version for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    // NOTE capabilities is only supported since v1.14
                    if (typeof(reply.payload.data.capabilities) === 'undefined') {
                        reply.payload.data.capabilities = [];
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        findUserFiles: (payload) => {
            return new Promise<FindUserFilesMessageReply>((success, reject) => {
                const action = 'find_user_files';
                // NOTE payload is optional
                if (typeof(payload) === 'undefined') {
                    payload = {};
                } else {
                    // NOTE if payload is provided, all fields must be present
                    const test = payload as Extract<FindUserFilesMessage['payload'], { pageNum: number }>;
                    if (typeof(test.pageNum) === 'undefined' || typeof(test.selectedDir) === 'undefined') {
                        reject(`Invalid payload for ${ action }`);
                        return;
                    }
                }
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<FindUserFilesMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        getAnagramPresetPositions: () => {
            return new Promise<GetAnagramPresetPositionsMessageReply>((success, reject) => {
                const action = 'get_anagram_preset_positions';
                backend.postMessageWithReply({
                    action,
                    payload: {},
                }).then(_reply => {
                    const reply = checkBaseReply<GetAnagramPresetPositionsMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.data.files) !== 'object') {
                        throw (`Invalid reply payload data files for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        getFileByFilename: (payload) => {
            return new Promise<GetFileByFilenameMessageReply>((success, reject) => {
                const action = 'get_file_by_file_name';
                // NOTE `name` argument was always unused, then removed in v1.15
                if (typeof((payload as any).name) !== 'string') {
                    (payload as any).name = '';
                }
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<GetFileByFilenameMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.message) !== 'string') {
                        throw (`Invalid reply payload message for ${ action }`);
                    }
                    if (reply.payload.message.length !== 0) {
                        throw (reply.payload.message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        getPluginInfo: (payload) => {
            return new Promise<GetPluginInfoMessageReply>((success, reject) => {
                const action = 'get_plugin_info';
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<GetPluginInfoMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    // only check 1 property, assume others are there
                    if (typeof(reply.payload.data.abbreviation) === 'undefined') {
                        throw ('Missing plugin data');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        openFileReceiver: (payload) => {
            return new Promise<OpenFileReceiverMessageReply>((success, reject) => {
                const action = 'open_file_receiver';

                let message: MessageTypesWithReply;
                switch (payload.dirName) {
                case 'backup':
                    message = { action, payload };
                    break;
                case 'cabinets':
                case 'neural-models':
                case 'reverbs':
                    message = { action, payload };
                    break;
                case 'lv2':
                    message = { action, payload };
                    break;
                case '':
                    message = { action, payload };
                    break;
                default:
                    reject(`Invalid payload dirName for ${ action }`);
                    return;
                }

                backend.postMessageWithReply(message).then(_reply => {
                    const reply = checkBaseReply<OpenFileReceiverMessageReply>(action, _reply);
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        openFileSender: (payload) => {
            return new Promise<OpenFileSenderMessageReply>((success, reject) => {
                const action = 'open_file_sender';

                let message: MessageTypesWithReply;
                switch (payload.dirName) {
                case 'backup':
                    message = { action, payload };
                    break;
                case 'cabinets':
                case 'neural-models':
                case 'reverbs':
                    message = { action, payload };
                    break;
                case 'lv2':
                    message = { action, payload };
                    break;
                default:
                    reject(`Invalid payload dirName for ${ action }`);
                    return;
                }

                backend.postMessageWithReply(message).then(_reply => {
                    const reply = checkBaseReply<OpenFileSenderMessageReply>(action, _reply);
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        readAllPlugins: (payload) => {
            return new Promise<ReadAllPluginsMessageReply>((success, reject) => {
                const action = 'read_all_plugins';
                // NOTE payload is optional
                if (typeof(payload) === 'undefined') {
                    payload = {};
                } else {
                    // NOTE if payload is provided, all fields must be present
                    const test = payload as Extract<ReadAllPluginsMessage['payload'], { filterOption: string }>;
                    if (typeof(test.filterOption) === 'undefined') {
                        reject(`Invalid payload for ${ action }`);
                        return;
                    }
                }
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<ReadAllPluginsMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        removeUserFile: (payload) => {
            return new Promise<RemoveUserFileMessageReply>((success, reject) => {
                const action = 'remove_user_file';
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<RemoveUserFileMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    if (! reply.payload.fs_success) {
                        console.warn('Failed to delete file, maybe already deleted?');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        requestFirmwareLicensing: (payload) => {
            return new Promise<RequestFirmwareLicensingMessageReply>((success, reject) => {
                const action = 'request_firmware_licensing';

                let message: MessageTypesWithReply;
                switch (payload.action) {
                case 'license':
                    message = { action, payload };
                    break;
                case 'nonce':
                    message = { action, payload };
                    break;
                case 'token':
                    message = { action, payload };
                    break;
                default:
                    reject(`Invalid payload action for ${ action }`);
                    return;
                }

                backend.postMessageWithReply(message).then(_reply => {
                    const reply = checkBaseReply<RequestFirmwareLicensingMessageReply>(action, _reply);
                    if (typeof(reply.payload.action) !== 'string') {
                        throw (`Invalid reply payload action for ${ action }`);
                    }
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.data.message) !== 'string') {
                        throw (`Invalid reply payload data message for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        requestPluginsLicensing: (payload) => {
            return new Promise<RequestPluginsLicensingMessageReply>((success, reject) => {
                const action = 'request_plugins_licensing';
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<RequestPluginsLicensingMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.data.message) !== 'string') {
                        throw (`Invalid reply payload data message for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        revokePluginLicensing: (payload) => {
            return new Promise<RevokePluginLicensingMessageReply>((success, reject) => {
                const action = 'revoke_plugin_licensing';
                // NOTE payload is optional
                if (typeof(payload) === 'undefined') {
                    payload = { uri: '' };
                }
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<RevokePluginLicensingMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.data.removeAll) !== 'boolean') {
                        throw (`Invalid reply payload data removeAll for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        updateUserFile: (payload) => {
            return new Promise<UpdateUserFileMessageReply>((success, reject) => {
                const action = 'update_user_file';
                backend.postMessageWithReply({
                    action,
                    payload,
                }).then(_reply => {
                    const reply = checkBaseReply<UpdateUserFileMessageReply>(action, _reply);
                    if (typeof(reply.payload.data) !== 'object') {
                        throw (`Invalid reply payload data for ${ action }`);
                    }
                    if (typeof(reply.payload.err_message) !== 'string') {
                        throw (`Invalid reply payload err_message for ${ action }`);
                    }
                    if (reply.payload.err_message.length !== 0) {
                        throw (reply.payload.err_message);
                    }
                    if (! reply.payload.db_success) {
                        throw ('Failed with unknown database error');
                    }
                    if (! reply.payload.success) {
                        throw ('Failed with unknown error');
                    }
                    success(reply);
                }).catch(reject);
            });
        },

        // data functions without reply
        firmwareTransferCompleted: async () => {
            await backend.postMessageWithoutReply({
                action: 'firmware_transfer_completed',
                payload: {},
            });
        },
        reboot: async () => {
            await backend.postMessageWithoutReply({
                action: 'reboot',
                payload: {},
            });
        },
    };
};

// --------------------------------------------------------------------------------------------------------------------
// @anagram-comm-layer begin-exports

export {
    initDataBackend,
    kPluginLicenseFree,
    kPluginLicenseTrial,
    kPluginLicensePurchased,
}

// --------------------------------------------------------------------------------------------------------------------
