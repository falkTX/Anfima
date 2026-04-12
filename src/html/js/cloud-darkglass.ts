// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import {
    DarkglassCloud,
    DarkglassCloudMethods,
    LicenseType,
    MyPedalUser,
    PurchasedLicenses,
    ShopifyProductNode,
    ShopifyProducts,
} from './anfima-types/cloud-darkglass';

const initDarkglassCloud = (): DarkglassCloud => {
    const API_DARKLASS = 'https://api-v2.darkglass.com';

    let token: string = '';
    try {
        token = localStorage.getItem('mypedal-token') || '';
    } catch (_) {}

    const cloud: DarkglassCloud = {
        token,
        username: '',
        marketplacePurchasedLicensesMe: () => {
            return new Promise<PurchasedLicenses>(async (success, reject) => {
                if (cloud.token.length === 0) {
                    reject('Unauthorized');
                    return;
                }
                try {
                    const resp = await fetch(API_DARKLASS + '/marketplace/purchased-licenses/me', {
                        headers: {
                            'X-Auth': cloud.token,
                        },
                    });
                    const json = await resp.json() as PurchasedLicenses;

                    if (json.statusCode !== 200) {
                        reject(`Darkglass Server Error: ${ json.statusCode }`);
                        return;
                    }

                    success(json);
                } catch (error) {
                    reject(error);
                }
            });
        },
        myPedalUser: () => {
            return new Promise<MyPedalUser>(async (success, reject) => {
                if (cloud.token.length === 0) {
                    reject('Unauthorized');
                    return;
                }
                try {
                    const resp = await fetch(API_DARKLASS + '/mypedal/user', {
                        headers: {
                            'X-Auth': cloud.token,
                        },
                    });
                    const json = await resp.json() as MyPedalUser;

                    if (json.statusCode !== 200) {
                        reject(`Darkglass Server Error: ${ json.statusCode }`);
                        return;
                    }

                    success(json);
                } catch (error) {
                    reject(error);
                }
                
            });
        },
        shopifyProducts: () => {
            return new Promise<ShopifyProducts>(async (success, reject) => {
                try {
                    const resp = await fetch(API_DARKLASS + '/shopify/products?all=1');
                    const json = await resp.json() as ShopifyProducts;

                    if (json.statusCode !== 200) {
                        reject(`Darkglass Server Error: ${ json.statusCode }`);
                        return;
                    }

                    success(json);
                } catch (error) {
                    reject(error);
                }
            });
        },
        ssoSignIn: (email: string, password: string) => {
            return new Promise<string>((success, reject) => {
                // NOTE this is a big workaround due to darkglass SSO not allowing direct POST requests
                const timeout = setTimeout(() => {
                    triggerReject('Timed out');
                }, 5000);
                const triggerSuccess = (token: string) => {
                    clearTimeout(timeout);
                    document.body.removeChild(iframe);
                    success(token);
                };
                const triggerReject = (error: string) => {
                    clearTimeout(timeout);
                    document.body.removeChild(iframe);
                    console.error(error);
                    reject(error);
                };

                const iframe = document.createElement('iframe');
                iframe.addEventListener('load', () => {
                    const iframeWindow = iframe.contentWindow;
                    if (! iframeWindow) {
                        triggerReject('Failed to setup log-in wrapper');
                        return;
                    }

                    if (iframeWindow.location.search.indexOf('token') > 0) {
                        const params = new URLSearchParams(iframeWindow.location.search);
                        const token = params.get('token');
                        if (token) {
                            triggerSuccess(token);
                        } else {
                            triggerReject('Received null token');
                        }
                        return;
                    }

                    try {
                        const iframeDocument = iframeWindow.document;
                        if (iframeDocument.body.textContent.trim() !== 'Empty page has been loaded!') {
                            console.error(iframeDocument.body.textContent);
                            throw ('Failed to load log-in wrapper');
                        }

                        const form = iframeDocument.createElement('form');
                        form.method = 'POST';
                        form.action = `${ API_DARKLASS }/sso/login`;

                        const emailInput = iframeDocument.createElement('input');
                        emailInput.type = 'hidden';
                        emailInput.name = 'email';
                        emailInput.value = email;
                        form.appendChild(emailInput);

                        const passwordInput = iframeDocument.createElement('input');
                        passwordInput.type = 'hidden';
                        passwordInput.name = 'password';
                        passwordInput.value = password;
                        form.appendChild(passwordInput);

                        const redirectInput = iframeDocument.createElement('input');
                        redirectInput.type = 'hidden';
                        redirectInput.name = 'redirect';
                        redirectInput.value = iframeWindow.location.href;
                        form.appendChild(redirectInput);

                        iframeDocument.body.appendChild(form);

                        form.submit();
                    } catch (error) {
                        triggerReject('' + error);
                    }
                });
                iframe.classList.add('uk-hidden');
                iframe.setAttribute('src', `${ window.location.origin }/empty.html`);

                // load iframe now
                document.body.appendChild(iframe);
            });
        },
    };
    return cloud;
};

const initDarkglassCloudMethods = (cloud: DarkglassCloud): DarkglassCloudMethods => {
    const assigned: Array<{ type: LicenseType; uri: string }> = [];
    const products: { [index: string]: ShopifyProductNode } = {};
    let connected = false;

    const cloudMethods = {
        getAssignedPlugins: () => {
            return assigned;
        },
        getProductFromShopify: (uri: string) => {
            if (! connected) {
                return undefined;
            }

            const details = products[uri];
            if (typeof(details) === 'undefined') {
                return undefined;
            }

            return details;
        },
        isLoggedIn: () => {
            return cloud.token.length !== 0;
        },
        login: (email: string, password: string)  => {
            return new Promise<string>(async (success, reject) => {
                cloudMethods.logout();

                try {
                    cloud.token = await cloud.ssoSignIn(email, password);
                    await cloudMethods.loginCheck();
                    await cloudMethods.reloadPurchases();
                } catch (error) {
                    reject(error);
                    return;
                }

                try {
                    localStorage.setItem('mypedal-token', cloud.token);
                } catch (_) {}

                success(cloud.username);
            });
        },
        loginCheck: () => {
            return new Promise<string>(async (success, reject) => {
                cloud.username = '';

                try {
                    cloud.username = (await cloud.myPedalUser()).data.name;
                } catch (error) {
                    reject(error);
                    return;
                }

                success(cloud.username);
            });
        },
        logout: () => {
            cloud.token = '';
            cloud.username = '';

            try {
                localStorage.removeItem('mypedal-token');
            } catch (_) {}
        },
        reload: () => {
            return new Promise<void>(async (success, reject) => {
                connected = false;
                for (let key of Object.keys(products)) {
                    delete products[key];
                }

                try {
                    const json = await cloud.shopifyProducts();

                    for (let edge of json.data.edges) {
                        const node = edge.node;
                        if (node.variants.edges.length === 0) {
                            continue;
                        }
                        const variant = node.variants.edges[0].node;
                        products[variant.sku] = node;
                    }
                } catch (error) {
                    reject(error);
                    return;
                }

                if (cloud.token.length !== 0) {
                    try {
                        await cloudMethods.reloadPurchases();
                    } catch (_) {
                        cloud.token = '';
                    }
                }

                connected = true;
                success();
            });
        },
        reloadPurchases: () => {
            return new Promise<void>(async (success, reject) => {
                assigned.splice(0);

                try {
                    const json = await cloud.marketplacePurchasedLicensesMe();

                    for (let purchased of json.data.purchasedLicenses) {
                        if (typeof(products[purchased.license.uri]) === 'undefined') {
                            products[purchased.license.uri] = {
                                id: purchased.license.merchant_product_id, // FIXME
                                title: purchased.license.name,
                                description: '',
                                descriptionHtml: '',
                                productType: '', // TODO
                                tags: [], // TODO
                                images: {
                                     edges: [{
                                         node: {
                                             url: purchased.license.img_url,
                                         },
                                     }],
                                },
                                vendor: purchased.license.author,
                                createdAt: purchased.license.created_at,
                                updatedAt: purchased.license.updated_at,
                                variants: {
                                     edges: [{
                                         node: {
                                             id: '', // TODO
                                             title: '', // TODO
                                             sku: purchased.license.uri,
                                             price: {
                                                 amount: '0', // TODO
                                                 currencyCode: 'EUR',
                                             },
                                         },
                                         // TODO
                                     }],
                                },
                            };
                        }

                        assigned.push({
                            type: purchased.license.type,
                            uri: purchased.license.uri,
                        });
                    }
                } catch (error) {
                    reject(error);
                    return;
                }

                success();
            });
        },
    };
    return cloudMethods;
};
