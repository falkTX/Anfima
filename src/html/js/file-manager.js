// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: ISC

const initFileManager = async (backend, logger) => {
    const elems = {
        container: document.getElementById('anfima-file-manager-container'),
        add: document.getElementById('anfima-file-manager-add'),
        addModal: document.getElementById('anfima-modal-file-add'),
        renameModal: document.getElementById('anfima-modal-file-rename'),
        selectAll: document.getElementById('anfima-file-manager-select-all'),
    };

    const createItem = ({ category, id, name }) => `
<li class="uk-form-horizontal uk-container uk-margin-xsmall">
  <input class="uk-checkbox uk-margin-xsmall-bottom uk-margin-xsmall-left uk-margin-xsmall-right uk-margin-xsmall-top" type="checkbox">
  <div class="uk-inline">
    <a class="anfima-file-manager-rename uk-form-icon uk-icon" data-category="${category}" data-id=${id} uk-icon="icon: pencil"></a>
    <span class="uk-input uk-form-width-medium uk-form-small">${name}</span>
  </div>
  <select class="uk-select uk-form-width-xsmall uk-form-small" aria-label="Small">
    <option>Opt 1</option>
    <option>Opt 2</option>
  </select>
</li>`;

    // shared data between modals
    const nextItemData = {
        category: undefined,
        id: undefined,
        name: undefined,
        // elems
        button: undefined,
        span: undefined,
    };

    elems.add.onclick = () => {
        const input = elems.addModal.children[0].children[0].children[1];
        input.value = 'This is a test';
        UIkit.modal(elems.addModal).show();
    };

    elems.addModal.onsubmit = async (e) => {
        logger.useReportElem();
        logger.info('Adding file...');

        // TODO
        setTimeout(() => {
            logger.info('File has been added successfully');
        }, 1000);
    };

    elems.renameModal.onsubmit = async (e) => {
        // e.preventDefault();
        // e.target.blur();

        // if (! this.checkValidity()) {
        //     return;
        // }
        // UIkit.modal(elems.renameModal).hide();

        logger.useReportElem();
        logger.info('Renaming file...');

        try {
            const res = await backend.data.postMessageWithReply({
                action: 'update_user_file',
                payload: {
                    category: nextItemData.category,
                    id: nextItemData.id,
                    name: nextItemData.name,
                    updated_at: "2025-08-05T13:23:00Z",
                },
            });
            if (! res.payload.success) {
                throw(res.payload.err_message);
            }
            // button.setAttribute('data-id', res.payload.data.id);
            nextItemData.span.textContent = res.payload.data.name;
            logger.info('File has been renamed successfully');
        } catch (error) {
            logger.error(error);
        }
    };

    elems.selectAll.onclick = () => {
        const items = elems.container.children[0].children;
        let hasNonChecked = false;
        // 1st pass, check if there are any non-checked
        for (let i = 0; i < items.length; ++i) {
            if (items[i].style.display !== 'none') {
                if (! items[i].children[0].checked) {
                    hasNonChecked = true;
                    break;
                }
            }
        }
        // 2nd pass, put everything in the same state
        const toChecked = hasNonChecked ? true : false;
        for (let i = 0; i < items.length; ++i) {
            if (items[i].style.display !== 'none') {
                items[i].children[0].checked = toChecked;
            }
        }
    };

    logger.info('Requesting user file list...');

    const res = await backend.findUserFiles();

    let elemdata = '<ul class="uk-list uk-list-collapse uk-list-striped">'
    for (let data of res.payload.data) {
        elemdata += createItem(data);
    }
    elemdata += '</ul>';

    elems.container.innerHTML = elemdata;

    UIkit.util.on('.anfima-file-manager-rename', 'click', function (e) {
        // e.preventDefault();
        // e.target.blur();

        const button = nextItemData.button = this;
        const input = elems.renameModal.children[0].children[0].children[1];
        const span = nextItemData.span = button.parentElement.children[1];

        nextItemData.category = button.getAttribute('data-category');
        nextItemData.id = button.getAttribute('data-id');
        nextItemData.name = span.textContent;

        input.value = nextItemData.name;

        UIkit.modal(elems.renameModal).show();
    });
};
