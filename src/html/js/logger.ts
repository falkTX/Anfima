// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { HTMLElements } from './types/html.js';
import { Logger } from './types/logger.js';
import {} from './types/uikit.js';

// --------------------------------------------------------------------------------------------------------------------

const initLogger = (htmlElements: HTMLElements): Logger => {
    let outStatusElem: HTMLElement = htmlElements.welcome.status;

    return {
        info: (info) => {
            outStatusElem.textContent = info;
            console.error(info);
            return info;
        },
        error: (error) => {
            if (typeof(error) !== 'string') {
                error = '' + error;
            }
            if (error.indexOf('Error:') < 0) {
                error = 'Error: ' + error;
            }
            outStatusElem.textContent = error;
            console.error(error);
            return error;
        },
        useReportElem: () => {
            outStatusElem = htmlElements.reportModal.status;
            setTimeout(() => { UIkit.modal(htmlElements.reportModal.container).show() }, 0);
        },
        useWelcomeElem: () => {
            UIkit.modal(htmlElements.reportModal.container).hide();
            outStatusElem = htmlElements.welcome.status;
        },
    };
};
