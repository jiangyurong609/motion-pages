#!/bin/bash
cd "$(dirname "$0")"
exec npx remotion cloudrun render \
  "https://storage.googleapis.com/remotioncloudrun-opnlqyyku0/sites/motion-pages-tutorial/index.html" \
  Tutorial --region=us-east1 "$@"
