// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#pragma once

#ifdef __cplusplus
extern "C" {
#else
#include <stdbool.h>
#endif

struct HID;

struct HID* anfima_hid_init(void (*callback)(void* arg, const char* msg), void* arg);
bool anfima_hid_idle(struct HID* hid);
bool anfima_hid_is_reading(const struct HID* hid);
void anfima_hid_send(struct HID* hid, const char* msg);
void anfima_hid_close(struct HID* hid);

const char* anfima_hid_error(struct HID* hid = nullptr);

#ifdef __cplusplus
}
#endif
