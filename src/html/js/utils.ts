// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import {} from './anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------

const currentDateForFilename = () => {
    return (new Date()).toISOString().replace(/:/g,'-').slice(0, -5);
};

const dateToString = (date: string): string => {
    return (new Date(date)).toString();
};

const encode = (data: string): string => {
    return document.createTextNode(data).textContent;
};

const sha1sum = (data: string): string => {
    // TODO
    return '5eedfe60967257839e22d8bee4bf870beb469aa1';
};

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string#answer-14919494
const sizeToString = (size: number): string => {
    if (Math.abs(size) < 1024) {
        return size + ' B';
    }

    const units = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    let u = -1;
    do {
        size /= 1024;
        ++u;
    } while (Math.round(Math.abs(size) * 10) / 10 >= 1024 && u < units.length - 1);

    return size.toFixed(1) + ' ' + units[u];
};

// --------------------------------------------------------------------------------------------------------------------
