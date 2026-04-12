// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#pragma once

#ifdef __cplusplus
extern "C" {
#else
#include <stdbool.h>
#endif

struct Serial;

struct Serial* anfima_serial_open();
bool anfima_serial_send(struct Serial* serial, const void* data, unsigned int size);
bool anfima_serial_idle(struct Serial* serial, int* progress);
void anfima_serial_close(struct Serial* serial);

const char* anfima_serial_error(struct Serial* serial = nullptr);

#ifdef __cplusplus
}
#endif
