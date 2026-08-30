#!/bin/bash
# Deploys the Remotion Cloud Run service + site bundle, then renders in the cloud.
# Requires video/.env with REMOTION_GCP_* credentials (see README).
set -e
cd "$(dirname "$0")"

REGION="${REMOTION_GCP_REGION:-us-east1}"
SITE="motion-pages-tutorial"

echo "==> ensure Cloud Run service"
npx remotion cloudrun services deploy --region="$REGION" || true

echo "==> bundle + upload site"
npx remotion cloudrun sites create src/index.ts --site-name="$SITE" --region="$REGION"

echo "==> render in Cloud Run"
npx remotion cloudrun render "$SITE" Tutorial --region="$REGION" "$@"
