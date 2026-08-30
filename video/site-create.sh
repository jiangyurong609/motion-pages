#!/bin/bash
cd "$(dirname "$0")"
exec npx remotion cloudrun sites create src/index.ts --site-name=motion-pages-tutorial --region=us-east1
