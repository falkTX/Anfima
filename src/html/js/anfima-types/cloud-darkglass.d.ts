// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

type LicenseType = '0' | '1' | '2';

interface MyPedalUser {
    data: {
        confirmed: 0 | 1;
        email: string;
        id: number;
        name: string;
    },
    status: string;
    statusCode: number;
}

interface PurchasedLicenses {
    data: {
        purchasedLicenses: Array<{
            id: number;
            created_at: string;
            license: {
                author: string;
                created_at: string;
                id: number;
                img_url: string;
                merchant_product_id: string;
                name: string;
                type: '0' | '1' | '2';
                updated_at: string;
                uri: string;
            };
            status: 'ACTIVE' | 'INACTIVE';
            syncedLicenses: Array<{
                id: number;
                registeredProduct: {
                    created_at: string;
                    id: number;
                    serial: string;
                    updated_at: string;
                };
            }>;
            updated_at: string;
        }>;
    },
    status: string;
    statusCode: number;
}

interface ShopifyProductNode {
    id: string;
    title: string;
    description: string;
    descriptionHtml: string;
    productType: string;
    tags: Array<string>;
    images: {
        edges: Array<{ node: ShopifyProductImageNode }>;
    };
    vendor: string;
    createdAt: string;
    updatedAt: string;
    variants: {
        edges: Array<{ node: ShopifyProductVariantNode }>;
    };
}

interface ShopifyProductImageNode {
    url: string;
}

interface ShopifyProductVariantNode {
    id: string;
    title: string;
    sku: string;
    price: {
        amount: string;
        currencyCode: 'EUR';
    };
}

interface ShopifyProducts {
    data: {
        edges: Array<{ node: ShopifyProductNode }>;
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    },
    status: string;
    statusCode: number;
}

interface DarkglassCloud {
    token: string;
    username: string;
    marketplacePurchasedLicensesMe: () => Promise<PurchasedLicenses>;
    myPedalUser: () => Promise<MyPedalUser>;
    shopifyProducts: () => Promise<ShopifyProducts>;
    ssoSignIn: (email: string, password: string)  => Promise<string>;
}

interface DarkglassCloudMethods {
    getAssignedPlugins: () => Array<{ type: LicenseType; uri: string }>;
    getProductFromShopify: (uri: string) => ShopifyProductNode | undefined;
    isLoggedIn: () => boolean;
    login: (email: string, password: string)  => Promise<string>;
    loginCheck: ()  => Promise<string>;
    logout: () => void;
    reload: () => Promise<void>;
    reloadPurchases: () => Promise<void>;
}

export {
    DarkglassCloud,
    DarkglassCloudMethods,
    LicenseType,
    MyPedalUser,
    PurchasedLicenses,
    ShopifyProductNode,
    ShopifyProducts,
};
