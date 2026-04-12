// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#include "anfima-serial.h"

#include "extra/Sleep.hpp"
#include "extra/Time.hpp"

#include "libfios.h"
#include "libfios-stream.h"

#if defined(_WIN32)
#include <cfgmgr32.h>
#include <initguid.h>
#include <devpkey.h>
#include <memory>
#include <string>
#elif defined(__linux__)
#else
#include <cerrno>
#endif

#ifndef _WIN32
#include <dirent.h>
#include <sys/stat.h>
#endif

// --------------------------------------------------------------------------------------------------------------------

struct Serial {
    fios_file_t* file;
    fios_serial_t* serial;
    SerialStreamingPayload* payload;
};

// --------------------------------------------------------------------------------------------------------------------

static char* findAnagramSerialPath(const char* const usbSerialNumber)
{
    DISTRHO_SAFE_ASSERT_RETURN(usbSerialNumber != nullptr, nullptr);

    static constexpr const size_t kSerialNumberLen = 12;
    DISTRHO_SAFE_ASSERT_UINT2_RETURN(std::strlen(usbSerialNumber) == kSerialNumberLen,
                                     std::strlen(usbSerialNumber),
                                     kSerialNumberLen,
                                     nullptr);

  #ifdef _WIN32
    #define SERIAL_DEV_ID_PREFIX     L"USB\\VID_2FA6&PID_2500&"
    #define SERIAL_DEV_PARENT_PREFIX L"USB\\VID_2FA6&PID_2500\\"

    static constexpr const size_t kDevIdPrefixLen = ARRAY_SIZE(SERIAL_DEV_ID_PREFIX) - 1;
    static constexpr const size_t kDevParentPrefixLen = ARRAY_SIZE(SERIAL_DEV_PARENT_PREFIX) - 1;

    static constexpr const wchar_t kSerialGUID[] = L"{4D36E978-E325-11CE-BFC1-08002BE10318}";

    const DEVPROPKEY propKeyParent = DEVPKEY_Device_Parent;
    const DEVPROPKEY propKeyObjectName = DEVPKEY_Device_PDOName;

    ULONG len;
    DWORD res;
    std::wstring wbuffer;

    wchar_t wserial[kSerialNumberLen + 1];
    std::mbstowcs(wserial, usbSerialNumber, kSerialNumberLen + 1);

    // fetch serial devices
    len = 0;
    res = CM_Get_Device_ID_List_SizeW(&len, kSerialGUID, CM_GETIDLIST_FILTER_CLASS | CM_GETIDLIST_FILTER_PRESENT);
    DISTRHO_SAFE_ASSERT_RETURN(res == CR_SUCCESS, nullptr);

    std::unique_ptr<wchar_t[]> devIds = std::make_unique<wchar_t[]>(len);
    res = CM_Get_Device_ID_ListW(kSerialGUID, devIds.get(), len, CM_GETIDLIST_FILTER_CLASS | CM_GETIDLIST_FILTER_PRESENT);
    DISTRHO_SAFE_ASSERT_RETURN(res == CR_SUCCESS, nullptr);

    // iterate over serial devices, trying to find one that matches our serial number
    for (wchar_t* devId = devIds.get(); *devId != '\0'; devId += std::wcslen(devId))
    {
        // device id prefix must be Anagram
        if (std::wcsncmp(devId, SERIAL_DEV_ID_PREFIX, kDevIdPrefixLen) != 0)
            continue;

        DEVINST devinst;
        DEVPROPTYPE devproptype;

        res = CM_Locate_DevInstW(&devinst, devId, CM_LOCATE_DEVNODE_NORMAL);
        DISTRHO_SAFE_ASSERT_CONTINUE(res == CR_SUCCESS);

        // query parent
        len = 0;
        res = CM_Get_DevNode_PropertyW(devinst, &propKeyParent, &devproptype, nullptr, &len, 0);
        DISTRHO_SAFE_ASSERT_CONTINUE(res == CR_SUCCESS || res == CR_BUFFER_SMALL);

        // len must be parent prefix + serial number
        DISTRHO_SAFE_ASSERT_UINT2_RETURN(len == (kDevParentPrefixLen + kSerialNumberLen + 1) * sizeof(wchar_t),
                                         len,
                                         (kDevParentPrefixLen + kSerialNumberLen + 1) * sizeof(wchar_t),
                                         nullptr);

        wbuffer.resize(len);

        res = CM_Get_DevNode_PropertyW(devinst, &propKeyParent, &devproptype, reinterpret_cast<PBYTE>(wbuffer.data()), &len, 0);
        DISTRHO_SAFE_ASSERT_CONTINUE(res == CR_SUCCESS);
        DISTRHO_SAFE_ASSERT_CONTINUE(devproptype == DEVPROP_TYPE_STRING);

        // parent must be Anagram with our serial number
        if (std::wcsncmp(wbuffer.c_str(), SERIAL_DEV_PARENT_PREFIX, kDevParentPrefixLen) != 0)
            continue;
        if (std::wcsncmp(wbuffer.c_str() + kDevParentPrefixLen, wserial, kSerialNumberLen) != 0)
            continue;

        // we found our device, now fetch the object name
        len = 0;
        res = CM_Get_DevNode_PropertyW(devinst, &propKeyObjectName, &devproptype, nullptr, &len, 0);
        DISTRHO_SAFE_ASSERT_CONTINUE(res == CR_SUCCESS || res == CR_BUFFER_SMALL);

        wbuffer.resize(len);

        res = CM_Get_DevNode_PropertyW(devinst, &propKeyObjectName, &devproptype, reinterpret_cast<PBYTE>(wbuffer.data()), &len, 0);
        DISTRHO_SAFE_ASSERT_CONTINUE(res == CR_SUCCESS);
        DISTRHO_SAFE_ASSERT_CONTINUE(devproptype == DEVPROP_TYPE_STRING);

        if (char* const ret = static_cast<char*>(std::malloc(len + 15)))
        {
            std::snprintf(ret, len + 15, "\\\\?\\GLOBALROOT%ls", wbuffer.c_str());
            fprintf(stderr, "serial path: %s\n", ret);
            return ret;
        }

        break;
    }

    return nullptr;
  #else
   #ifdef __linux__
    #define SERIAL_DEV_DIR             "/dev/serial/by-id"
    #define SERIAL_DEV_FILENAME_PREFIX "usb-Darkglass_Electronics_Anagram_"
   #else
    #define SERIAL_DEV_DIR             "/dev"
    #define SERIAL_DEV_FILENAME_PREFIX "tty.usbmodem"
   #endif
    DIR* const dir = opendir(SERIAL_DEV_DIR);
    DISTRHO_SAFE_ASSERT_RETURN(dir != nullptr, nullptr);

    static constexpr const size_t kDirLen = ARRAY_SIZE(SERIAL_DEV_DIR) - 1;
    static constexpr const size_t kFilenamePrefixLen = ARRAY_SIZE(SERIAL_DEV_FILENAME_PREFIX) - 1;

    struct dirent* dirent;
    while ((dirent = readdir(dir)) != nullptr)
    {
        if (std::strncmp(dirent->d_name, SERIAL_DEV_FILENAME_PREFIX, kFilenamePrefixLen) == 0 &&
            std::strncmp(dirent->d_name + kFilenamePrefixLen, usbSerialNumber, kSerialNumberLen) == 0)
            break;
    }

    char* path = nullptr;
    if (dirent != nullptr)
    {
        const size_t dnamelen = std::strlen(dirent->d_name);

        if (path = static_cast<char*>(std::malloc(kDirLen + dnamelen + 2)); path != nullptr)
        {
            std::memcpy(path, SERIAL_DEV_DIR "/", kDirLen + 1);
            std::memcpy(path + kDirLen + 1, dirent->d_name, dnamelen + 1);
        }
    }

    closedir(dir);
    return path;
  #endif
}

static const char* _lastInternalError = nullptr;

// --------------------------------------------------------------------------------------------------------------------

Serial* anfima_serial_open(const char* const usbSerialNumber)
{
    d_stderr("usbSerialNumber %s", usbSerialNumber);

    char* const path = findAnagramSerialPath(usbSerialNumber);
    if (path == nullptr)
    {
        _lastInternalError = "Failed to find serial device";
        return nullptr;
    }

    Serial* const serial = static_cast<Serial*>(std::calloc(1, sizeof(Serial)));
    if (serial == nullptr)
    {
        _lastInternalError = "Out of memory";
        goto free;
    }

    if (serial->serial = fios_serial_open(path); serial->serial == nullptr)
    {
        _lastInternalError = "Failed to open serial";
        goto free;
    }

    serial->file = nullptr;

    std::free(path);
    return serial;

free:
    delete serial;
    std::free(path);
    return nullptr;
}

bool anfima_serial_send_file(Serial* const serial, const char* filename)
{
    DISTRHO_SAFE_ASSERT_RETURN(serial->file == nullptr, false);

    serial->file = fios_file_send(serial->serial, filename);
    return serial->file != nullptr;
}

size_t _anfima_serial_streaming_read(void* const buffer, const size_t size, const size_t n, void* const cookie)
{
    SerialStreamingPayload* const payload = static_cast<SerialStreamingPayload*>(cookie);

    if (payload->read == payload->size)
    {
       #if defined(_WIN32)
       #elif defined(__linux__)
       #else
        errno = 0;
       #endif
        return 0;
    }

    while (payload->read >= payload->written)
    {
        d_msleep(100);

        if (payload->aborted)
        {
           #if defined(_WIN32)
           #elif defined(__linux__)
           #else
            errno = EIO;
           #endif
            return -1;
        }
    }

    size_t len = size * n;

    if (payload->read + len > payload->written)
        len = payload->written - payload->read;

    std::memcpy(buffer, static_cast<uint8_t*>(payload->buffer) + payload->read, len);
    payload->read += len;

    return len;
}

int _anfima_serial_streaming_close(void* const cookie)
{
    SerialStreamingPayload* const payload = static_cast<SerialStreamingPayload*>(cookie);

    payload->aborted = true;

    return 0;
}

bool anfima_serial_send_streaming_payload(Serial* const serial, SerialStreamingPayload* const payload)
{
    DISTRHO_SAFE_ASSERT_RETURN(serial->file == nullptr, false);

    const libfios_stream_functions funcs = {
        .read = _anfima_serial_streaming_read,
        .write = nullptr,
        .close = _anfima_serial_streaming_close,
    };
    serial->file = fios_file_send_stream(serial->serial, payload->size, funcs, payload);
    if (serial->file == nullptr)
    {
        _lastInternalError = "Failed to open serial file";
        return false;
    }

    payload->aborted = false;

    serial->payload = payload;
    return true;
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
        serial->payload = nullptr;
        return false;

    default:
        *progress = -1;
        // don't close file just yet, so we can fetch error later
        return false;
    }
}

void anfima_serial_clear(Serial* const serial)
{
    if (serial == nullptr)
        return;

    if (serial->payload != nullptr)
    {
        serial->payload->aborted = true;
        serial->payload = nullptr;
    }

    if (serial->file != nullptr)
    {
        fios_file_close(serial->file);
        serial->file = nullptr;
    }
}

void anfima_serial_close(Serial* const serial)
{
    if (serial == nullptr)
        return;

    anfima_serial_clear(serial);

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
