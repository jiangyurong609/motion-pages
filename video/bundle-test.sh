#!/bin/bash
cd "$(dirname "$0")"
npx remotion bundle src/index.ts --log=verbose 2>&1 | tail -8
echo "---"
npx remotion cloudrun sites create src/index.ts --site-name=motion-pages-tutorial --region=us-east1 --log=verbose 2>&1 | tail -30
