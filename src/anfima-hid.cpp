// SPDX-FileCopyrightText: 2026 Filipe Coelho <falktx@falktx.com>
// SPDX-License-Identifier: EUPL-1.2

#include "anfima-hid.h"
#include "extra/Sleep.hpp"

#include "hidapi.h"

#include <atomic>
#include <cassert>
#include <sstream>
#include <string>

#include <pthread.h>

// --------------------------------------------------------------------------------------------------------------------

#define DEVICE_VENDOR 0x2fa6
#define DEVICE_PRODUCT 0x2500

#define REPORT_SIZE 64
#define REPORT_ID 1

// --------------------------------------------------------------------------------------------------------------------

static constexpr const uint8_t MSG_START[] = { 'D','S','T','A','R','T' };
static constexpr const uint8_t MSG_END[] = { 'D','E','N','D' };

// --------------------------------------------------------------------------------------------------------------------

struct HID {
    void (*callback)(void* arg, const char* msg);
    void* arg;
    hid_device* device;
    pthread_t thread;
    pthread_mutex_t mutex;
    std::string recv;
    std::string send;
    bool running = false;
    std::atomic<bool> reading { false };
};

// --------------------------------------------------------------------------------------------------------------------

// ignore last hid error if false
static bool _hid_connected = false;

static char* _hid_error = nullptr;

__attribute__((destructor))
static void _free_hid_error()
{
    std::free(_hid_error);
    _hid_error = nullptr;
}

static void _update_hid_error()
{
    const int err = errno;
    _free_hid_error();
    _hid_error = strdup(std::strerror(err));
}

// --------------------------------------------------------------------------------------------------------------------

static void* _hid_thread(void* arg);

// --------------------------------------------------------------------------------------------------------------------

HID* anfima_hid_init(void (*const callback)(void* arg, const char* msg), void* const arg)
{
    if (struct hid_device_info* const info = hid_enumerate(DEVICE_VENDOR, DEVICE_PRODUCT))
    {
        hid_free_enumeration(info);
        _hid_connected = true;
    }
    else
    {
        _hid_connected = false;
        return nullptr;
    }

    HID* const hid = new HID;
    if (hid == nullptr)
        return nullptr;

    if (hid->device = hid_open(DEVICE_VENDOR, DEVICE_PRODUCT, nullptr); hid->device == nullptr)
        goto free;

    hid_set_nonblocking(hid->device, true);

    hid->callback = callback;
    hid->arg = arg;

    if (pthread_mutex_init(&hid->mutex, nullptr) != 0)
    {
        _update_hid_error();
        goto close;
    }

    hid->running = true;
    if (pthread_create(&hid->thread, nullptr, _hid_thread, hid) == 0)
        return hid;

    _update_hid_error();
    pthread_mutex_destroy(&hid->mutex);

close:
    hid_close(hid->device);

free:
    delete hid;
    return nullptr;
}

bool anfima_hid_idle(HID* const hid)
{
    std::string recv;

    pthread_mutex_lock(&hid->mutex);
    hid->recv.swap(recv);
    pthread_mutex_unlock(&hid->mutex);

    if (! recv.empty())
        hid->callback(hid->arg, recv.c_str());

    return hid->device != nullptr;
}

bool anfima_hid_is_reading(const struct HID* hid)
{
    return hid->reading.load();
}

void anfima_hid_send(HID* const hid, const char* const msg)
{
    pthread_mutex_lock(&hid->mutex);
    assert(hid->send.empty());
    hid->send = msg;
    pthread_mutex_unlock(&hid->mutex);
}

void anfima_hid_close(HID* const hid)
{
    if (hid == nullptr)
        return;

    hid_device* const device = hid->device;
    hid->device = nullptr;

    if (hid->running)
    {
        hid->running = false;
        pthread_join(hid->thread, nullptr);
    }

    if (device != nullptr)
        hid_close(device);

    pthread_mutex_destroy(&hid->mutex);

    delete hid;
}

const char* anfima_hid_error(struct HID* const hid)
{
    if (! _hid_connected)
        return nullptr;

    if (const wchar_t* const error = hid_error(hid != nullptr ? hid->device : nullptr))
    {
        const size_t len = std::wcslen(error);
        _hid_error = static_cast<char*>(std::realloc(_hid_error, len + 1));
        DISTRHO_SAFE_ASSERT_RETURN(_hid_error != nullptr, nullptr);

        std::snprintf(_hid_error, len + 1, "%ls", error);
        _hid_error[len] = '\0';

        return _hid_error;
    }
    return nullptr;
}

// --------------------------------------------------------------------------------------------------------------------

static void _hid_send(HID* const hid, const char* const msg)
{
    uint8_t report[REPORT_SIZE];
    uint8_t start = 0;
    uint8_t end = 0;
    ssize_t w;

    bool done = false;
    for (size_t msglen = std::strlen(msg), msgoff = 0; !done;)
    {
        uint8_t written = 0;

        // always start with the report id
        report[written++] = REPORT_ID;

        // use "DSTART" to indicate beginning of message
        if (msgoff == 0)
        {
            std::memcpy(report + written, MSG_START, sizeof(MSG_START));
            written += sizeof(MSG_START);
        }

        // write message until its end or we fill REPORT_SIZE written bytes
        while (msgoff != msglen && written < REPORT_SIZE)
        {
            char c = msg[msgoff];

            // prevent "DSTART" from being used in message string
            if ((c == 'D' && start == 0) ||
                (c == 'S' && start == 1) ||
                (c == 'T' && start == 2) ||
                (c == 'A' && start == 3) ||
                (c == 'R' && start == 4))
            {
                ++start;
            }
            else if (c == 'T' && start == 4)
            {
                start = end = 0;
                c = 0;
            }

            // prevent "DEND" from being used in message string
            if ((c == 'D' && end == 0) ||
                (c == 'E' && end == 1) ||
                (c == 'N' && end == 2))
            {
                ++end;
            }
            else if (c == 'D' && end == 3)
            {
                start = end = 0;
                c = 0;
            }

            if (c != 0)
                ++msgoff;

            report[written++] = c;
        }

        // check if we need another HID cycle
        if (written == REPORT_SIZE)
        {
            w = hid_write(hid->device, report, REPORT_SIZE);
            if (w != REPORT_SIZE)
            {
                fprintf(stderr, "failed to write HID message: %s\n", std::strerror(errno));
                break;
            }
            // fprintf(stderr, "wrote HID message1: %s\n", (report + 1));
            continue;
        }

        // write end tag if there is enough space
        if (written + sizeof(MSG_END) <= REPORT_SIZE)
        {
            std::memcpy(report + written, MSG_END, sizeof(MSG_END));
            written += sizeof(MSG_END);
            done = true;
        }

        // pad end of message with zeros, so we fill REPORT_SIZE
        if (written != REPORT_SIZE)
        {
            std::memset(report + written, 0, REPORT_SIZE - written);
            written += REPORT_SIZE - written;
        }

        assert(written == REPORT_SIZE);
        w = hid_write(hid->device, report, REPORT_SIZE);
        if (w != REPORT_SIZE)
        {
            fprintf(stderr, "failed to write HID message: %s\n", std::strerror(errno));
            break;
        }
        // fprintf(stderr, "wrote HID message2: %s\n", (report + 1));
    }
}

// --------------------------------------------------------------------------------------------------------------------

static void* _hid_thread(void* const arg)
{
    HID* const hid = static_cast<HID*>(arg);

    uint8_t start = 0;
    uint8_t end = 0;
    std::stringstream ss;
    std::string send;

    while (hid->device != nullptr)
    {
        pthread_mutex_lock(&hid->mutex);
        hid->send.swap(send);
        pthread_mutex_unlock(&hid->mutex);

        if (! send.empty())
        {
            _hid_send(hid, send.c_str());
            send.clear();
        }

        unsigned char buf[REPORT_SIZE] = {};
        int r = hid_read(hid->device, buf, REPORT_SIZE);

        if (r == -1)
        {
            hid->reading.store(false);

            if (errno == EAGAIN)
            {
                d_msleep(10);
                continue;
            }

            _update_hid_error();

            if (hid->device != nullptr)
            {
                hid_close(hid->device);
                hid->device = nullptr;
            }
            break;
        }

        if (r == 0)
        {
            d_msleep(10);
            continue;
        }
        if (r != REPORT_SIZE)
        {
            fprintf(stderr, "Wrong HID report size %d\n", r);
            ss = {};
            hid->reading.store(false);
            continue;
        }
        if (buf[0] != REPORT_ID)
        {
            fprintf(stderr, "Wrong HID report id %u\n", buf[0]);
            ss = {};
            hid->reading.store(false);
            continue;
        }

        hid->reading.store(true);

        // fprintf(stderr, "r %ld, buf: %c%c%c%c%c%c\n", r, buf[1], buf[2], buf[3], buf[4], buf[5], buf[6]);

        for (uint8_t i = 1, b; i < REPORT_SIZE; ++i)
        {
            b = buf[i];

            if (b == 0x00 || b == 0x14)
            {
                end = 0;
                continue;
            }

            // "DSTART" capture
            if ((b == 'D' && start == 0) ||
                (b == 'S' && start == 1) ||
                (b == 'T' && start == 2) ||
                (b == 'A' && start == 3) ||
                (b == 'R' && start == 4))
            {
                ++start;
                continue;
            }
            if (b == 'T' && start == 5)
            {
                ++start;
                ss = {};
                hid->reading.store(false);
                continue;
            }

            // "DEND" capture
            if ((b == 'D' && start == 6 && end == 0) ||
                (b == 'E' && start == 6 && end == 1) ||
                (b == 'N' && start == 6 && end == 2))
            {
                ++end;
                continue;
            }
            if (b == 'D' && start == 6 && end == 3)
            {
                start = end = 0;
                {
                    const std::string msg = ss.str();
                    pthread_mutex_lock(&hid->mutex);
                    hid->recv = msg;
                    pthread_mutex_unlock(&hid->mutex);
                }
                ss = {};
                hid->reading.store(false);
                continue;
            }

            end = 0;
            ss << b;
        }
    }

    return nullptr;
}

// --------------------------------------------------------------------------------------------------------------------
