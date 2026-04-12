// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import {} from './types/utils.js';

// --------------------------------------------------------------------------------------------------------------------

const dateToString = (date: string): string => {
    return (new Date(date)).toString();
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
