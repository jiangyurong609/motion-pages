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

The pipeline is a custom Cloud Run **Job** (not Remotion's stock Cloud Run
service — the org enforces uniform bucket-level access, which rejects the
service's per-object ACL writes). One-time setup for a fresh project:

1. Enable APIs: Cloud Build, Artifact Registry, Cloud Run, Cloud Storage
2. Artifact Registry docker repo `remotion` in `us-west1`
3. A GCS output bucket (set `OUT_BUCKET`; default is this project's
   `remotioncloudrun-opnlqyyku0`)
4. The job's runtime service account needs `storage.objectAdmin` on that
   bucket (default compute SA works if granted)

Then:

```bash
./render-cloud.sh   # builds image (clips ship via .gcloudignore), creates or
                    # updates the job, executes it, prints the gs:// path
```

Download with `gsutil cp gs://<bucket>/renders/tutorial.mp4 out/` — the https
URL only works publicly if the bucket grants `allUsers` objectViewer.
