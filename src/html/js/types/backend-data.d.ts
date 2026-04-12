// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@darkglass.com>
// SPDX-License-Identifier: ISC

// --------------------------------------------------------------------------------------------------------------------

type Category = '' | 'Amps' | 'Pedals' | 'Miscellaneous';
type Capabilities = 'plugin-management';
type DirName = 'cabinets' | 'neural-models' | 'reverbs';

type kPluginLicenseFree = 0;
type kPluginLicenseTrial = 1;
type kPluginLicensePurchased = 2;

type kLv2DesignationNone = 0;
type kLv2DesignationEnabled = 1;
type kLv2DesignationBPM = 2;
type kLv2DesignationReset = 3;
type kLv2DesignationQuickPot = 4;

type Lv2PluginIsCommercial = 0x1; // 1 << 0
type Lv2PluginIsLicensed = 0x2; // 1 << 1
type Lv2PluginIsUserRemovable = 0x4; // 1 << 2
type Lv2PluginHasBlockImageStyling = 0x8; // 1 << 3
type Lv2PluginHasBlockSettingsStyling = 0x10; // 1 << 4
// FIXME bitmask
type Lv2PluginFlags = number;

// port flags
type Lv2PortIsAudio = 0x1; // 1 << 0,
type Lv2PortIsControl = 0x2; // 1 << 1,
type Lv2PortIsOutput = 0x4; // 1 << 2,
type Lv2PortIsSidechain = 0x8; // 1 << 3,
// property flags
type Lv2PropertyIsPath = 0x1; // 1 << 0,
type Lv2PropertyIsParameter = 0x2; // 1 << 1,
type Lv2PropertyIsReadOnly = 0x4; // 1 << 2,
// common flags
type Lv2ParameterToggled = 0x10; // 1 << 4
type Lv2ParameterInteger = 0x20; // 1 << 5
type Lv2ParameterEnumerated = 0x40; // 1 << 6
type Lv2ParameterLogarithmic = 0x80; // 1 << 7
type Lv2ParameterHidden = 0x100; // 1 << 8
type Lv2ParameterExpensive = 0x200; // 1 << 9
// extensions
type Lv2ParameterMayUpdateBlockedState = 0x400; // 1 << 10
type Lv2ParameterSavedToPreset = 0x800; // 1 << 11
// FIXME bitmask
type Lv2ParameterFlags = number;

type Lv2Designation = (kLv2DesignationNone
    | kLv2DesignationEnabled
    | kLv2DesignationBPM
    | kLv2DesignationReset
    | kLv2DesignationQuickPot
);
type PluginLicenseType = kPluginLicenseFree | kPluginLicenseTrial | kPluginLicensePurchased;

// FIXME
type DateString = string;

// FIXME
type UUIDv4 = string;

// --------------------------------------------------------------------------------------------------------------------

interface Message {
    action: string;
    payload: {};
}

interface MessageReply {
    action: string;
    payload: {};
}

interface DeviceSettings {
    'behavior.mode-cycling'?: number;
    'behavior.switch-preset'?: number;
    'behavior.switch-scene'?: number;
    'behavior.switch-stomp'?: number;
    'bluetooth.audio-routing'?: number;
    'bluetooth.powered-on-boot'?: boolean;
    'display.brightness'?: number;
    'exppedal.max'?: number;
    'exppedal.min'?: number;
    'fxloop.ch-config'?: number;
    'globaleq.1.freq'?: number;
    'globaleq.1.gain'?: number;
    'globaleq.1.width'?: number;
    'globaleq.2.freq'?: number;
    'globaleq.2.gain'?: number;
    'globaleq.2.width'?: number;
    'globaleq.3.freq'?: number;
    'globaleq.3.gain'?: number;
    'globaleq.3.width'?: number;
    'globaleq.4.freq'?: number;
    'globaleq.4.gain'?: number;
    'globaleq.4.width'?: number;
    'globaleq.hs.freq'?: number;
    'globaleq.hs.gain'?: number;
    'globaleq.hs.width'?: number;
    'globaleq.ls.freq'?: number;
    'globaleq.ls.gain'?: number;
    'globaleq.ls.width'?: number;
    'input-gain-preset'?: number;
    'input-gain-preset0.db'?: number;
    'input-gain-preset0.name'?: string;
    'input-gain-preset1.db'?: number;
    'input-gain-preset1.name'?: string;
    'input-gain-preset2.db'?: number;
    'input-gain-preset2.name'?: string;
    'input-gain-preset3.db'?: number;
    'input-gain-preset3.name'?: string;
    'input-gain-preset4.db'?: number;
    'input-gain-preset4.name'?: string;
    'input-gain-preset5.db'?: number;
    'input-gain-preset5.name'?: string;
    'looper.pos'?: boolean;
    'looper.slot'?: number;
    'looper.vol'?: number;
    'looper.vol-db'?: number;
    'midi.bindings.exp-pedal.cc'?: number;
    'midi.bindings.exp-pedal.enabled'?: boolean;
    'midi.bindings.foot1.cc'?: number;
    'midi.bindings.foot1.enabled'?: boolean;
    'midi.bindings.foot2.cc'?: number;
    'midi.bindings.foot2.enabled'?: boolean;
    'midi.bindings.foot3.cc'?: number;
    'midi.bindings.foot3.enabled'?: boolean;
    'midi.bindings.knob1.cc'?: number;
    'midi.bindings.knob1.enabled'?: boolean;
    'midi.bindings.knob2.cc'?: number;
    'midi.bindings.knob2.enabled'?: boolean;
    'midi.bindings.knob3.cc'?: number;
    'midi.bindings.knob3.enabled'?: boolean;
    'midi.bindings.knob4.cc'?: number;
    'midi.bindings.knob4.enabled'?: boolean;
    'midi.bindings.knob5.cc'?: number;
    'midi.bindings.knob5.enabled'?: boolean;
    'midi.bindings.knob6.cc'?: number;
    'midi.bindings.knob6.enabled'?: boolean;
    'midi.channel'?: number;
    'midi.ignore-redundant-pc'?: boolean;
    'midi.pc.channel'?: number;
    'midi.scene-edit-discard'?: boolean;
    'midi.toggle-mode'?: boolean;
    'mixer.headphones.link'?: boolean;
    'mixer.headphones.vol'?: number;
    'mixer.jack.left-right-link'?: boolean;
    'mixer.jack.left.link'?: boolean;
    'mixer.jack.left.vol'?: number;
    'mixer.jack.right.link'?: boolean;
    'mixer.jack.right.vol'?: number;
    'mixer.speaker.vol'?: number;
    'mixer.xlr.left-right-link'?: boolean;
    'mixer.xlr.left.link'?: boolean;
    'mixer.xlr.left.vol'?: number;
    'mixer.xlr.right.link'?: boolean;
    'mixer.xlr.right.vol'?: number;
    'mode'?: string;
    'scene-mode'?: string;
    'screen'?: string;
    'selected-preset'?: number;
    'selected-preset-area'?: string;
    'transport.bpm'?: number;
    'tuner.mute'?: boolean;
    'tuner.ref-freq'?: number;
    'ui.chain-zoom-level'?: number;
    'ui.dsp-block-load-meters'?: number;
    'ui.dsp-block-load-smoothing'?: boolean;
    'ui.dsp-system-load-meter'?: number;
    'ui.preset-numbering'?: number;
    'ui.scene-edit-discard'?: boolean;
}

interface DeviceSoundcard {
    'Analog CH3 Mic Gain': number;
    'Analog CH4 Mic Gain': number;
    'Capture Ground Lift': 0 | 1;
    'FX/Exp': 0 | 1;
    'Headphone Gain': number;
    'XLR Ground Lift': 0 | 1;
}

// --------------------------------------------------------------------------------------------------------------------

interface CheckFirmwareLicensingMessage extends Message {
    action: 'check_firmware_licensing';
    payload: {};
}

interface CheckFirmwareLicensingMessageReply extends MessageReply {
    action: 'check_firmware_licensing_res';
    payload: {
        data: {
            key: '' | '149e897c16e874bea75961557c8fef52567ad3db';
        };
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface DeletePluginMessage extends Message {
    action: 'delete_plugin';
    payload: {
        uri: string;
    };
}

interface DeletePluginMessageReply extends MessageReply {
    action: 'delete_plugin_res';
    payload: {
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface EditSettingsMessage extends Message {
    action: 'edit_settings';
    payload: {
        settings: DeviceSettings;
    };
}

interface EditSettingsMessageReply extends MessageReply {
    action: 'edit_settings_res';
    payload: {
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface ExportAnagramLogsMessage extends Message {
    action: 'export_anagram_logs';
    payload: {};
}

interface ExportAnagramLogsMessageReply extends MessageReply {
    action: 'export_anagram_logs_res';
    payload: {
        message: string;
        err_message: string;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface ExportSettingsMessage extends Message {
    action: 'export_settings';
    payload: {};
}

interface ExportSettingsMessageReply extends MessageReply {
    action: 'export_settings_res';
    payload: {
        err_message: string;
        settings?: DeviceSettings;
        // NOTE TBD if exposed or not
        soundcard?: DeviceSoundcard;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface FetchFirmwareVersionMessage extends Message {
    action: 'fetch_firmware_version';
    payload: {};
}

interface FetchFirmwareVersionMessageReply extends MessageReply {
    action: 'fetch_firmware_version_res';
    payload: {
        data: {
            capabilities: Array<Capabilities>;
            edition?: string;
            version: string;
        };
        err_message: string;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface FindUserFilesMessage extends Message {
    action: 'find_user_files';
    payload: {} | {
        pageNum: number;
        selectedDir: DirName;
    };
}

interface FindUserFilesMessageReply extends MessageReply {
    action: 'find_user_files_res';
    payload: {
        data: Array<{
            category: Category;
            created_at: DateString;
            dir_name: DirName;
            file_name: string;
            file_size: number;
            gain: 0;
            id: number;
            name: string;
            original_file_name: string;
            tags: Array<string>;
            updated_at: DateString;
            uris: Array<string>;
        }>;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface GetAnagramPresetPositionsMessage extends Message {
    action: 'get_anagram_preset_positions';
    payload: {};
}

interface GetAnagramPresetPositionsMessageReply extends MessageReply {
    action: 'get_anagram_preset_positions_res';
    payload: {
        data: {
            files: Array<{
                'filename': string;
                'id': UUIDv4 | undefined;
                'name': UUIDv4 | undefined;
                'error'?: string;
            }>;
        };
        err_message: string;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface GetFileByFilenameMessage extends Message {
    action: 'get_file_by_file_name';
    payload: {
        fileName: string;
    };
}

interface GetFileByFilenameMessageReply extends MessageReply {
    action: 'get_file_by_file_name_res';
    payload: {
        data: Array<{
            category: Category;
            created_at: DateString;
            dir_name: DirName;
            file_name: string;
            file_size: number;
            gain: 0;
            id: number;
            name: string;
            original_file_name: string;
            tags: Array<string>;
            updated_at: DateString;
            uris: Array<string>;
        }> | undefined;
        message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface GetPluginInfoMessage extends Message {
    action: 'get_plugin_info';
    payload: {
        uri: string;
    };
}

interface GetPluginInfoMessageReply extends MessageReply {
    action: 'get_plugin_info_res';
    payload: {
        err_message: string;
        data: {
            abbreviation: string;
            blockImageOff: string;
            blockImageOn: string;
            bundlepath: string;
            category: number;
            flags: Lv2PluginFlags;
            name: string;
            ports: Array<{
                symbol: string;
                name: string;
                shortname: string;
                flags: Lv2ParameterFlags;
                designation: Lv2Designation;
                def: number;
                min: number;
                max: number;
                unit: string;
                scalePoints: Array<{
                    label: string;
                    value: number;
                }>;
            }>;
            properties: Array<{
                uri: string;
                name: string;
                shortname: string;
                flags: Lv2ParameterFlags;
                defpath: string;
                def: number;
                min: number;
                max: number;
            }>;
            uri: string;
            version: string;
        };
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface _OpenFileReceiverMessage extends Message {
    action: 'open_file_receiver';
    payload: {
        fileName: string;
        dirName: '' | 'backup' | 'lv2' | DirName;
        isFirmware: 0 | 1;
    };
}

interface OpenFileReceiverMessage_Backup extends _OpenFileReceiverMessage {
    payload: {
        fileName: string;
        dirName: 'backup';
        isFirmware: 0;
    };
}

interface OpenFileReceiverMessage_File extends _OpenFileReceiverMessage {
    payload: {
        category: Category;
        createdAt: DateString;
        dirName: DirName;
        fileName: string;
        fileSize: number;
        isFirmware: 0;
        name: string;
        tags: Array<string>;
        updatedAt: DateString;
        uris: Array<string>;
    };
}

interface OpenFileReceiverMessage_Firmware extends _OpenFileReceiverMessage {
    payload: {
        fileName: string;
        dirName: '';
        isFirmware: 1;
    };
}

interface OpenFileReceiverMessage_Plugin extends _OpenFileReceiverMessage {
    payload: {
        fileName: string;
        dirName: 'lv2';
        isFirmware: 0;
        signature: string;
    };
}

interface OpenFileReceiverMessageReply extends MessageReply {
    action: 'open_file_receiver_res';
    payload: {
        err_message: string;
        success: 0 | 1;
    };
}

interface OpenFileReceiverMessageReply_File extends OpenFileReceiverMessageReply {
    payload: {
        data: {} | {
            fileName: string;
            id: number;
        };
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface _OpenFileSenderMessage extends Message {
    action: 'open_file_sender';
    payload: {
        dirName: 'backup' | 'lv2' | DirName;
    };
}

interface OpenFileSenderMessage_Backup extends _OpenFileSenderMessage {
    payload: {
        dirName: 'backup';
    };
}

interface OpenFileSenderMessage_File extends _OpenFileSenderMessage {
    payload: {
        dirName: DirName;
        fileName: string;
    };
}

interface OpenFileSenderMessage_Plugin extends _OpenFileSenderMessage {
    payload: {
        dirName: 'lv2';
        uri: string;
    };
}

interface OpenFileSenderMessageReply extends MessageReply {
    action: 'open_file_sender_res';
    payload: {
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface ReadAllPluginsMessage extends Message {
    action: 'read_all_plugins';
    payload: {} | {
        filterOption: '' | 'FACTORY' | 'USER';
    };
}

interface ReadAllPluginsMessageReply extends MessageReply {
    action: 'read_all_plugins_res';
    payload: {
        data: Array<{
            type: PluginLicenseType;
            uri: string;
            version: string;
        }>;
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface RemoveUserFileMessage extends Message {
    action: 'remove_user_file' | 'delete_user_file!';
    payload: {
        dirName: DirName;
        fileName: string;
        id: number;
    };
}

interface RemoveUserFileMessageReply extends MessageReply {
    action: 'remove_user_file_res';
    payload: {
        data: RemoveUserFileMessage['payload'];
        err_message: string;
        fs_success: 0 | 1;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface _RequestFirmwareLicensingMessage extends Message {
    action: 'request_firmware_licensing';
    payload: {
        action: 'license' | 'nonce' | 'token';
        message: string;
    };
}

interface RequestFirmwareLicensingMessage_License extends _RequestFirmwareLicensingMessage {
    action: 'request_firmware_licensing';
    payload: {
        action: 'license';
        message: string;
        uri: string;
    };
}

interface RequestFirmwareLicensingMessage_Nonce extends _RequestFirmwareLicensingMessage {
    action: 'request_firmware_licensing';
    payload: {
        action: 'nonce';
        message: string;
    };
}

interface RequestFirmwareLicensingMessage_Token extends _RequestFirmwareLicensingMessage {
    action: 'request_firmware_licensing';
    payload: {
        action: 'token';
        message: string;
        signature: string;
    };
}

interface RequestFirmwareLicensingMessageReply extends MessageReply {
    action: 'request_firmware_licensing_res';
    payload: {
        action: _RequestFirmwareLicensingMessage['action'];
        data: {
            message: string;
        };
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface RequestPluginsLicensingMessage extends Message {
    action: 'request_plugins_licensing' | 'request_plugin_licensing';
    payload: {
        message: string;
        uris: string;
    };
}

interface RequestPluginsLicensingMessageReply extends MessageReply {
    action: 'request_plugins_licensing_res';
    payload: {
        data: {
            message: '' | 'OK';
        };
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface RevokePluginLicensingMessage extends Message {
    action: 'revoke_plugin_licensing';
    payload: {
        uri: string;
    };
}

interface RevokePluginLicensingMessageReply extends MessageReply {
    action: 'revoke_plugin_licensing_res';
    payload: {
        data: {
            removeAll: boolean;
        };
        err_message: string;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface UpdateUserFileMessage extends Message {
    action: 'update_user_file';
    payload: {
        category: Category;
        gain: 0;
        id: number;
        name: string;
        tags: Array<string>;
        updated_at: DateString;
        uris: Array<string>;
    };
}

interface UpdateUserFileMessageReply extends MessageReply {
    action: 'update_user_file_res';
    payload: {
        data: UpdateUserFileMessage['payload'];
        err_message: string;
        db_success: 0 | 1;
        success: 0 | 1;
    };
}

// --------------------------------------------------------------------------------------------------------------------

interface FirmwareTransferCompletedMessage extends Message {
    action: 'firmware_transfer_completed';
    payload: {};
}

interface RebootMessage extends Message {
    action: 'reboot';
    payload: {};
}

// --------------------------------------------------------------------------------------------------------------------

type MessageTypesWithReply =
    ( CheckFirmwareLicensingMessage
    | DeletePluginMessage
    | EditSettingsMessage
    | ExportAnagramLogsMessage
    | ExportSettingsMessage
    | FetchFirmwareVersionMessage
    | FindUserFilesMessage
    | GetAnagramPresetPositionsMessage
    | GetFileByFilenameMessage
    | GetPluginInfoMessage
    | OpenFileReceiverMessage_Backup
    | OpenFileReceiverMessage_File
    | OpenFileReceiverMessage_Firmware
    | OpenFileReceiverMessage_Plugin
    | OpenFileSenderMessage_Backup
    | OpenFileSenderMessage_File
    | OpenFileSenderMessage_Plugin
    | ReadAllPluginsMessage
    | RemoveUserFileMessage
    | RequestFirmwareLicensingMessage_License
    | RequestFirmwareLicensingMessage_Nonce
    | RequestFirmwareLicensingMessage_Token
    | RequestPluginsLicensingMessage
    | RevokePluginLicensingMessage
    | UpdateUserFileMessage
    );

type MessageTypesWithoutReply = FirmwareTransferCompletedMessage | RebootMessage;

type MessageReplyTypes =
    ( CheckFirmwareLicensingMessageReply
    | DeletePluginMessageReply
    | EditSettingsMessageReply
    | ExportAnagramLogsMessageReply
    | ExportSettingsMessageReply
    | FetchFirmwareVersionMessageReply
    | FindUserFilesMessageReply
    | GetAnagramPresetPositionsMessageReply
    | GetFileByFilenameMessageReply
    | GetPluginInfoMessageReply
    | OpenFileReceiverMessageReply
    | OpenFileReceiverMessageReply_File
    | OpenFileSenderMessageReply
    | ReadAllPluginsMessageReply
    | RemoveUserFileMessageReply
    | RequestFirmwareLicensingMessageReply
    | RequestPluginsLicensingMessageReply
    | RevokePluginLicensingMessageReply
    | UpdateUserFileMessageReply
    );

// --------------------------------------------------------------------------------------------------------------------

interface DataBackend {
    connected: boolean;
    setup: (reconnectedCallback: () => void, disconnectedCallback: () => void) => Promise<void>;
    connect: () => Promise<void>;
    postMessageWithReply: (message: MessageTypesWithReply) => Promise<MessageReplyTypes>;
    postMessageWithoutReply: (message: MessageTypesWithoutReply) => Promise<void>;
}

interface DataBackendMethods {
    // functions with reply
    checkFirmwareLicensing: () => Promise<CheckFirmwareLicensingMessageReply>;
    deletePlugin: (payload: DeletePluginMessage['payload']) => Promise<DeletePluginMessageReply>;
    editSettings: (settings: EditSettingsMessage['payload']['settings']) => Promise<EditSettingsMessageReply>;
    exportAnagramLogs: () => Promise<ExportAnagramLogsMessageReply>;
    exportSettings: () => Promise<ExportSettingsMessageReply>;
    fetchFirmwareVersion: () => Promise<FetchFirmwareVersionMessageReply>;
    findUserFiles: (payload?: FindUserFilesMessage['payload']) => Promise<FindUserFilesMessageReply>;
    getAnagramPresetPositions: () => Promise<GetAnagramPresetPositionsMessageReply>;
    getFileByFilename: (payload: GetFileByFilenameMessage['payload']) => Promise<GetFileByFilenameMessageReply>;
    getPluginInfo: (payload: GetPluginInfoMessage['payload']) => Promise<GetPluginInfoMessageReply>;
    openFileReceiver: (payload:
        OpenFileReceiverMessage_Backup['payload'] |
        OpenFileReceiverMessage_File['payload'] |
        OpenFileReceiverMessage_Firmware['payload'] |
        OpenFileReceiverMessage_Plugin['payload']
    ) => Promise<OpenFileReceiverMessageReply | OpenFileReceiverMessageReply_File>;
    openFileSender: (payload:
        OpenFileSenderMessage_Backup['payload'] |
        OpenFileSenderMessage_File['payload'] |
        OpenFileSenderMessage_Plugin['payload']
    ) => Promise<OpenFileSenderMessageReply>;
    readAllPlugins: (payload?: ReadAllPluginsMessage['payload']) => Promise<ReadAllPluginsMessageReply>;
    removeUserFile: (payload: RemoveUserFileMessage['payload']) => Promise<RemoveUserFileMessageReply>;
    requestFirmwareLicensing: (payload:
        RequestFirmwareLicensingMessage_License['payload'] |
        RequestFirmwareLicensingMessage_Nonce['payload'] |
        RequestFirmwareLicensingMessage_Token['payload']
    ) => Promise<RequestFirmwareLicensingMessageReply>;
    requestPluginsLicensing: (payload: RequestPluginsLicensingMessage['payload']) => Promise<RequestPluginsLicensingMessageReply>;
    revokePluginLicensing: (payload?: RevokePluginLicensingMessage['payload']) => Promise<RevokePluginLicensingMessageReply>;
    updateUserFile: (payload: UpdateUserFileMessage['payload']) => Promise<UpdateUserFileMessageReply>;

    // functions without reply
    firmwareTransferCompleted: () => Promise<void>;
    reboot: () => Promise<void>;
}

// --------------------------------------------------------------------------------------------------------------------

export {
    Category,
    CheckFirmwareLicensingMessageReply,
    DataBackend,
    DataBackendMethods,
    DeletePluginMessageReply,
    DirName,
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
    MessageReplyTypes,
    MessageTypesWithReply,
    MessageTypesWithoutReply,
    OpenFileReceiverMessageReply,
    OpenFileReceiverMessage_File,
    OpenFileSenderMessageReply,
    PluginLicenseType,
    ReadAllPluginsMessage,
    ReadAllPluginsMessageReply,
    RemoveUserFileMessage,
    RemoveUserFileMessageReply,
    RequestFirmwareLicensingMessageReply,
    RequestPluginsLicensingMessageReply,
    RevokePluginLicensingMessageReply,
    UpdateUserFileMessage,
    UpdateUserFileMessageReply,
    kPluginLicenseFree,
    kPluginLicenseTrial,
    kPluginLicensePurchased,
};

// --------------------------------------------------------------------------------------------------------------------
