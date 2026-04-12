// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { PluginLicenseType, ReadAllPluginsMessageReply } from '../types/backend-data';
import { Backend } from '../anfima-types/backend';
import { Cloud } from '../anfima-types/cloud';
import { ShopifyProductNode } from '../anfima-types/cloud-darkglass';
import { Plugin } from '../anfima-types/cloud-modaudio';
import { HTMLElements } from '../anfima-types/html';
import { Logger } from '../anfima-types/logger';
import {} from '../anfima-types/globals';

// --------------------------------------------------------------------------------------------------------------------

const initPluginManager = async (backend: Backend, cloud: Cloud, htmlElements: HTMLElements, logger: Logger) => {
    const elems = htmlElements.pages.pluginManager;
    const originalSignInModalText = elems.signInModal.status.innerHTML;
    const originalSignInStatus = elems.signInStatus.textContent;

    if (cloud.online && ! cloud.authorized) {
        elems.grid.innerHTML = 'Device is unauthorized, managing plugins is not allowed';
        // elems.querySelectorAll('button').forEach(b => b.setAttribute('disabled',''));
        return;
    }

    type StatusType = 'installed' | 'not-installed' | 'outdated';

    let currentInfoURI = '';
    let localPlugins: { [k: string]: ReadAllPluginsMessageReply['payload']['data'] } | any = {}; // FIXME type
    let nextActionWarning: '' | 'remove-plugins' = '';

    // ----------------------------------------------------------------------------------------------------------------

    const license2str = (license: PluginLicenseType) => {
        switch (license) {
        case kPluginLicenseTrial:
            return 'trial';
        case kPluginLicensePurchased:
            return 'purchased';
        default:
            return 'free';
        }
    };

    const numberToFixed = (number: number) => {
        const numberAbs = Math.abs(number);
        if (numberAbs < 10)
            return number.toFixed(2);
        if (numberAbs < 100)
            return number.toFixed(1);
        return number.toFixed(0);
    };

    const pluginVersion = (plugin: Plugin) => {
        return `${ plugin.minorVersion }.${ plugin.microVersion }-${ plugin.release_number }`;
    };

    // ----------------------------------------------------------------------------------------------------------------

    const createCloudPluginItem = (license: string, status: StatusType, extraclass: string, plugin: Plugin) => `
<div class="uk-grid-small" data-type='${ license }'>
    <div class="anfima-plugin-card anfima-plugin-card-${ status } ${ extraclass } uk-card uk-card-hover uk-card-secondary" data-uri="${ encodeURI(plugin.uri) }">
        <div class="uk-card-media-top">
            <div class="anfima-cloud-plugin uk-text-center">
                <p class="uk-flex uk-flex-middle uk-height-1-1 uk-padding-small uk-text-center">
                    ${ encode(plugin.author.name || plugin.brand) }:
                    <br>
                    ${ encode(plugin.name) }
                </p>
            </div>
        </div>
        <div class="uk-card-body uk-padding-small uk-text-center">
            <p>${ plugin.name }</p>
        </div>
    </div>
</div>`;
    const createLocalPluginItem = (license: string, status: StatusType, extraclass: string, uri: string) => `
<div class="uk-grid-small" data-type='${ license }'>
    <div class="anfima-plugin-card anfima-plugin-card-${ status } ${ extraclass } uk-card uk-card-hover uk-card-secondary" data-uri="${ encodeURI(uri) }">
        <div class="uk-card-media-top">
            <div class="anfima-local-plugin">
                <p class="uk-flex uk-flex-middle uk-height-1-1 uk-padding-small uk-text-center">
                    ${ encode(uri) }
                </p>
            </div>
        </div>
        <div class="uk-card-body uk-padding-small uk-text-center">
            <p>LOCAL</p>
        </div>
    </div>
</div>`;
    const createMarketplacePluginItem = (license: string, status: StatusType, extraclass: string, product: ShopifyProductNode) => `
<div class="uk-grid-small" data-type='${ license }'>
    <div class="anfima-plugin-card anfima-plugin-card-${ status } ${ extraclass } uk-card uk-card-hover uk-card-secondary" data-uri="${ encodeURI(product.variants.edges[0].node.sku) }">
        <div class="uk-card-media-top">
            <img src="${ encodeURI(product.images.edges[0].node.url) }" width="200" height="200" alt="block image">
        </div>
        <div class="uk-card-body uk-padding-small uk-text-center">
            <p>${ encode(product.title) }</p>
        </div>
    </div>
</div>`;
    const createPluginItems = (): string => {
        let data: { [k: string]: string } = {};

        for (let uri in localPlugins) {
            const license = license2str(localPlugins[uri].type);
            const extraclass = license == 'trial' ? 'anfima-plugin-card-trial' : '';

            // fetch online info, assume to be local/development plugin if missing
            const plugin = cloud.getPluginFromMOD(uri);
            if (typeof(plugin) === 'undefined') {
                data[uri] = createLocalPluginItem(license, 'installed', extraclass, uri);
                continue;
            }

            const version = `${ plugin.minorVersion }.${ plugin.microVersion }-${ plugin.release_number }`;
            const status: StatusType = localPlugins[uri].version !== version ? 'outdated' : 'installed';

            // we have plugin info, let's check if it has been published
            const product = cloud.getProductFromShopify(uri);
            if (typeof(product) === 'undefined') {
                data[uri] = createCloudPluginItem(license, status, extraclass, plugin);
                continue;
            }

            data[uri] = createMarketplacePluginItem(license, status, extraclass, product);
        }

        if (cloud.isLoggedIn()) {
            const assigned = cloud.getAssignedPlugins();

            for (let { type, uri } of assigned) {
                // skip plugins that already been added
                if (typeof(localPlugins[uri]) !== 'undefined') {
                    continue;
                }
                // assigned, non-local plugins must exist and have been published
                const plugin = cloud.getPluginFromMOD(uri);
                if (typeof(plugin) === 'undefined') {
                    continue;
                }
                const product = cloud.getProductFromShopify(uri);
                if (typeof(product) === 'undefined') {
                    continue;
                }

                const license = license2str(parseInt(type) as PluginLicenseType);
                const extraclass = license == 'trial' ? 'anfima-plugin-card-trial' : '';
                data[uri] = createMarketplacePluginItem(license, 'not-installed', extraclass, product);
            }
        }

        const uris = Object.keys(data);
        if (uris.length === 0) {
            return `
<p class="uk-text-center">
    There are no plugins installed.
    <br>
    ${ cloud.isLoggedIn()
        ? 'Add some plugins here via the <a href="https://marketplace.anagram.shop/" target="_blank">Anagram Marketplace</a>'
        : 'Sign-in to access your Marketplace plugins'
    }.
</p>`;
        }

        uris.sort();
        return uris.map(uri => data[uri]).join('');
    };

    // ----------------------------------------------------------------------------------------------------------------

    const enableSignInForm = () => {
        elems.signInModal.emailInput.removeAttribute('disabled');
        elems.signInModal.emailInput.classList.remove('anfima-color-disabled');
        elems.signInModal.emailLabel.classList.remove('anfima-color-disabled');
        elems.signInModal.passwordInput.removeAttribute('disabled');
        elems.signInModal.passwordInput.classList.remove('anfima-color-disabled');
        elems.signInModal.passwordLabel.classList.remove('anfima-color-disabled');
        elems.signInModal.submitButton.removeAttribute('disabled');
        elems.signInModal.submitButton.classList.remove('anfima-color-disabled');
        elems.signInModal.submitButton.classList.add('uk-button-primary');
        
    };

    const disableSignInForm = () => {
        elems.signInModal.emailInput.setAttribute('disabled', '');
        elems.signInModal.emailInput.classList.add('anfima-color-disabled');
        elems.signInModal.emailLabel.classList.add('anfima-color-disabled');
        elems.signInModal.passwordInput.setAttribute('disabled', '');
        elems.signInModal.passwordInput.classList.add('anfima-color-disabled');
        elems.signInModal.passwordLabel.classList.add('anfima-color-disabled');
        elems.signInModal.submitButton.setAttribute('disabled', '');
        elems.signInModal.submitButton.classList.add('anfima-color-disabled');
        elems.signInModal.submitButton.classList.remove('uk-button-primary');
    };

    const updateLoginName = (username: string, error: unknown = undefined) => {
        if (username.length !== 0) {
            elems.logOutButton.classList.remove('uk-hidden');
            elems.signInButton.classList.add('uk-hidden');
            elems.signInStatus.textContent = `Signed in as ${ username }.`;
        } else if (typeof(error) === 'string' && error.length === 0) {
            elems.logOutButton.classList.add('uk-hidden');
            elems.signInButton.classList.remove('uk-hidden');
            elems.signInModal.status.innerHTML = originalSignInModalText;
            elems.signInStatus.textContent = originalSignInStatus;
        } else {
            elems.logOutButton.classList.add('uk-hidden');
            elems.signInButton.classList.remove('uk-hidden');
            elems.signInModal.status.textContent = 'Error: ' + error;
            elems.signInStatus.textContent = 'Failed to sign in: ' + error;
        }
    }

    const pluginCardClicked = (e: PointerEvent, el: HTMLElement) => {
        e.preventDefault();
        (e.target as HTMLElement).blur();

        const uri = el.getAttribute('data-uri');
        if (! uri) {
            logger.useReportElem();
            logger.error('Invalid URI');
            return;
        }

        const localPlugin = localPlugins[uri];
        const product = cloud.getProductFromShopify(uri);
        const plugin = cloud.getPluginFromMOD(uri);

        let status: StatusType;
        if (typeof(localPlugin) === 'undefined') {
            status = 'not-installed';
        } else {
            status = 'installed';
            if (typeof(plugin) !== 'undefined') {
                const version = `${ plugin.minorVersion }.${ plugin.microVersion }-${ plugin.release_number }`;
                if (localPlugin.version !== version) {
                    status = 'outdated';
                }
            }
        }

        if (typeof(product) !== 'undefined') {
            elems.infoModal.description.innerHTML = product.descriptionHtml;
            if (product.images.edges.length !== 0) {
                elems.infoModal.image.classList.remove('uk-hidden');
                elems.infoModal.image.src = product.images.edges[0].node.url;
            } else {
                elems.infoModal.image.classList.add('uk-hidden');
                elems.infoModal.image.src = '#';
            }
        } else {
            elems.infoModal.description.textContent = 'No description.';
            elems.infoModal.image.classList.add('uk-hidden');
            elems.infoModal.image.src = '#';
        }

        if (typeof(plugin) !== 'undefined') {
            let data = `
<h4>Parameters</h4>
<table class="uk-table uk-table-divider uk-table-hover uk-table-small">
    <thead>
        <tr>
            <th>Name</th>
            <th class="uk-text-center">Unit</th>
            <th class="uk-text-center">Def</th>
            <th class="uk-text-center">Min</th>
            <th class="uk-text-center">Max</th>
        </tr>
    </thead>
    <tbody>`;
            for (let control of plugin.ports.control.input) {
                switch (control.designation) {
                case 'http://lv2plug.in/ns/ext/time#beatsPerMinute':
                case 'http://lv2plug.in/ns/lv2core#enabled':
                case 'http://kxstudio.sf.net/ns/lv2ext/props#Reset':
                    continue;
                }
                if (control.properties.indexOf('notOnGUI') >= 0) {
                    continue;
                }
                data += `
<tr>
    <td>${ encode(control.name) }</td>
    <td class="uk-text-center">${
        // @ts-ignore
        Object.keys(control.units).indexOf('symbol') >= 0 ? control.units.symbol : '' }</td>
    <td class="uk-text-center">${ numberToFixed(control.ranges.default) }</td>
    <td class="uk-text-center">${ numberToFixed(control.ranges.minimum) }</td>
    <td class="uk-text-center">${ numberToFixed(control.ranges.maximum) }</td>
</tr>`;
            }
            data += '</tbody></table>';
            elems.infoModal.parameters.innerHTML = data;
        } else {
            // not available online, can't show parameters
            elems.infoModal.parameters.innerHTML = '';
        }

        switch (status) {
        case 'installed':
            elems.infoModal.installButton.classList.add('uk-hidden');
            elems.infoModal.removeButton.classList.remove('uk-hidden');
            break;
        case 'not-installed':
            elems.infoModal.installButton.textContent = 'Install';
            elems.infoModal.installButton.classList.remove('uk-hidden');
            elems.infoModal.removeButton.classList.add('uk-hidden');
            break;
        case 'outdated':
            elems.infoModal.installButton.textContent = 'Update';
            elems.infoModal.installButton.classList.remove('uk-hidden');
            elems.infoModal.removeButton.classList.remove('uk-hidden');
            break;
        }

        currentInfoURI = uri;
        UIkit.modal(elems.infoModal.container).show();
    };

    // ----------------------------------------------------------------------------------------------------------------

    const reload = async (reloadCloud: boolean, reloadLocal: boolean, updateHTML: boolean): Promise<string> => {
        try {
            if (reloadCloud) {
                await cloud.reload();
            }

            if (reloadLocal) {
                localPlugins = Object.fromEntries(
                    (await backend.readAllPlugins({ filterOption: 'USER' })).payload.data.map(e => { return [e.uri, e] })
                );
            }
        } catch (error) {
            if (updateHTML) {
                elems.grid.innerHTML = 'Error: ' + error;
            }
            return '' + error;
        }

        if (updateHTML) {
            elems.grid.innerHTML = createPluginItems();

            (elems.grid.querySelectorAll('.anfima-plugin-card') as NodeListOf<HTMLElement>)
            .forEach((el: HTMLElement) => {
                el.onclick = (e: PointerEvent) => pluginCardClicked(e, el);
            });
        }

        return '';
    };

    // ----------------------------------------------------------------------------------------------------------------

    const installBundle = async (bundle_id: string, msg: string = '') => {
        logger.info('Downloading bundle...' + msg);
        const bundle = await cloud.fetchBundleById(bundle_id);

        logger.info('Transfering bundle to Anagram...' + msg);
        await backend.openFileReceiver({
            dirName: 'lv2',
            isFirmware: 0,
            fileName: bundle.name + '.tar.gz',
            signature: bundle.signature,
        });

        await backend.transferSinglePayload(bundle.blob, (progress: number) => {
            logger.info(`Transfering bundle to Anagram (${ progress }%)${ msg }`);
        });
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.infoModal.installButton.onclick = async (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        const uri = currentInfoURI;
        currentInfoURI = '';

        logger.useReportElem();

        if (! cloud.online) {
            logger.error('Running offline, cannot download plugins');
            return;
        }
        if (! cloud.authorized) {
            logger.error('Unauthorized');
            return;
        }

        logger.info('Installing plugin...');

        try {
            const plugin = cloud.getPluginFromMOD(uri);
            if (typeof(plugin) === 'undefined') {
                throw ('Invalid plugin');
            }

            logger.info('Connecting...');
            await backend.prepareForPayload();
            await installBundle(plugin.bundle_id);

            // FIXME hot reload
            logger.info('Reloading contents... (FIXME)');
            await reload(false, true, true);

            logger.info('Plugin installed successfully!');

        } catch (error) {
            logger.error('' + error);
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.infoModal.removeButton.onclick = async (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        const uri = currentInfoURI;
        currentInfoURI = '';

        logger.useReportElem();
        logger.info('Removing plugin...');

        try {
            await backend.deletePlugin({ uri });

            // FIXME hot reload
            logger.info('Reloading contents... (FIXME)');
            await reload(false, true, true);

            logger.info('Plugin removed successfully!');

        } catch (error) {
            logger.error('' + error);
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.installAllButton.onclick = async (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        UIkit.dropdown(elems.moreButtonDropdown).hide();

        logger.useReportElem();

        if (! cloud.online) {
            logger.error('Running offline, cannot download plugins');
            return;
        }
        if (! cloud.authorized) {
            logger.error('Unauthorized');
            return;
        }

        try {
            const assigned = cloud.getAssignedPlugins();
            if (assigned.length === 0) {
                logger.info('There are no plugins to install');
                return;
            }

            const toInstall: Array<string> = [];

            for (let { uri } of assigned) {
                const lplugin = localPlugins[uri];
                if (typeof(lplugin) !== 'undefined') {
                    const plugin = cloud.getPluginFromMOD(uri);
                    if (typeof(plugin) === 'undefined') {
                        continue;
                    }
                    if (lplugin.version === pluginVersion(plugin)) {
                        continue;
                    }
                }
                toInstall.push(uri);
            }

            if (toInstall.length === 0) {
                logger.info('All plugins already installed!');
                return;
            }

            logger.info('Connecting...');
            await backend.prepareForPayload();

            for (let i = 0; i < toInstall.length; ++i) {
                const uri = toInstall[i];
                const plugin = cloud.getPluginFromMOD(uri);
                if (typeof(plugin) === 'undefined') {
                    continue;
                }

                const msg = `\n[ Plugin ${ i + 1 } of ${ toInstall.length } ] | ${ encode(plugin.name) }`;
                await installBundle(plugin.bundle_id, msg);
            }

            // FIXME hot reload
            logger.info('Reloading contents... (FIXME)');
            await reload(false, true, true);

            logger.info('All plugins installed successfully!');
        } catch (error) {
            logger.error('' + error);
        }
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.installBundleButton.onclick = (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        UIkit.dropdown(elems.moreButtonDropdown).hide();

        if (! cloud.online) {
            logger.useReportElem();
            logger.error('Running offline, cannot download plugins');
            return;
        }
        if (! cloud.authorized) {
            logger.useReportElem();
            logger.error('Unauthorized');
            return;
        }

        elems.installBundleModal.input.value = '';

        UIkit.modal(elems.installBundleModal.container).show();
    };

    elems.installBundleModal.container.onsubmit = async (ev: SubmitEvent) => {
        ev.preventDefault();
        (ev.target as HTMLFormElement).blur();

        const bundle_id = elems.installBundleModal.input.value;

        if (bundle_id.length === 0) {
            return;
        }

        logger.useReportElem();

        try {
            logger.info('Connecting...');
            await backend.prepareForPayload();
            await installBundle(bundle_id);

            // FIXME hot reload
            logger.info('Reloading contents... (FIXME)');
            await reload(false, true, true);

            logger.info('Bundle installed successfully!');

        } catch (error) {
            logger.error('' + error);
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    elems.logOutButton.onclick = async (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        UIkit.dropdown(elems.moreButtonDropdown).hide();

        logger.useReportElem();
        logger.info('Logging out...');

        try {
            cloud.logout();

            await reload(true, false, true);

            logger.info('Logged out successfully!');
        } catch (error) {
            logger.error('' + error);
        }

        updateLoginName('', '');
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.refreshButton.onclick = async (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        UIkit.dropdown(elems.moreButtonDropdown).hide();

        logger.useReportElem();
        logger.info('Requesting plugin information...');

        await reload(true, true, true);

        logger.useWelcomeElem();
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.removeAllButton.onclick = (e: PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLButtonElement).blur();

        UIkit.dropdown(elems.moreButtonDropdown).hide();

        if (Object.keys(localPlugins).length === 0) {
            logger.useReportElem();
            logger.info('There are no plugins installed');
            return;
        }

        nextActionWarning = 'remove-plugins';
        elems.warningModal.label.innerHTML = `
You are about to delete all non-system plugins.<br>
This action is irreversible!<br>
<br>
Do you still want to continue?`;

        UIkit.modal(elems.warningModal.container).show();
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.signInButton.onclick = async (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        if (cloud.isLoggedIn()) {
            // FIXME error?
            return;
        }

        elems.signInModal.status.innerHTML = originalSignInModalText;
        elems.signInStatus.textContent = originalSignInStatus;

        enableSignInForm();
        UIkit.modal(elems.signInModal.container).show();
    };

    elems.signInModal.container.onsubmit = async (ev: SubmitEvent) => {
        ev.preventDefault();
        (ev.target as HTMLFormElement).blur();

        disableSignInForm();

        const email = elems.signInModal.emailInput.value;
        const password = elems.signInModal.passwordInput.value;

        try {
            elems.signInModal.status.textContent = 'Signing in...';
            const username = await cloud.login(email, password);
            updateLoginName(username);
        } catch (error) {
            updateLoginName('', error);
            enableSignInForm();
            return;
        }

        elems.signInModal.status.textContent = 'Requesting online plugin info...';

        await reload(true, false, true);

        UIkit.modal(elems.signInModal.container).hide();
    };

    // ----------------------------------------------------------------------------------------------------------------

    elems.updateAllButton.onclick = async (ev: PointerEvent) => {
        ev.preventDefault();
        (ev.target as HTMLButtonElement).blur();

        logger.useReportElem();

        if (! cloud.online) {
            logger.error('Running offline, cannot download plugins');
            return;
        }
        if (! cloud.authorized) {
            logger.error('Unauthorized');
            return;
        }
        if (Object.keys(localPlugins).length === 0) {
            logger.info('There are no plugins installed');
            return;
        }

        try {
            const toUpdate: Array<string> = [];

            for (let uri in localPlugins) {
                const lplugin = localPlugins[uri];
                const plugin = cloud.getPluginFromMOD(uri);
                if (typeof(plugin) === 'undefined') {
                    continue;
                }
                if (lplugin.version === pluginVersion(plugin)) {
                    continue;
                }
                toUpdate.push(uri);
            }

            if (toUpdate.length === 0) {
                logger.info('All plugins already updated!');
                return;
            }

            logger.info('Connecting...');
            await backend.prepareForPayload();

            for (let i = 0; i < toUpdate.length; ++i) {
                const uri = toUpdate[i];
                const plugin = cloud.getPluginFromMOD(uri);
                if (typeof(plugin) === 'undefined') {
                    continue;
                }

                const msg = `\n[ Plugin ${ i + 1 } of ${ toUpdate.length } ] | ${ encode(plugin.name) }`;
                await installBundle(plugin.bundle_id, msg);
            }

            // FIXME hot reload
            logger.info('Reloading contents... (FIXME)');
            await reload(false, true, true);

            logger.info('All plugins updated successfully!');
        } catch (error) {
            logger.error('' + error);
        }
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
        case 'remove-plugins':
            logger.useReportElem();
            logger.info('Removing all plugins...');

            try {
                const uris = Object.keys(localPlugins);
                if (uris.length === 0) {
                    logger.error('There are no plugins installed');
                    return;
                }

                for (let uri of uris) {
                    await backend.deletePlugin({ uri });
                }

                logger.info('Requesting local plugin info...');
                await reload(false, true, true);

                logger.info('Removed all plugins successfully!');
            } catch (error) {
                logger.error('' + error);
            }
            break;
        }
    }

    // ----------------------------------------------------------------------------------------------------------------

    logger.info('Requesting plugin information...');

    try {
        localPlugins = Object.fromEntries(
            (await backend.readAllPlugins({ filterOption: 'USER' })).payload.data.map(e => { return [e.uri, e] })
        );
    } catch (error) {
        elems.grid.innerHTML = 'Failed to query plugin info: ' + error;
        return;
    }

    elems.grid.innerHTML = 'Requesting online plugin info...';
    setTimeout(async () => {
        if (cloud.isLoggedIn()) {
            try {
                const username = await cloud.loginCheck();
                updateLoginName(username);
            } catch (error) {
                updateLoginName('', error);
            }
        } else {
            updateLoginName('', '');
        }
        await reload(true, false, true);
    }, 1);

    // ----------------------------------------------------------------------------------------------------------------
};

// --------------------------------------------------------------------------------------------------------------------
