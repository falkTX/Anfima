// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#include "anfima-serial.h"
#include "extra/Time.hpp"

// TODO
#include <filesystem>

#include "libfios.h"

// --------------------------------------------------------------------------------------------------------------------

struct Serial {
    fios_file_t* file;
    fios_serial_t* serial;
    // const uint8_t* data;
    // unsigned int offset;
    // unsigned int size;
};

// --------------------------------------------------------------------------------------------------------------------

// TODO
static const char* findAnagramSerialPath()
{
#if defined(DISTRHO_OS_LINUX)
    if (std::filesystem::exists("/dev/ttyACM0"))
        return "/dev/ttyACM0";
    if (std::filesystem::exists("/dev/ttyACM1"))
        return "/dev/ttyACM1";
#elif defined(DISTRHO_OS_MAC)
    if (std::filesystem::exists("/dev/tty.usbmodemDGANC76VA8675"))
        return "/dev/tty.usbmodemDGANC76VA8675";
#endif
    return nullptr;
}

static const char* _lastInternalError = nullptr;

// --------------------------------------------------------------------------------------------------------------------

Serial* anfima_serial_open()
{
    const char* const path = findAnagramSerialPath();
    if (path == nullptr)
    {
        _lastInternalError = "Failed to find serial device";
        return nullptr;
    }

    Serial* const serial = new Serial;
    if (serial == nullptr)
    {
        _lastInternalError = "Out of memory";
        return nullptr;
    }

    if (serial->serial = fios_serial_open(path); serial->serial == nullptr)
    {
        _lastInternalError = "Failed to open serial";
        goto free;
    }

    serial->file = nullptr;

    return serial;

free:
    delete serial;
    return nullptr;
}

bool anfima_serial_send(Serial* const serial, const void* const data, const unsigned int size)
{
    // serial->data = (const uint8_t*)data;
    // serial->offset = 0;
    // serial->size = size;

    if (FILE* const f = std::fopen("/tmp/test-web-dump.bin", "wb"); f != nullptr)
    {
        std::fwrite(data, size, 1, f);
        std::fclose(f);

        serial->file = fios_file_send(serial->serial, "/tmp/test-web-dump.bin");
        DISTRHO_SAFE_ASSERT_RETURN(serial->file != nullptr, false);

        return true;
    }

    _lastInternalError = "Failed to open temporary file";
    return false;
}

bool anfima_serial_idle(Serial* const serial, int* const progress)
{
    if (serial->file == nullptr)
    {
        _lastInternalError = "Serial file already closed";
        *progress = -1;
        return false;
    }

    switch (fios_file_idle(serial->file, nullptr))
    {
    case fios_file_status_in_progress:
        *progress = d_roundToIntPositive(fios_file_get_progress(serial->file) * 100);
        return true;

    case fios_file_status_completed:
        *progress = 100;
        fios_file_close(serial->file);
        serial->file = nullptr;
        return false;

    default:
        *progress = -1;
        // don't close file just yet, so we can fetch error later
        return false;
    }
}

void anfima_serial_close(Serial* const serial)
{
    if (serial == nullptr)
        return;

    if (serial->file != nullptr)
        fios_file_close(serial->file);

    fios_serial_close(serial->serial);
    delete serial;
}

const char* anfima_serial_error(Serial* const serial)
{
    if (serial == nullptr || serial->file == nullptr)
        return _lastInternalError;

    return fios_file_get_last_error(serial->file);
}

// --------------------------------------------------------------------------------------------------------------------
