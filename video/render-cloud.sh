#!/bin/bash
# Renders the tutorial on Google Cloud Run (as a Cloud Run Job) and prints
# the GCS output path. Rebuilds the image first so src/ changes are picked up.
#
# Note: this project's GCP org enforces uniform bucket-level access, which
# Remotion's stock Cloud Run service can't write through (it sets legacy
# per-object ACLs). This job path renders with plain `remotion render` inside
# a container and uploads without ACLs instead.
set -euo pipefail
cd "$(dirname "$0")"

PROJECT=video-agent-493605
REGION=us-west1
IMAGE=us-west1-docker.pkg.dev/$PROJECT/remotion/motion-pages-render:v1
JOB=motion-pages-render
BUCKET=remotioncloudrun-opnlqyyku0

echo "==> build + push image"
gcloud builds submit --project $PROJECT --region $REGION --tag $IMAGE .

echo "==> create/update job"
if gcloud run jobs describe $JOB --region $REGION --project $PROJECT >/dev/null 2>&1; then
  gcloud run jobs update $JOB --image $IMAGE --region $REGION --project $PROJECT >/dev/null
else
  gcloud run jobs create $JOB --image $IMAGE --region $REGION --project $PROJECT \
    --memory=4Gi --cpu=2 --task-timeout=1800 --max-retries=0 \
    --set-env-vars OUT_BUCKET=$BUCKET >/dev/null
fi

echo "==> execute"
gcloud run jobs execute $JOB --region $REGION --project $PROJECT --wait

echo "==> output (public only if bucket IAM allows allUsers:objectViewer)"
echo "gs://$BUCKET/renders/tutorial.mp4"
echo "download: gsutil cp gs://$BUCKET/renders/tutorial.mp4 out/tutorial.mp4"
