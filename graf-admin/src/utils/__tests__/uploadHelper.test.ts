import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadImage } from '../uploadHelper';

const mocks = vi.hoisted(() => {
  const put = vi.fn().mockResolvedValue(undefined);
  const getDownloadURL = vi.fn().mockResolvedValue('https://cdn/test-url');
  const child = vi.fn(() => ({ put, getDownloadURL }));
  const ref = vi.fn(() => ({ child }));
  return { put, getDownloadURL, child, ref };
});

vi.mock('../firebase', () => ({
  storage: { ref: mocks.ref },
}));

describe('uploadHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.put.mockResolvedValue(undefined);
    mocks.getDownloadURL.mockResolvedValue('https://cdn/test-url');
    mocks.child.mockImplementation(() => ({
      put: mocks.put,
      getDownloadURL: mocks.getDownloadURL,
    }));
    mocks.ref.mockImplementation(() => ({ child: mocks.child }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads an image and returns the download url', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const file = { name: 'photo.png' } as File;
    const url = await uploadImage(file, 'products');

    expect(mocks.ref).toHaveBeenCalledTimes(1);
    expect(mocks.child).toHaveBeenCalledWith('products/1700000000000-photo.png');
    expect(mocks.put).toHaveBeenCalledWith(file);
    expect(mocks.getDownloadURL).toHaveBeenCalledTimes(1);
    expect(url).toBe('https://cdn/test-url');
  });

  it('logs and rethrows errors', async () => {
    const error = new Error('upload failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.put.mockRejectedValueOnce(error);

    const file = { name: 'photo.png' } as File;

    await expect(uploadImage(file, 'products')).rejects.toThrow(error);
    expect(consoleSpy).toHaveBeenCalledWith('Error uploading image:', error);
    expect(mocks.getDownloadURL).not.toHaveBeenCalled();
  });
});
