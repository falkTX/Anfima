// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#pragma once

#ifdef __cplusplus
extern "C" {
#else
#include <stdbool.h>
#endif

struct Serial;

struct SerialStreamingPayload {
    void* buffer;
    int read;
    int written;
    int size;
    bool aborted;
};

struct Serial* anfima_serial_open(const char* usbSerialNumber);
bool anfima_serial_send_file(struct Serial* serial, const char* filename);
bool anfima_serial_send_streaming_payload(struct Serial* serial, struct SerialStreamingPayload* payload);
bool anfima_serial_idle(struct Serial* serial, int* progress);
void anfima_serial_clear(struct Serial* serial);
void anfima_serial_close(struct Serial* serial);

const char* anfima_serial_error(struct Serial* serial = nullptr);

#ifdef __cplusplus
}
#endif
