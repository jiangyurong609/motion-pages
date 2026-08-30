# motion-pages tutorial video

A ~33s tutorial/teaser rendered with [Remotion](https://remotion.dev). Beat-cut
edit: 4-cut "this is one prompt" hook → brand card → 3-step "paste a prompt into
Claude Code" walkthrough → value chips → CTA. Music: "Voxel Revolution" by
Kevin MacLeod (incompetech.com), CC BY 4.0 — credit it in the post/video
description when publishing.

## Structure

- `src/Tutorial.tsx` — the composition (1920×1080 @ 30fps, 992 frames, cuts on
  the 112 BPM beat grid)
- `public/clips/*.mp4` — real footage of the demo pages (gitignored; regenerate
  with `python3 record-clips.py`)
- `public/audio/voxel-revolution.mp3` — music bed (gitignored; fetch from
  incompetech.com: "Voxel Revolution")
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
