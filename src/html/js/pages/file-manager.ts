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
    const createItem = ({ dir_name, file_size, id, name }: any): string => `
<li class="uk-flex uk-flex-center uk-flex-middle uk-flex-wrap" data-id=${id} data-dir-name="${dir_name}">
  <input class="uk-checkbox uk-margin-xsmall-bottom uk-margin-xsmall-left uk-margin-xsmall-right uk-margin-xsmall-top" type="checkbox">
  <button class="anfima-file-manager-rename uk-button uk-button-small uk-icon" uk-icon="icon: pencil"></button>
  <span class="uk-flex-1 uk-text-truncate">${name}</span>
  <span class="uk-text-center uk-width-small">${sizeToString(file_size)}</span>
  <button class="anfima-file-manager-info uk-button uk-button-small uk-icon" uk-icon="icon: info"></button>
</li>`;
    const createItems = (dir_name: string, category: string = ''): string => {
        let data = '';
        for (let id in userFiles) {
            // if (userFiles[id].dir_name != dir_name)
            //     continue;
            // if (userFiles[id].category != category)
            //     continue;
            data += createItem(userFiles[id]);
        };
        return data;
    };

    // ----------------------------------------------------------------------------------------------------------------

    // const categoryChanged = async (e: Event, select: HTMLSelectElement) => {
    //     e.preventDefault();
    //     (e.target as HTMLSelectElement).blur();
    // 
    //     const category = (e.target as HTMLSelectElement).value;
    // 
    //     const parent = select.parentElement as HTMLElement;
    //     const userFile = userFiles[parent.getAttribute('data-id') as string];
    // 
    //     const nextOption = select.querySelector(`option[data-category="${category}"]`) as HTMLOptionElement;
    //     const prevOption = select.querySelector('option[selected]') as HTMLOptionElement;
    //     const prevCategory: string = prevOption.text;
    // 
    //     logger.useReportElem();
    //     logger.info('Changing category...');
    // 
    //     try {
    //         const res = await backend.updateUserFile({ ...userFile, category });
    //         if (! res.payload.success || ! res.payload.db_success) {
    //             throw(res.payload.err_message);
    //         }
    // 
    //         userFile.category = category;
    // 
    //         prevOption.removeAttribute('selected');
    //         nextOption.setAttribute('selected', '');
    // 
    //         logger.info('Category changed successfully');
    //     } catch (error) {
    //         logger.error(error as string);
    // 
    //         // revert
    //         select.value = prevCategory;
    //     }
    // };

    const infoButtonClicked = (e: MouseEvent, button: HTMLButtonElement) => {
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

    const renameButtonClicked = (e: MouseEvent, button: HTMLButtonElement) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        const parent = button.parentElement as HTMLElement;
        const span = parent.querySelector('span.uk-flex-1') as HTMLElement;

        nextItemIds = [parent.getAttribute('data-id') as string];

        elems.renameModal.input.value = span.textContent;

        UIkit.modal(elems.renameModal.container).show();
    };

    const updateVisibility = () => {
        let hasSelectedItems = false;
        let hasVisibleItems = false;
        const items = elems.filelist.children;
        for (let i = 0; i < items.length; ++i) {
            const item = items[i] as HTMLElement;
            if (item.style.display !== 'none') {
                hasVisibleItems = true;
                if ((item.querySelector('input.uk-checkbox') as HTMLInputElement).checked) {
                    hasSelectedItems = true;
                    break;
                }
            }
        }

        if (hasSelectedItems) {
        } else {
        }

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

    elems.addButton.onclick = (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        elems.renameModal.input.value = 'This is a test for add';
        UIkit.modal(elems.addModal).show();
    };

    elems.addModal.onsubmit = async (e) => {
        e.preventDefault();
        (e.target as HTMLFormElement).blur();

        logger.useReportElem();
        logger.info('Adding file...');

        // TODO
        setTimeout(() => {
            const id = 9999;
            const date = '2026-04-11T11:14:02.659Z';
            userFiles[id] = { category: 'Pedals', created_at: date, dir_name: 'neural-models', file_name: 'C9999.nam', file_size: 283092, gain: 0, id, name: 'test9999', original_file_name: 'test9999.nam', tags: [], updated_at: date, uris: [], };

            elems.filelist.insertAdjacentHTML('beforeend', createItem(userFiles[id]));

            const li = elems.filelist.querySelector(`li[data-id="${id}"]`) as HTMLElement;
            // const elCategory = li.querySelector('.anfima-file-manager-category') as HTMLSelectElement;
            const elInfo = li.querySelector('.anfima-file-manager-info') as HTMLButtonElement;
            const elRename = li.querySelector('.anfima-file-manager-rename') as HTMLButtonElement;
            // elCategory.onchange = (e) => categoryChanged(e, elCategory);
            elInfo.onclick = (e) => infoButtonClicked(e, elInfo);
            elRename.onclick = (e) => renameButtonClicked(e, elRename);

            updateVisibility();

            logger.info('File has been added successfully');
        }, 1000);
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.removeButton.onclick = (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

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

    elems.removeModal.onsubmit = async (e) => {
        e.preventDefault();
        (e.target as HTMLFormElement).blur();

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

    elems.renameModal.container.onsubmit = async (e) => {
        e.preventDefault();
        (e.target as HTMLFormElement).blur();

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

    elems.selectAllButton.onclick = (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

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

    elems.filelist.innerHTML = createItems('cabinets');

    // (elems.filelist.querySelectorAll('.anfima-file-manager-category') as NodeListOf<HTMLSelectElement>)
    // .forEach((el: HTMLSelectElement) => {
    //     el.onchange = (e) => categoryChanged(e, el);
    // });

    (elems.filelist.querySelectorAll('.anfima-file-manager-info') as NodeListOf<HTMLButtonElement>)
    .forEach((el: HTMLButtonElement) => {
        el.onclick = (e) => infoButtonClicked(e, el);
    });

    (elems.filelist.querySelectorAll('.anfima-file-manager-rename') as NodeListOf<HTMLButtonElement>)
    .forEach((el: HTMLButtonElement) => {
        el.onclick = (e) => renameButtonClicked(e, el);
    });

    elems.filter.addEventListener('beforeFilter', () => {
        elems.placeholder.classList.add('uk-hidden');
    });

    elems.filter.addEventListener('afterFilter', updateVisibility);

    updateVisibility();

    // ----------------------------------------------------------------------------------------------------------------
};
