// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

// --------------------------------------------------------------------------------------------------------------------
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/web-bluetooth/index.d.ts

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;
type BluetoothDescriptorUUID = number | string;

type BluetoothManufacturerData = Map<number, DataView>;
type BluetoothServiceData = Map<BluetoothServiceUUID, DataView>;

interface BluetoothDataFilter {
    readonly dataPrefix?: BufferSource | undefined;
    readonly mask?: BufferSource | undefined;
}

interface BluetoothManufacturerDataFilter extends BluetoothDataFilter {
    companyIdentifier: number;
}

interface BluetoothServiceDataFilter extends BluetoothDataFilter {
    service: BluetoothServiceUUID;
}

interface BluetoothLEScanFilter {
    readonly name?: string | undefined;
    readonly namePrefix?: string | undefined;
    readonly services?: BluetoothServiceUUID[] | undefined;
    readonly manufacturerData?: BluetoothManufacturerDataFilter[] | undefined;
    readonly serviceData?: BluetoothServiceDataFilter[] | undefined;
}

interface BluetoothLEScanOptions {
    readonly filters?: BluetoothLEScanFilter[] | undefined;
    readonly keepRepeatedDevices?: boolean | undefined;
    readonly acceptAllAdvertisements?: boolean | undefined;
}

interface BluetoothLEScan extends BluetoothLEScanOptions {
    active: boolean;
    stop: () => void;
}

type RequestDeviceOptions = {
    filters: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[] | undefined;
    optionalManufacturerData?: number[] | undefined;
} | {
    acceptAllDevices: boolean;
    optionalServices?: BluetoothServiceUUID[] | undefined;
    optionalManufacturerData?: number[] | undefined;
};

interface BluetoothAdvertisingEvent extends Event {
    readonly device: BluetoothDevice;
    readonly uuids: BluetoothServiceUUID[];
    readonly manufacturerData: BluetoothManufacturerData;
    readonly serviceData: BluetoothServiceData;
    readonly name?: string | undefined;
    readonly appearance?: number | undefined;
    readonly rssi?: number | undefined;
    readonly txPower?: number | undefined;
}

interface BluetoothRemoteGATTDescriptor {
    readonly characteristic: BluetoothRemoteGATTCharacteristic;
    readonly uuid: string;
    readonly value?: DataView | undefined;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothCharacteristicProperties {
    readonly broadcast: boolean;
    readonly read: boolean;
    readonly writeWithoutResponse: boolean;
    readonly write: boolean;
    readonly notify: boolean;
    readonly indicate: boolean;
    readonly authenticatedSignedWrites: boolean;
    readonly reliableWrite: boolean;
    readonly writableAuxiliaries: boolean;
}

interface CharacteristicEventHandlers {
    oncharacteristicvaluechanged: (this: this, ev: Event) => any;
}

interface BluetoothRemoteGATTCharacteristicEventMap {
    "characteristicvaluechanged": Event;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget, CharacteristicEventHandlers {
    readonly service: BluetoothRemoteGATTService;
    readonly uuid: string;
    readonly properties: BluetoothCharacteristicProperties;
    readonly value?: DataView | undefined;
    getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>;
    getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener<K extends keyof BluetoothRemoteGATTCharacteristicEventMap>(
        type: K,
        listener: (this: BluetoothRemoteGATTCharacteristic, ev: BluetoothRemoteGATTCharacteristicEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BluetoothRemoteGATTCharacteristicEventMap>(
        type: K,
        listener: (this: BluetoothRemoteGATTCharacteristic, ev: BluetoothRemoteGATTCharacteristicEventMap[K]) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

interface ServiceEventHandlers {
    onserviceadded: (this: this, ev: Event) => any;
    onservicechanged: (this: this, ev: Event) => any;
    onserviceremoved: (this: this, ev: Event) => any;
}

interface BluetoothRemoteGATTServiceEventMap {
    "serviceadded": Event;
    "servicechanged": Event;
    "serviceremoved": Event;
}

interface BluetoothRemoteGATTService extends EventTarget, CharacteristicEventHandlers, ServiceEventHandlers {
    readonly device: BluetoothDevice;
    readonly uuid: string;
    readonly isPrimary: boolean;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
    getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
    addEventListener<K extends keyof BluetoothRemoteGATTServiceEventMap>(
        type: K,
        listener: (this: BluetoothRemoteGATTService, ev: BluetoothRemoteGATTServiceEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BluetoothRemoteGATTServiceEventMap>(
        type: K,
        listener: (this: BluetoothRemoteGATTService, ev: BluetoothRemoteGATTServiceEventMap[K]) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

interface BluetoothRemoteGATTServer {
    readonly device: BluetoothDevice;
    readonly connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDeviceEventHandlers {
    onadvertisementreceived: (this: this, ev: BluetoothAdvertisingEvent) => any;
    ongattserverdisconnected: (this: this, ev: Event) => any;
}

interface WatchAdvertisementsOptions {
    signal?: AbortSignal;
}

interface BluetoothDeviceEventMap {
    "advertisementreceived": BluetoothAdvertisingEvent;
    "gattserverdisconnected": Event;
}

interface BluetoothDevice
    extends EventTarget, BluetoothDeviceEventHandlers, CharacteristicEventHandlers, ServiceEventHandlers
{
    readonly id: string;
    readonly name?: string | undefined;
    readonly gatt?: BluetoothRemoteGATTServer | undefined;
    forget(): Promise<void>;
    watchAdvertisements(options?: WatchAdvertisementsOptions): Promise<void>;
    readonly watchingAdvertisements: boolean;
    addEventListener<K extends keyof BluetoothDeviceEventMap>(
        type: K,
        listener: (this: BluetoothDevice, ev: BluetoothDeviceEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BluetoothDeviceEventMap>(
        type: K,
        listener: (this: BluetoothDevice, ev: BluetoothDeviceEventMap[K]) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

interface BluetoothEventMap {
    "availabilitychanged": Event;
    "advertisementreceived": BluetoothAdvertisingEvent;
}

interface Bluetooth
    extends EventTarget, BluetoothDeviceEventHandlers, CharacteristicEventHandlers, ServiceEventHandlers
{
    getDevices(): Promise<BluetoothDevice[]>;
    getAvailability(): Promise<boolean>;
    onavailabilitychanged: (this: this, ev: Event) => any;
    readonly referringDevice?: BluetoothDevice | undefined;
    requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
    requestLEScan(options?: BluetoothLEScanOptions): Promise<BluetoothLEScan>;
    addEventListener<K extends keyof BluetoothEventMap>(
        type: K,
        listener: (this: Bluetooth, ev: BluetoothEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof BluetoothEventMap>(
        type: K,
        listener: (this: Bluetooth, ev: BluetoothEventMap[K]) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

declare namespace BluetoothUUID {
    function getService(name: string | number): string;
    function getCharacteristic(name: string | number): string;
    function getDescriptor(name: string | number): string;
    function canonicalUUID(alias: string | number): string;
}

declare global {
    interface Navigator {
        bluetooth: Bluetooth;
    }
}

// --------------------------------------------------------------------------------------------------------------------
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/w3c-web-hid/index.d.ts

/*~ https://wicg.github.io/webhid/#hiddevicefilter-dictionary */
interface HIDDeviceFilter {
    vendorId?: number | undefined;
    productId?: number | undefined;
    usagePage?: number | undefined;
    usage?: number | undefined;
}

/*~ https://wicg.github.io/webhid/#hiddevicerequestoptions-dictionary */
interface HIDDeviceRequestOptions {
    filters: HIDDeviceFilter[];
}

/*~ https://wicg.github.io/webhid/#hid-interface */
declare class HID extends EventTarget {
    onconnect: ((this: this, ev: Event) => any) | null;
    ondisconnect: ((this: this, ev: Event) => any) | null;

    getDevices(): Promise<HIDDevice[]>;

    requestDevice(options?: HIDDeviceRequestOptions): Promise<HIDDevice[]>;

    addEventListener(
        type: "connect" | "disconnect",
        listener: (this: this, ev: HIDConnectionEvent) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void;

    removeEventListener(
        type: "connect" | "disconnect",
        callback: (this: this, ev: HIDConnectionEvent) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
}

/*~ https://wicg.github.io/webhid/#extensions-to-the-navigator-interface */
declare global {
    interface Navigator {
        readonly hid: HID;
    }
}

/*~ https://wicg.github.io/webhid/#hidconnectioneventinit-dictionary */
interface HIDConnectionEventInit {
    device: HIDDevice;
}

/*~ https://wicg.github.io/webhid/#hidconnectionevent-interface */
declare class HIDConnectionEvent extends Event {
    constructor(type: string, eventInitDict: HIDConnectionEventInit);

    readonly device: HIDDevice;
}

/*~ https://wicg.github.io/webhid/#hidinputreporteventinit-dictionary */
interface HIDInputReportEventInit extends EventInit {
    device: HIDDevice;
    reportId: number;
    data: DataView;
}

/*~ https://wicg.github.io/webhid/#hidinputreportevent-interface */
declare class HIDInputReportEvent extends Event {
    constructor(type: string, eventInitDict: HIDInputReportEventInit);

    readonly device: HIDDevice;
    readonly reportId: number;
    readonly data: DataView;
}

/*~ https://wicg.github.io/webhid/#hidunitsystem-enum */
type HIDUnitSystem =
    | "none"
    | "si-linear"
    | "si-rotation"
    | "english-linear"
    | "english-rotation"
    | "vendor-defined"
    | "reserved";

/*~ https://wicg.github.io/webhid/#hidreportitem-dictionary */
interface HIDReportItem {
    isAbsolute?: boolean | undefined;
    isArray?: boolean | undefined;
    isBufferedBytes?: boolean | undefined;
    isConstant?: boolean | undefined;
    isLinear?: boolean | undefined;
    isRange?: boolean | undefined;
    isVolatile?: boolean | undefined;
    hasNull?: boolean | undefined;
    hasPreferredState?: boolean | undefined;
    wrap?: boolean | undefined;
    usages?: number[] | undefined;
    usageMinimum?: number | undefined;
    usageMaximum?: number | undefined;
    reportSize?: number | undefined;
    reportCount?: number | undefined;
    unitExponent?: number | undefined;
    unitSystem?: HIDUnitSystem | undefined;
    unitFactorLengthExponent?: number | undefined;
    unitFactorMassExponent?: number | undefined;
    unitFactorTimeExponent?: number | undefined;
    unitFactorTemperatureExponent?: number | undefined;
    unitFactorCurrentExponent?: number | undefined;
    unitFactorLuminousIntensityExponent?: number | undefined;
    logicalMinimum?: number | undefined;
    logicalMaximum?: number | undefined;
    physicalMinimum?: number | undefined;
    physicalMaximum?: number | undefined;
    strings?: string[] | undefined;
}

/*~ https://wicg.github.io/webhid/#hidreportinfo-dictionary */
interface HIDReportInfo {
    reportId?: number | undefined;
    items?: HIDReportItem[] | undefined;
}

/*~ https://wicg.github.io/webhid/#hidcollectioninfo-dictionary */
interface HIDCollectionInfo {
    usagePage?: number | undefined;
    usage?: number | undefined;
    type?: number | undefined;
    children?: HIDCollectionInfo[] | undefined;
    inputReports?: HIDReportInfo[] | undefined;
    outputReports?: HIDReportInfo[] | undefined;
    featureReports?: HIDReportInfo[] | undefined;
}

/*~ https://wicg.github.io/webhid/#hiddevice-interface */
declare class HIDDevice extends EventTarget {
    oninputreport: ((this: this, ev: HIDInputReportEvent) => any) | null;
    readonly opened: boolean;
    readonly vendorId: number;
    readonly productId: number;
    readonly productName: string;
    readonly collections: HIDCollectionInfo[];

    open(): Promise<void>;

    close(): Promise<void>;

    forget(): Promise<void>;

    sendReport(reportId: number, data: BufferSource): Promise<void>;

    sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;

    receiveFeatureReport(reportId: number): Promise<DataView>;

    addEventListener(
        type: "inputreport",
        listener: (this: this, ev: HIDInputReportEvent) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void;

    removeEventListener(
        type: "inputreport",
        callback: (this: this, ev: HIDInputReportEvent) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
}

export { HIDConnectionEvent, HIDDevice, HIDInputReportEvent };

// --------------------------------------------------------------------------------------------------------------------
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/w3c-web-serial/index.d.ts

/*~ https://wicg.github.io/serial/#dom-paritytype */
type ParityType = "none" | "even" | "odd";

/*~ https://wicg.github.io/serial/#dom-flowcontroltype */
type FlowControlType = "none" | "hardware";

/*~ https://wicg.github.io/serial/#dom-serialoptions */
interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8 | undefined;
    stopBits?: 1 | 2 | undefined;
    parity?: ParityType | undefined;
    bufferSize?: number | undefined;
    flowControl?: FlowControlType | undefined;
}

/*~ https://wicg.github.io/serial/#dom-serialoutputsignals */
interface SerialOutputSignals {
    dataTerminalReady?: boolean | undefined;
    requestToSend?: boolean | undefined;
    break?: boolean | undefined;
}

/*~ https://wicg.github.io/serial/#dom-serialinputsignals */
interface SerialInputSignals {
    dataCarrierDetect: boolean;
    clearToSend: boolean;
    ringIndicator: boolean;
    dataSetReady: boolean;
}

/*~ https://wicg.github.io/serial/#serialportinfo-dictionary */
interface SerialPortInfo {
    usbVendorId?: number | undefined;
    usbProductId?: number | undefined;
    /** If the port is a service on a Bluetooth device this member will be a BluetoothServiceUUID
     * containing the service class UUID. Otherwise it will be undefined. */
    bluetoothServiceClassId?: number | string | undefined;
}

/*~ https://wicg.github.io/serial/#dom-serialport */
declare class SerialPort extends EventTarget {
    onconnect: ((this: this, ev: Event) => void) | null;
    ondisconnect: ((this: this, ev: Event) => void) | null;
    /** A flag indicating the logical connection state of serial port */
    readonly connected: boolean;
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;

    open(options: SerialOptions): Promise<void>;
    setSignals(signals: SerialOutputSignals): Promise<void>;
    getSignals(): Promise<SerialInputSignals>;
    getInfo(): SerialPortInfo;
    close(): Promise<void>;
    forget(): Promise<void>;

    addEventListener(
        type: "connect" | "disconnect",
        listener: (this: this, ev: Event) => void,
        useCapture?: boolean,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
        type: "connect" | "disconnect",
        callback: (this: this, ev: Event) => void,
        useCapture?: boolean,
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
}

/*~ https://wicg.github.io/serial/#dom-serialportfilter */
interface SerialPortFilter {
    usbVendorId?: number | undefined;
    usbProductId?: number | undefined;
    bluetoothServiceClassId?: number | string | undefined;
}

/*~ https://wicg.github.io/serial/#dom-serialportrequestoptions */
interface SerialPortRequestOptions {
    filters?: SerialPortFilter[] | undefined;
    /** A list of BluetoothServiceUUID values representing Bluetooth service class IDs.
     * Bluetooth ports with custom service class IDs are excluded from the list of ports
     * presented to the user unless the service class ID is included in this list.
     *
     * {@link https://wicg.github.io/serial/#serialportrequestoptions-dictionary} */
    allowedBluetoothServiceClassIds?: Array<number | string> | undefined;
}

/*~ https://wicg.github.io/serial/#dom-serial */
declare class Serial extends EventTarget {
    onconnect: ((this: this, ev: Event) => void) | null;
    ondisconnect: ((this: this, ev: Event) => void) | null;

    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    addEventListener(
        type: "connect" | "disconnect",
        listener: (this: this, ev: Event) => void,
        useCapture?: boolean,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener(
        type: "connect" | "disconnect",
        callback: (this: this, ev: Event) => void,
        useCapture?: boolean,
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
    ): void;
}

/*~ https://wicg.github.io/serial/#extensions-to-the-navigator-interface */
declare global {
    interface Navigator {
        readonly serial: Serial;
    }
}

/*~ https://wicg.github.io/serial/#extensions-to-workernavigator-interface */
declare global {
    interface WorkerNavigator {
        readonly serial: Serial;
    }
}

export { SerialPort };

// --------------------------------------------------------------------------------------------------------------------
