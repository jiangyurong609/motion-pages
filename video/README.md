# motion-pages tutorial video

A ~47s tutorial/teaser rendered with [Remotion](https://remotion.dev): hook →
3-step "copy a prompt into Claude Code" walkthrough → demo montage → CTA.

## Structure

- `src/Tutorial.tsx` — the composition (1920×1080 @ 30fps, 1410 frames)
- `public/clips/*.mp4` — real footage of the demo pages (gitignored; regenerate
  with `python3 record-clips.py`)
- `record-clips.py` — records each demo headlessly with driven mouse/scroll input

## Render locally

```bash
npm install
python3 record-clips.py   # once, to produce public/clips
./render-local.sh         # → out/tutorial.mp4
```

`npm run studio` opens the Remotion studio for live editing.

## Render on Google Cloud Run

One-time setup (already done for project `video-agent-493605`):

1. Service account `remotion-sa` with roles `run.admin`, `storage.admin`,
   `iam.serviceAccountUser`
2. `video/.env` (gitignored) with `REMOTION_GCP_PRIVATE_KEY`,
   `REMOTION_GCP_CLIENT_EMAIL`, `REMOTION_GCP_PROJECT_ID`

Then:

```bash
./render-cloud.sh   # deploys service, bundles site to GCS, renders in Cloud Run
```

The render output lands in the `remotioncloudrun-*` GCS bucket; the CLI prints
the download URL.
