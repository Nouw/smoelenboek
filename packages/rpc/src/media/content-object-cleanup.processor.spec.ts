import { describe, expect, it, jest } from '@jest/globals';

import { ContentObjectCleanupProcessor } from './content-object-cleanup.processor';

describe('ContentObjectCleanupProcessor', () => {
  it('deletes queued objects and completes their cleanup rows', async () => {
    const repository = {
      listPendingCleanup: jest.fn().mockResolvedValue([
        { id: 'cleanup-1', objectName: 'documents/c/original/a.pdf', attempts: 0 },
      ]),
      completeCleanup: jest.fn().mockResolvedValue(undefined),
      markCleanupFailed: jest.fn(),
    };
    const media = { deleteObjectByName: jest.fn().mockResolvedValue(undefined) };
    const processor = new ContentObjectCleanupProcessor(
      repository as never,
      media as never,
    );

    await processor.drain();

    expect(media.deleteObjectByName).toHaveBeenCalledWith(
      'documents/c/original/a.pdf',
    );
    expect(repository.completeCleanup).toHaveBeenCalledWith('cleanup-1');
  });

  it('persists failures with a future retry time', async () => {
    const repository = {
      listPendingCleanup: jest.fn().mockResolvedValue([
        { id: 'cleanup-1', objectName: 'photobooks/c/original/a.jpg', attempts: 1 },
      ]),
      completeCleanup: jest.fn(),
      markCleanupFailed: jest.fn().mockResolvedValue(undefined),
    };
    const media = {
      deleteObjectByName: jest.fn().mockRejectedValue(new Error('OCI unavailable')),
    };
    const processor = new ContentObjectCleanupProcessor(
      repository as never,
      media as never,
    );

    await processor.drain();

    expect(repository.markCleanupFailed).toHaveBeenCalledWith(
      'cleanup-1',
      'OCI unavailable',
      expect.any(Date),
    );
  });
});
