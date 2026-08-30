#!/bin/bash
cd "$(dirname "$0")"
exec npx remotion render Tutorial out/tutorial.mp4 "$@"
