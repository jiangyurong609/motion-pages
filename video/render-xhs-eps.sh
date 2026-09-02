#!/bin/sh
# Render the 小红书「一句 prompt」episodes (run from anywhere).
cd "$(dirname "$0")" || exit 1
npx remotion render Xhs-volera out/xhs-ep1-volera.mp4 2>&1 | tail -1
npx remotion render Xhs-pura out/xhs-ep2-pura.mp4 2>&1 | tail -1
npx remotion render Xhs-boreal out/xhs-ep3-boreal.mp4 2>&1 | tail -1
ls -la out/xhs-*
