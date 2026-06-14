/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { uploadImage } from '../uploadHelper';

const mockPut = vi.fn().mockResolvedValue({});
const mockGetDownloadURL = vi.fn().mockResolvedValue('http://mock-url.com');
const mockChild = vi.fn().mockReturnValue({
  put: mockPut,
  getDownloadURL: mockGetDownloadURL
});
vi.mock('../firebase', () => ({
  storage: {
    ref: () => ({
      child: mockChild
    })
  }
}));

// Also we need to mock storage.ref(). which calls ref function.
// The code says: const storageRef = storage.ref();
// So storage object must have ref method.
// My mock above: storage: { ref: () => ... } works.

describe('uploadHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads image successfully and returns url', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const path = 'images';

    const url = await uploadImage(file, path);

    expect(url).toBe('http://mock-url.com');
    expect(mockChild).toHaveBeenCalled(); // Should be called with path
    expect(mockPut).toHaveBeenCalledWith(file);
    expect(mockGetDownloadURL).toHaveBeenCalled();
  });

  it('throws error on failure', async () => {
    mockPut.mockRejectedValue(new Error('fail'));
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });

    await expect(uploadImage(file, 'path')).rejects.toThrow('Error uploading file');
  });
});
