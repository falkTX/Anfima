// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

// --------------------------------------------------------------------------------------------------------------------
// logging

const initLogger = () => {
    const reportStatusModal = document.getElementById('anfima-modal-report');
    const reportStatusElem = reportStatusModal.children[0].children[0].children[0];
    const welcomeStatusElem = document.getElementById('anfima-welcome-status');
    const welcomeStatusText = welcomeStatusElem.textContent;

    let outStatusElem = welcomeStatusElem;

    return {
        info: (info) => {
            outStatusElem.textContent = info;
            console.log(info);
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
        useReportElem: (elem) => {
            UIkit.modal(reportStatusModal).show();
            outStatusElem = reportStatusElem;
        },
        useWelcomeElem: (elem) => {
            outStatusElem = welcomeStatusElem;
        },
    };
};

// --------------------------------------------------------------------------------------------------------------------
// TESTING init (to be later done on demand)

async function __init() {
    const backend = initBackend();
    const logger = initLogger();

    logger.info('Connecting...');
    try {
        await backend.data.connect();
    } catch(error) {
        logger.error(error);
        return;
    };

    try {
        await initFileManager(backend, logger);
    } catch(error) {
        logger.error(error);
        return;
    };

    logger.info('Ready to roll!');
};

setTimeout(__init, 0);

// --------------------------------------------------------------------------------------------------------------------
