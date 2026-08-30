// Renders the Tutorial composition and uploads to GCS without ACLs
// (works under uniform bucket-level access). Runs inside the Cloud Run Job.
import {spawnSync} from 'child_process';
import {Storage} from '@google-cloud/storage';

const bucket = process.env.OUT_BUCKET ?? 'remotioncloudrun-opnlqyyku0';
const dest = process.env.OUT_PATH ?? 'renders/tutorial.mp4';
const composition = process.env.COMPOSITION ?? 'Tutorial';

const r = spawnSync(
  'npx',
  ['remotion', 'render', composition, '/tmp/out.mp4', '--log=info'],
  {stdio: 'inherit'}
);
if (r.status !== 0) {
  console.error('render failed with code', r.status);
  process.exit(r.status ?? 1);
}

const storage = new Storage();
await storage.bucket(bucket).upload('/tmp/out.mp4', {destination: dest});
console.log(`uploaded gs://${bucket}/${dest}`);
console.log(`object url (needs public bucket IAM or auth): https://storage.googleapis.com/${bucket}/${dest}`);
