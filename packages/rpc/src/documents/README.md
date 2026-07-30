# Documents service

The documents service owns season-scoped photo albums and document libraries.
Authenticated members can read collection metadata and stream active assets.
Only Better Auth users with role `admin` can mutate collections or upload files.

## Boundaries

- Collection and asset metadata is exposed through the `documents` tRPC router.
- Multipart uploads use `POST /media/collections/:collectionId/assets`.
- Active originals and thumbnails are streamed through `/media/assets/:assetId/*`.
- OCI object names are internal. The generic object route rejects `photobooks/`
  and `documents/` keys so deleted metadata takes effect immediately.
- Metadata changes are written to `stored_events` and projected transactionally.
- Permanent deletes enqueue OCI keys in `content_object_cleanup`. The media
  processor retries failed deletions with exponential backoff.

## Upload policy

Photo albums accept signature-verified JPEG, PNG, WebP, and GIF files up to
15 MiB. Document libraries accept those images plus PDF and Word, Excel, and
PowerPoint formats up to 25 MiB. Image originals are retained and a
metadata-free WebP preview of at most 480×480 is generated with Sharp.

## Operations

Run the database migration before restarting the RPC service:

```sh
pnpm --filter @repo/rpc migration:run
```

The standalone legacy importer is delivered outside the repository at
`/tmp/smoelenboek-documents-import/README.md`. It snapshots first and requires
an explicit `--execute` flag before copying legacy OCI objects.
