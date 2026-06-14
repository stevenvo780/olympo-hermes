/* @vitest-environment jsdom */
import React from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const reduxMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useDispatch: () => reduxMocks.dispatch,
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="" {...props} />,
}));

vi.mock('react-bootstrap', () => {
  const Form = Object.assign(
    ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLFormElement>>) => (
      <form {...props}>{children}</form>
    ),
    {
      Group: ({
        children,
        ...props
      }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
        <div {...props}>{children}</div>
      ),
      Label: ({
        children,
        ...props
      }: React.PropsWithChildren<React.LabelHTMLAttributes<HTMLLabelElement>>) => (
        <label {...props}>{children}</label>
      ),
      Control: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
      Text: ({
        children,
        ...props
      }: React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>>) => (
        <span {...props}>{children}</span>
      ),
    }
  );

  const Button = ({
    children,
    ...props
  }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button type="button" {...props}>
      {children}
    </button>
  );

  return { Form, Button };
});

const loadImageUploader = async () => {
  const mod = await import('../ImageUploader');
  return mod;
};

const originalFileReader = globalThis.FileReader;
const setMockFileReaderResult = (result: string | ArrayBuffer | null) => {
  class MockFileReader {
    result: string | ArrayBuffer | null = null;
    onloadend: null | (() => void) = null;
    readAsDataURL() {
      this.result = result;
      if (this.onloadend) {
        this.onloadend();
      }
    }
  }

  globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
};

beforeAll(() => {
  setMockFileReaderResult('data:image/png;base64,preview');
});

afterEach(() => {
  cleanup();
  reduxMocks.dispatch.mockClear();
});

describe('ImageUploader helpers', () => {
  it('returns a default when the url is empty', async () => {
    const { getValidImageUrl } = await loadImageUploader();
    expect(getValidImageUrl('')).toBe('/images/no-image.png');
  });

  it('extracts the first valid url from an array', async () => {
    const { extractFirstValidImageUrl } = await loadImageUploader();
    expect(extractFirstValidImageUrl(['', ' /images/photo.png '])).toBe('/images/photo.png');
  });

  it('returns default when no images are provided', async () => {
    const { extractFirstValidImageUrl } = await loadImageUploader();
    expect(extractFirstValidImageUrl(undefined)).toBe('/images/no-image.png');
  });

  it('returns default when array contains no valid images', async () => {
    const { extractFirstValidImageUrl } = await loadImageUploader();
    expect(extractFirstValidImageUrl(['', '   ', null as unknown as string])).toBe('/images/no-image.png');
  });
});

describe('ImageUploader', () => {
  it('adds previews for valid files', async () => {
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader onImagesChange={onImagesChange} onPreviewsChange={onPreviewsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'photo.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImagesChange).toHaveBeenCalledWith([file]);
      expect(onPreviewsChange).toHaveBeenCalledWith(['data:image/png;base64,preview']);
    }, { timeout: 500 });

    expect(screen.getByAltText('Imagen 1')).toBeTruthy();
  });

  it('ignores empty file selections', async () => {
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader onImagesChange={onImagesChange} onPreviewsChange={onPreviewsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    expect(onImagesChange).not.toHaveBeenCalled();
    expect(onPreviewsChange).not.toHaveBeenCalled();
  });

  it('dispatches a warning when a file is too large', async () => {
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader onImagesChange={onImagesChange} onPreviewsChange={onPreviewsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(['content'], 'big.png', { type: 'image/png' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(reduxMocks.dispatch).toHaveBeenCalled();
    }, { timeout: 500 });

    const dispatched = reduxMocks.dispatch.mock.calls[0]?.[0];
    expect(dispatched?.type).toBe('ui/addNotification');
  });

  it('prevents adding files when max images is reached', async () => {
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader
        currentImagesUrls={['/images/existing.png']}
        maxImages={1}
        onImagesChange={onImagesChange}
        onPreviewsChange={onPreviewsChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByAltText('Imagen 1')).toBeTruthy();
    }, { timeout: 500 });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'extra.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(reduxMocks.dispatch).toHaveBeenCalled();
    }, { timeout: 500 });

    expect(onImagesChange).not.toHaveBeenCalled();
  });

  it('adds only remaining slots when max images is exceeded', async () => {
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader
        currentImagesUrls={['/images/existing.png']}
        maxImages={2}
        onImagesChange={onImagesChange}
        onPreviewsChange={onPreviewsChange}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      new File(['content'], 'one.png', { type: 'image/png' }),
      new File(['content'], 'two.png', { type: 'image/png' }),
    ];

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(reduxMocks.dispatch).toHaveBeenCalled();
      expect(onImagesChange).toHaveBeenCalledWith([files[0]]);
      expect(onPreviewsChange).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('uses empty previews when FileReader result is not a string in the capped flow', async () => {
    setMockFileReaderResult(new ArrayBuffer(8));
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader
        maxImages={1}
        onImagesChange={onImagesChange}
        onPreviewsChange={onPreviewsChange}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      new File(['content'], 'one.png', { type: 'image/png' }),
      new File(['content'], 'two.png', { type: 'image/png' }),
    ];

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(onPreviewsChange).toHaveBeenCalledWith(['']);
    }, { timeout: 500 });

    setMockFileReaderResult('data:image/png;base64,preview');
  });

  it('uses empty previews when FileReader result is not a string in the normal flow', async () => {
    setMockFileReaderResult(new ArrayBuffer(8));
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader onImagesChange={onImagesChange} onPreviewsChange={onPreviewsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'only.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onPreviewsChange).toHaveBeenCalledWith(['']);
    }, { timeout: 500 });

    setMockFileReaderResult('data:image/png;base64,preview');
  });

  it('removes newly added files when deleting previews', async () => {
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    const { container } = render(
      <ImageUploader
        currentImagesUrls={['/images/existing.png']}
        onImagesChange={onImagesChange}
        onPreviewsChange={onPreviewsChange}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'new.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onImagesChange).toHaveBeenCalledWith([file]);
    }, { timeout: 500 });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(onImagesChange).toHaveBeenCalledWith([]);
      expect(onPreviewsChange).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('falls back to default image on error', async () => {
    const onImagesChange = vi.fn();
    const onPreviewsChange = vi.fn();
    const { default: ImageUploader } = await loadImageUploader();

    render(
      <ImageUploader
        currentImagesUrls={['/images/broken.png']}
        onImagesChange={onImagesChange}
        onPreviewsChange={onPreviewsChange}
      />
    );

    const image = screen.getByAltText('Imagen 1') as HTMLImageElement;
    fireEvent.error(image);

    expect(image.getAttribute('src')).toBe('/images/no-image.png');
  });
});

afterAll(() => {
  globalThis.FileReader = originalFileReader;
});
