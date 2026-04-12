// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { Backend } from '../anfima-types/backend';
import { Cloud } from '../anfima-types/cloud';
import { HTMLElements } from '../anfima-types/html';
import { Logger } from '../anfima-types/logger';
import {} from '../anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------

const initTools = async (backend: Backend, cloud: Cloud, htmlElements: HTMLElements, logger: Logger) => {
    logger.info('Initializing tools...');

    const elems = htmlElements.pages.tools;

    let nextActionWarning: '' | 'reset-user-settings' = '';

    // ----------------------------------------------------------------------------------------------------------------

    elems.backupExport.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Preparing backup...');

        try {
            const payload = await backend.receiveSinglePayload(
                () => {
                    return new Promise<void>((success, reject) => {
                        backend.openFileSender({
                            dirName: 'backup',
                        }).then(() => success()).catch(reject);
                    });
                },
                (progress: number) => {
                    logger.info(`Downloading backup file... (${progress}%)`);
                },
            );

            const blob = new Blob([payload as BlobPart], {type: 'application/octet-stream'});
            const blobURL = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.classList.add('uk-hidden');
            a.download = "anagram-backup-" + currentDateForFilename() + ".anbu";
            a.href = blobURL;
            document.body.appendChild(a);
            a.click();
            a.remove();

            logger.info('Backup export complete!');
        } catch(error) {
            logger.error(error as string);
        }
    };

    elems.backupImport.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        const input = document.createElement('input');
        input.classList.add('uk-hidden');
        input.setAttribute('accept', '.anbu');
        input.setAttribute('type','file');

        input.addEventListener('cancel', (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            logger.useWelcomeElem();
        });

        input.onchange = async (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            if (input.files == null || input.files.length === 0) {
                logger.useWelcomeElem();
                return;
            }

            logger.info('Transferring backup file...');

            try {
                const file = input.files.item(0) as File;
                const payload = new Uint8Array(await file.arrayBuffer());

                await backend.openFileReceiver({
                    dirName: 'backup',
                    fileName: '',
                    isFirmware: 0,
                });
                await backend.transferSinglePayload(payload, (progress: number) => {
                    logger.info(`Transferring backup file... (${progress}%)`);
                });
                await backend.reboot();
            } catch(error) {
                logger.error(error as string);
            }
        };

        input.click();

        logger.useReportElem();
        logger.info('Please select a backup file from the file dialog...');
    };

    elems.editSettings.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        elems.editSettingsModal.keyInput.value = '';
        elems.editSettingsModal.valueInput.value = '';

        UIkit.modal(elems.editSettingsModal.container).show();
    };

    elems.editSettingsModal.container.onsubmit = async (ev: SubmitEvent) => {
        ev.preventDefault();
        (ev.target as HTMLFormElement).blur();

        const key = elems.editSettingsModal.keyInput.value;
        const value = elems.editSettingsModal.valueInput.value;

        if (key.length === 0 || value.length === 0) {
            return;
        }

        logger.useReportElem();

        try {
            logger.info('Changing settings...');

            switch (key) {
            case 'bluetooth.powered-on-boot':
            case 'looper.pos':
            case 'midi.bindings.exp-pedal.enabled':
            case 'midi.bindings.foot1.enabled':
            case 'midi.bindings.foot2.enabled':
            case 'midi.bindings.foot3.enabled':
            case 'midi.bindings.knob1.enabled':
            case 'midi.bindings.knob2.enabled':
            case 'midi.bindings.knob3.enabled':
            case 'midi.bindings.knob4.enabled':
            case 'midi.bindings.knob5.enabled':
            case 'midi.bindings.knob6.enabled':
            case 'midi.ignore-redundant-pc':
            case 'midi.scene-edit-discard':
            case 'midi.toggle-mode':
            case 'mixer.headphones.link':
            case 'mixer.jack.left-right-link':
            case 'mixer.jack.left.link':
            case 'mixer.jack.right.link':
            case 'mixer.xlr.left-right-link':
            case 'mixer.xlr.left.link':
            case 'mixer.xlr.right.link':
            case 'tuner.mute':
            case 'ui.dsp-block-load-smoothing':
            case 'ui.scene-edit-discard':
                if (value === '1' || value === 'true') {
                    await backend.editSettings({ [key]: parseInt(value) });
                } else if (value === '1' || value === 'true') {
                    await backend.editSettings({ [key]: parseInt(value) });
                } else {
                    throw ('Invalid value');
                }
                break;
            case 'behavior.mode-cycling':
            case 'behavior.switch-preset':
            case 'behavior.switch-scene':
            case 'behavior.switch-stomp':
            case 'bluetooth.audio-routing':
            case 'display.brightness':
            case 'exppedal.max':
            case 'exppedal.min':
            case 'fxloop.ch-config':
            case 'globaleq.1.freq':
            case 'globaleq.1.gain':
            case 'globaleq.1.width':
            case 'globaleq.2.freq':
            case 'globaleq.2.gain':
            case 'globaleq.2.width':
            case 'globaleq.3.freq':
            case 'globaleq.3.gain':
            case 'globaleq.3.width':
            case 'globaleq.4.freq':
            case 'globaleq.4.gain':
            case 'globaleq.4.width':
            case 'globaleq.hs.freq':
            case 'globaleq.hs.gain':
            case 'globaleq.hs.width':
            case 'globaleq.ls.freq':
            case 'globaleq.ls.gain':
            case 'globaleq.ls.width':
            case 'input-gain-preset':
            case 'input-gain-preset0.db':
            case 'input-gain-preset1.db':
            case 'input-gain-preset2.db':
            case 'input-gain-preset3.db':
            case 'input-gain-preset4.db':
            case 'input-gain-preset5.db':
            case 'looper.slot':
            case 'looper.vol':
            case 'looper.vol-db':
            case 'midi.bindings.exp-pedal.cc':
            case 'midi.bindings.foot1.cc':
            case 'midi.bindings.foot2.cc':
            case 'midi.bindings.foot3.cc':
            case 'midi.bindings.knob1.cc':
            case 'midi.bindings.knob2.cc':
            case 'midi.bindings.knob3.cc':
            case 'midi.bindings.knob4.cc':
            case 'midi.bindings.knob5.cc':
            case 'midi.bindings.knob6.cc':
            case 'midi.channel':
            case 'midi.pc.channel':
            case 'mixer.headphones.vol':
            case 'mixer.jack.left.vol':
            case 'mixer.jack.right.vol':
            case 'mixer.speaker.vol':
            case 'mixer.xlr.left.vol':
            case 'mixer.xlr.right.vol':
            case 'selected-preset':
            case 'transport.bpm':
            case 'tuner.ref-freq':
            case 'ui.chain-zoom-level':
            case 'ui.dsp-block-load-meters':
            case 'ui.dsp-system-load-meter':
            case 'ui.preset-numbering':
                await backend.editSettings({ [key]: parseInt(value) });
                break;
            case 'input-gain-preset0.name':
            case 'input-gain-preset1.name':
            case 'input-gain-preset2.name':
            case 'input-gain-preset3.name':
            case 'input-gain-preset4.name':
            case 'input-gain-preset5.name':
            case 'mode':
            case 'scene-mode':
            case 'screen':
            case 'selected-preset-area':
                await backend.editSettings({ [key]: value });
                break;
            default:
                throw ('Invalid key');
            }

            logger.info('Settings changed successfully!');

        } catch (error) {
            logger.error('' + error);
        }
    }

    elems.exportLogs.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Fetching logs...');

        try {
            const resp = await backend.exportAnagramLogs();
            logger.info(resp.payload.message);
        } catch(error) {
            logger.error(error as string);
        }
    };

    elems.exportSettings.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Fetching settings...');

        try {
            const resp = await backend.exportSettings();
            logger.info(JSON.stringify(resp.payload.settings, null, 4));
        } catch(error) {
            logger.error(error as string);
        }
    };

    elems.installUpdateFile.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        const input = document.createElement('input');
        input.classList.add('uk-hidden');
        input.setAttribute('accept', '.tar');
        input.setAttribute('type','file');

        input.addEventListener('cancel', (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            logger.useWelcomeElem();
        });

        input.onchange = async (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            if (input.files == null || input.files.length === 0) {
                logger.useWelcomeElem();
                return;
            }

            logger.info('Transferring update file...');

            try {
                const file = input.files.item(0) as File;
                const payload = new Uint8Array(await file.arrayBuffer());

                await backend.openFileReceiver({
                    dirName: '',
                    fileName: file.name,
                    isFirmware: 1,
                });
                await backend.transferSinglePayload(payload, (progress: number) => {
                    logger.info(`Transferring update file... (${progress}%)`);
                });
                await backend.firmwareTransferCompleted();
            } catch(error) {
                logger.error(error as string);
            }
        };

        input.click();

        logger.useReportElem();
        logger.info('Please select an update file from the file dialog...');
    };

    elems.rebootButton.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Rebooting unit...');

        try {
            await backend.reboot();
        } catch (error) {
            logger.error(error as string);
        }
    };

    elems.rebootRestoreButton.onclick = async (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        logger.useReportElem();
        logger.info('Rebooting into restore...');

        try {
            await backend.firmwareTransferCompleted();
        } catch (error) {
            logger.error(error as string);
        }
    };

    elems.resetUserSettingsButton.onclick = (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        nextActionWarning = 'reset-user-settings';
        elems.warningModal.label.innerHTML = `
You are about to delete all user presets and reset device settings.<br>
This action is irreversible!<br>
<br>
Do you still want to continue?`;

        UIkit.modal(elems.warningModal.container).show();
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.warningModal.container.onsubmit = async (ev: SubmitEvent) => {
        ev.preventDefault();
        (ev.target as HTMLFormElement).blur();

        const action = nextActionWarning;
        nextActionWarning = '';

        switch (action) {
        case '':
            break;
        case 'reset-user-settings':
            logger.useReportElem();
            logger.info('Resetting user settings...');

            try {
                await backend.openFileReceiver({
                    dirName: '',
                    fileName: 'darkglass-pablito-reset-user-settings.tar',
                    isFirmware: 1,
                });
                await backend.transferSinglePayload(reset_user_settings, () => {});
                await backend.firmwareTransferCompleted();
            } catch (error) {
                logger.error('' + error);
            }
            break;
        }
    }

    // ----------------------------------------------------------------------------------------------------------------
};

// --------------------------------------------------------------------------------------------------------------------
