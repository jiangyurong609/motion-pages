import {deploySite, getOrCreateBucket} from '@remotion/cloudrun';
import path from 'path';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: path.join(here, '.env')});

const region = 'us-east1';
const {bucketName} = await getOrCreateBucket({region});
console.log('bucket:', bucketName);

try {
  const {serveUrl} = await deploySite({
    entryPoint: path.join(here, 'src/index.ts'),
    bucketName,
    siteName: 'motion-pages-tutorial',
    options: {
      onBundleProgress: (p) => {
        if (p % 25 === 0) console.log('bundle', p + '%');
      },
      onUploadProgress: (p) =>
        console.log('upload', p.filesUploaded + '/' + p.totalFiles),
    },
  });
  console.log('SERVE URL:', serveUrl);
} catch (err) {
  console.error('name:', err?.name);
  console.error('message:', err?.message);
  console.error('stack:', err?.stack);
  if (err?.errors) {
    for (const e of err.errors) console.error('sub-error:', e?.message ?? e);
  }
  process.exit(1);
}
