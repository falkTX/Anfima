#!/bin/bash

set -eu

cd "$(dirname "${0}")"

sudo cp 50-darkglass-anagram.rules /etc/udev/rules.d/
sudo udevadm control -R

echo "udev files for Anagram are now in place!"
echo "note: it might need to be reconnected"
echo
echo "press any key to continue"

read
