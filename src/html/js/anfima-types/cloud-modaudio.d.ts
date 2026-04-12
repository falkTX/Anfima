// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

interface DeviceNonce {
    nonce: string;
}

interface DeviceToken {
    license_info: Array<{
        id: string;
        license_type: 'free' | 'perpetual';
        plugin_uri: string;
        version: string;
    }>;
    message: string;
    platform: string;
    signature: string;
}

interface Bundle {
    build_id: number;
    files: Array<{
        file_href: string;
        platform: 'duo' | 'duox' | 'dwarf' | 'pablito';
    }>;
    href: string;
    id: string;
    name: string;
    mod_license: 'free' | 'paid_perpetual';
    plugins: Array<Plugin>;
    release_number: number;
}

interface BundleFile {
    blob: Uint8Array;
    name: string;
    signature: string;
}

interface PluginPort {
    index: number;
    name: string;
    shortName: string;
    symbol: string;
}

interface PluginControlPort extends PluginPort {
    designation: string;
    properties: Array<string>;
    ranges: {
        default: number;
        maximum: number;
        minimum: number;
    };
    units: {} | {
        label: string;
        render: string;
        symbol: string;
    };
}

interface Plugin {
    author: {
        name: string;
        email: string;
        homepage: string;
    };
    brand: string;
    bundle_id: string;
    category: Array<string>;
    id: string;
    microVersion: number;
    minorVersion: number;
    mod_license: string;
    name: string;
    ports: {
        audio: {
            input: Array<PluginPort>;
            output: Array<PluginPort>;
        };
        control: {
            input: Array<PluginControlPort>;
            output: Array<PluginControlPort>;
        };
    };
    release_number: number;
    uri: string;
}

interface MODAudioCloud {
    token: string;
    deviceNonce: () => Promise<DeviceNonce>;
    deviceToken: (message: string) => Promise<DeviceToken>;
    license: (id: string) => Promise<string>;
    lv2Bundle: (id: string) => Promise<Bundle>;
    lv2Plugins: () => Promise<Array<Plugin>>;
}

interface MODAudioCloudMethods {
    fetchBundleById: (id: string) => Promise<BundleFile>;
    getPluginFromMOD: (uri: string) => Plugin | undefined;
    reload: () => Promise<void>;
}

export {
    Bundle,
    BundleFile,
    DeviceNonce,
    DeviceToken,
    MODAudioCloud,
    MODAudioCloudMethods,
    Plugin,
}
