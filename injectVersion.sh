#!/bin/bash
APP_VERSION=$(grep -oP '"version": "\K[^"]+' package.json) && sed -i "s/__APP_VERSION__/$APP_VERSION/g" frontend/dist/*.js

