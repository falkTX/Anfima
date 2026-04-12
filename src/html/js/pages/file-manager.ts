// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { BackendWithMethods } from '../types/backend.js';
import { HTMLElements } from '../types/html.js';
import { Logger } from '../types/logger.js';
import {} from '../types/pages.js';
import {} from '../types/uikit.js';
import {} from '../types/utils.js';

// --------------------------------------------------------------------------------------------------------------------

const initFileManager = async (backend: BackendWithMethods, htmlElements: HTMLElements, logger: Logger) => {
    logger.info('Requesting user file list...');

    const elems = htmlElements.pages.fileManager;

    const userFiles = Object.fromEntries(
        (await backend.findUserFiles()).payload.data.map((e: any) => { return [e.id, e] })
    );

    // ----------------------------------------------------------------------------------------------------------------
    // shared data between modals

    let nextFiles: Array<File> = [];
    let nextItemIds: Array<string> = [];

    // ----------------------------------------------------------------------------------------------------------------

//     const createItemCategory = (dir_name: string, category: string): string => {
//         if (dir_name == 'neural-models') {
//             // TODO uk-flex-last
//             return `
// <select class="anfima-file-manager-category uk-select uk-width-small">
//   <option data-category="Amps" ${category == 'Amps' && 'selected'}>Amps</option>
//   <option data-category="Pedals" ${category == 'Pedals' && 'selected'} >Pedals</option>
//   <option data-category="Miscellaneous" ${category == 'Miscellaneous' && 'selected'}>Miscellaneous</option>
// </select>`;
//         }
//         return '<div class="uk-margin-small">&nbsp;</div>';
//     };
    const createFileListItem = ({ dir_name, file_size, id, name }: any) => `
<li class="uk-flex uk-flex-center uk-flex-middle uk-flex-wrap" data-id=${id} data-dir-name="${dir_name}">
  <input class="uk-checkbox uk-margin-xsmall-bottom uk-margin-xsmall-left uk-margin-xsmall-right uk-margin-xsmall-top" type="checkbox">
  <button class="anfima-file-manager-rename uk-button uk-button-small uk-icon" uk-icon="icon: pencil"></button>
  <span class="uk-flex-1 uk-text-truncate">${name}</span>
  <button class="anfima-button-none uk-button uk-button-small" disabled>${sizeToString(file_size)}</button>
  <button class="anfima-file-manager-info uk-button uk-button-small uk-icon" uk-icon="icon: info"></button>
</li>`;
    const createFileListItems = (dir_name: string, category: string = '') => {
        let data = '';
        for (let id in userFiles) {
            // if (userFiles[id].dir_name != dir_name)
            //     continue;
            // if (userFiles[id].category != category)
            //     continue;
            data += createFileListItem(userFiles[id]);
        }
        return data;
    };

    // ----------------------------------------------------------------------------------------------------------------

    const createAddModalFileItem = (name: string, dir_name: 'cabinets' | 'neural-models') => `
<div class="uk-flex uk-flex-center uk-flex-middle uk-flex-wrap">
  <input class="uk-flex-1 uk-input uk-form-width-medium uk-form-small" name="name" type="text" value="${name}"></input>
  <button class="uk-button uk-button-danger uk-button-small uk-flex-last@xs uk-margin-xsmall-left uk-icon" uk-icon="icon: trash"></button>
  ${dir_name == 'neural-models' && `
<select class="uk-select uk-form-width-small uk-form-small uk-margin-xsmall-left" name="category">
  <option>Amps</option>
  <option>Pedals</option>
  <option>Miscellaneous</option>
</select>
  ` || ''}
</div>`;

    const createAddModalFileItems = (files: Array<File>) => {
        const dirName = getSelectedDirName();
        let data = '';
        for (const file of files) {
            let name = file.name;
            const sep = name.lastIndexOf('.');
            if (sep > 1) {
                name = name.substring(0, sep);
            }
            data += createAddModalFileItem(name, dirName);
        }
        return data;
    };

    const getSelectedDirName = (): 'cabinets' | 'neural-models' => {
        const selectedFilter = elems.filterControls.querySelector('.uk-active') as HTMLElement;
        const selectedAttribute = (selectedFilter.getAttribute('uk-filter-control') as string);
        const selectedDirName = (selectedAttribute.match(/^\[data-dir-name='(.*)\']/) as RegExpMatchArray)[1];
        switch (selectedDirName) {
        case 'cabinets':
        case 'neural-models':
            return selectedDirName;
        default:
            console.error('invalid file type', selectedDirName);
            return 'cabinets';
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    const infoButtonClicked = (e: PointerEvent, button: HTMLButtonElement) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        const parent = button.parentElement as HTMLElement;
        const userFile = userFiles[parent.getAttribute('data-id') as string];

        logger.useReportElem();
        logger.info(`Name: ${userFile.name}${userFile.category && ('\nCategory: ' + userFile.category)}
Anagram filename: ${userFile.file_name}
Original filename: ${userFile.original_file_name}
File type: ${userFile.dir_name}
File size: ${sizeToString(userFile.file_size)}
Tags: ${userFile.tags.join(', ') || '(none)'}
Created at: ${dateToString(userFile.created_at)}
Updated at: ${dateToString(userFile.updated_at)}`);
    };

    const renameButtonClicked = (ev: PointerEvent, button: HTMLButtonElement) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        const parent = button.parentElement as HTMLElement;
        const span = parent.querySelector('span.uk-flex-1') as HTMLElement;

        nextItemIds = [parent.getAttribute('data-id') as string];

        elems.renameModal.input.value = span.textContent;

        UIkit.modal(elems.renameModal.container).show();
    };

    const updateVisibility = () => {
        // let hasSelectedItems = false;
        let hasVisibleItems = false;
        const items = elems.filelist.children;
        for (let i = 0; i < items.length; ++i) {
            const item = items[i] as HTMLElement;
            if (item.style.display !== 'none') {
                hasVisibleItems = true;
                // if ((item.querySelector('input.uk-checkbox') as HTMLInputElement).checked) {
                //     hasSelectedItems = true;
                break;
                // }
            }
        }

        // if (hasSelectedItems) {
        // } else {
        // }

        if (hasVisibleItems) {
            elems.placeholder.classList.add('uk-hidden');
            // elems.addButton.classList.remove('uk-invisible');
            elems.selectAllButton.classList.remove('uk-invisible');
            elems.removeButton.classList.remove('uk-invisible');
        } else {
            elems.placeholder.classList.remove('uk-hidden');
            // elems.addButton.classList.add('uk-invisible');
            elems.selectAllButton.classList.add('uk-invisible');
            elems.removeButton.classList.add('uk-invisible');
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    const reindexAddModalFiles = () => {
        const fileElems = elems.addModal.files.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
        for (let i = 0; i < fileElems.length; ++i) {
            fileElems[i].setAttribute('data-index', '' + i);
        }
    };

    elems.addButton.onclick = (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        const input = document.createElement('input');
        input.classList.add('uk-hidden');
        input.setAttribute('multiple','');
        input.setAttribute('type','file');

        switch (getSelectedDirName()) {
        case 'cabinets':
            input.setAttribute('accept', '.wav');
            break;
        case 'neural-models':
            input.setAttribute('accept', '.aidax,.json,.nam');
            break;
        }

        input.addEventListener('cancel', (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            nextFiles = [];
            // document.body.removeChild(input);
            UIkit.modal(elems.addModal.container).hide();
        });

        input.onchange = (ev: Event) => {
            ev.preventDefault();
            (ev.target as HTMLInputElement).blur();

            nextFiles = input.files != null ? Array.from(input.files) : [];

            if (nextFiles.length === 0) {
                UIkit.modal(elems.addModal.container).hide();
                return;
            }

            elems.addModal.files.innerHTML = createAddModalFileItems(nextFiles);

            reindexAddModalFiles();

            (elems.addModal.files.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
            .forEach((el: HTMLButtonElement) => {
                el.onclick = (ev: PointerEvent) => {
                    const buttonContainer = el.parentElement as HTMLElement;
                    elems.addModal.files.removeChild(buttonContainer);

                    const index = parseInt(el.getAttribute('data-index') as string);
                    nextFiles.splice(index, 1);

                    if (nextFiles.length !== 0) {
                        reindexAddModalFiles();
                    } else {
                        UIkit.modal(elems.addModal.container).hide();
                    }
                }
            });
        };

        // document.body.appendChild(input);
        input.click();

        elems.addModal.files.innerHTML = 'Please select a file from the file dialog...';
        UIkit.modal(elems.addModal.container).show();
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.addModal.container.onsubmit = async (ev: SubmitEvent) => {
        ev.preventDefault();
        (ev.target as HTMLFormElement).blur();

        logger.useReportElem();
        logger.info('Adding files...');

        const files = nextFiles;
        nextFiles = [];

        if (files.length === 0) {
            return;
        }

        const fileElems = elems.addModal.files.children;

        if (files.length != fileElems.length) {
            logger.error('File data mismatch');
            return;
        }

        const dir_name = getSelectedDirName();

        // try {
        //     backend.files.connect(() => {}, () => {});
        // } catch (error) {
        //     logger.error(error as string);
        //     return;
        // }

        elems.placeholder.classList.add('uk-hidden');

        let lastError = '';
        for (let i = 0; i < files.length; ++i) {
            const file = files[i];

            try {
                const name = (fileElems[i].querySelector('input[name="name"]') as HTMLInputElement).value;
                const category = dir_name == 'neural-models'
                               ? (fileElems[i].querySelector('select[name="category"]') as HTMLSelectElement).value
                               : '';
                const userFile = {
                    category,
                    dir_name,
                    file_name: file.name,
                    file_size: file.size,
                    is_firmware: false,
                    name,
                    tags: [],
                    uris: [],
                };
                const payload = new Uint8Array(await file.arrayBuffer());

                await backend.openFileReceiver(userFile);
                await backend.transferSinglePayload(payload, (progress: number) => {
                    logger.info(`Transferring file ${i+1}/${files.length} (${progress}%)`);
                });

                /*
                elems.filelist.insertAdjacentHTML('beforeend', createFileListItem(userFile));

                const li = elems.filelist.querySelector(`li[data-id="${userFile.id}"]`) as HTMLElement;
                const elInfo = li.querySelector('.anfima-file-manager-info') as HTMLButtonElement;
                const elRename = li.querySelector('.anfima-file-manager-rename') as HTMLButtonElement;
                elInfo.onclick = (ev: PointerEvent) => infoButtonClicked(ev, elInfo);
                elRename.onclick = (ev: PointerEvent) => renameButtonClicked(ev, elRename);
                */

            } catch (error) {
                lastError = error as string;
                logger.error(lastError);
                break;
            }
        }

        // try {
        //     backend.files.release();
        // } catch (error) {
        // }

        // FIXME
        // updateVisibility();
        await initFileManager(backend, htmlElements, logger);

        if (lastError) {
            logger.error(lastError);
        } else {
            logger.info('Transfer complete!');
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.removeButton.onclick = (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        const selected = elems.filelist.querySelectorAll('input.uk-checkbox:checked');
        if (selected.length === 0) {
            logger.useReportElem();
            logger.info('No files selected, please select any files for deletion first');
            return;
        }

        const names = [];
        nextItemIds = [];
        for (let input of selected) {
            const id = (input.parentElement as HTMLElement).getAttribute('data-id') as string;
            names.push(userFiles[id].name);
            nextItemIds.push(id);
        }

        const p = elems.removeModal.querySelector('p') as HTMLElement;
        p.textContent = `You are about to delete the following files:\n\t- ${names.join('\n\t- ')}`;
        UIkit.modal(elems.removeModal).show();
    };

    elems.removeModal.onsubmit = async (ev: SubmitEvent) => {
        ev.preventDefault();
        (ev.target as HTMLFormElement).blur();

        logger.useReportElem();
        logger.info('Deleting file(s)...');

        try {
            const ids = nextItemIds;

            for (let id of ids) {
                const userFile = userFiles[id];
                delete userFiles[id];

                const res = await backend.removeUserFile(userFile);
                if (! res.payload.success || ! res.payload.fs_success) {
                    throw(res.payload.err_message);
                }

                const li = elems.filelist.querySelector(`li[data-id="${id}"]`) as HTMLElement;
                li.remove();
            }

            updateVisibility();

            logger.info('File(s) have been deleted successfully');
        } catch (error) {
            logger.error(error as string);
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.renameModal.container.onsubmit = async (ev: SubmitEvent) => {
        ev.preventDefault();
        (ev.target as HTMLFormElement).blur();

        logger.useReportElem();
        logger.info('Renaming file...');

        try {
            const id: string = nextItemIds[0];
            const userFile = userFiles[id];
            const name: string = elems.renameModal.input.value;

            const res = await backend.updateUserFile({ ...userFile, name });
            if (! res.payload.success || ! res.payload.db_success) {
                throw(res.payload.err_message);
            }

            const span = (elems.filelist.querySelector(`li[data-id="${id}"]`) as HTMLElement)
                .querySelector('span.uk-flex-1') as HTMLElement;
            span.textContent = userFile.name = name;

            logger.info('File has been renamed successfully');
        } catch (error) {
            logger.error(error as string);
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.selectAllButton.onclick = (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        const items = elems.filelist.children;
        let hasNonChecked = false;
        // 1st pass, check if there are any non-checked
        for (let i = 0; i < items.length; ++i) {
            const item = items[i] as HTMLElement;
            if (item.style.display !== 'none') {
                if (! (item.querySelector('input.uk-checkbox') as HTMLInputElement).checked) {
                    hasNonChecked = true;
                    break;
                }
            }
        }
        // 2nd pass, put everything in the same state
        const toChecked = hasNonChecked ? true : false;
        for (let i = 0; i < items.length; ++i) {
            const item = items[i] as HTMLElement;
            if (item.style.display !== 'none') {
                (item.querySelector('input.uk-checkbox') as HTMLInputElement).checked = toChecked;
            }
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.filelist.innerHTML = createFileListItems(getSelectedDirName());

    // (elems.filelist.querySelectorAll('.anfima-file-manager-category') as NodeListOf<HTMLSelectElement>)
    // .forEach((el: HTMLSelectElement) => {
    //     el.onchange = (e) => categoryChanged(e, el);
    // });

    (elems.filelist.querySelectorAll('.anfima-file-manager-info') as NodeListOf<HTMLButtonElement>)
    .forEach((el: HTMLButtonElement) => {
        el.onclick = (ev: PointerEvent) => infoButtonClicked(ev, el);
    });

    (elems.filelist.querySelectorAll('.anfima-file-manager-rename') as NodeListOf<HTMLButtonElement>)
    .forEach((el: HTMLButtonElement) => {
        el.onclick = (ev: PointerEvent) => renameButtonClicked(ev, el);
    });

    elems.filter.addEventListener('beforeFilter', () => {
        elems.placeholder.classList.add('uk-hidden');
    });

    elems.filter.addEventListener('afterFilter', updateVisibility);

    updateVisibility();

    // ----------------------------------------------------------------------------------------------------------------
};
