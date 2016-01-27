#!/usr/bin/env bash

mkdir -p dist
rm -f dist/chrome.zip
zip -r dist/chrome.zip manifest.json css/ icons/ js/ src/