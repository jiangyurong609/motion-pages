#!/bin/bash
# Renders the tutorial on Google Cloud Run (as a Cloud Run Job) and prints
# the GCS output URL. Rebuilds the image first so src/ changes are picked up.
#
# Note: this project's GCP org enforces uniform bucket-level access, which
# Remotion's stock Cloud Run service can't write through (it sets legacy
# per-object ACLs). This job path renders with plain `remotion render` inside
# a container and uploads without ACLs instead.
set -e
cd "$(dirname "$0")"

PROJECT=video-agent-493605
REGION=us-west1
IMAGE=us-west1-docker.pkg.dev/$PROJECT/remotion/motion-pages-render:v1
JOB=motion-pages-render

echo "==> build + push image"
gcloud builds submit --project $PROJECT --region $REGION --tag $IMAGE . | tail -2

echo "==> update job"
gcloud run jobs update $JOB --image $IMAGE --region $REGION --project $PROJECT >/dev/null

echo "==> execute"
gcloud run jobs execute $JOB --region $REGION --project $PROJECT --wait

echo "==> output"
echo "https://storage.googleapis.com/remotioncloudrun-opnlqyyku0/renders/tutorial.mp4"
