import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import { fileTypeFromBuffer } from 'file-type';

const require = createRequire(import.meta.url);
require('reflect-metadata');
const { MediaService } = require('../src/media/media.service.ts');

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const detected = await fileTypeFromBuffer(png);
assert.equal(detected?.mime, 'image/png', 'PNG bytes must be detected by signature');

const puts = [];
const service = new MediaService();
service.clientPromise = Promise.resolve({
  putObject: async (input) => puts.push(input),
  deleteObject: async () => undefined,
});
Object.assign(process.env, {
  OCI_OBJECT_STORAGE_NAMESPACE: 'eval-namespace',
  OCI_OBJECT_STORAGE_BUCKET: 'eval-bucket',
});
const uploaded = await service.uploadContentAsset(
  'photo_album',
  'collection-1',
  'asset-1',
  {
    originalname: 'pixel.png',
    mimetype: 'application/octet-stream',
    size: png.length,
    buffer: png,
  },
);
assert.equal(uploaded.contentType, 'image/png');
assert.equal(puts.length, 2, 'Original and thumbnail must both be stored');
const thumbnail = puts[1].putObjectBody;
const thumbnailType = await fileTypeFromBuffer(thumbnail);
assert.equal(thumbnailType?.mime, 'image/webp', 'Thumbnail must be WebP');
assert.ok(thumbnail.length > 0, 'Thumbnail must contain bytes');
assert.equal(
  puts[1].objectName,
  'photobooks/collection-1/thumbnail/asset-1.webp',
);

console.log('Documents media eval passed: signature detection and WebP thumbnailing work.');
