// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

import { AnfimaBackend } from './backend.js';
import { DarkglassCloudMethods } from './cloud-darkglass.js';
import { MODAudioCloudMethods } from './cloud-modaudio.js';
import { Logger } from './logger.js';

type CloudType = DarkglassCloudMethods & MODAudioCloudMethods;

interface Cloud extends CloudType {
    authorized: boolean;
    online: boolean;
}

interface AnfimaCloud extends Cloud {
    authorize: (backend: AnfimaBackend, logger: Logger) => Promise<void>;
    register: (backend: AnfimaBackend, logger: Logger) => Promise<void>;
}

export { AnfimaCloud, Cloud };
