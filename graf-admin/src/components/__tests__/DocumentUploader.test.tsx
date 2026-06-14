/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const reduxMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
}));

vi.mock('react-redux', () => ({
  useDispatch: () => reduxMocks.dispatch,
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

  const ListGroup = Object.assign(
    ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
    {
      Item: ({
        children,
        ...props
      }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
        <div {...props}>{children}</div>
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

  const Badge = ({
    children,
    ...props
  }: React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>>) => (
    <span {...props}>{children}</span>
  );

  return { Form, Button, ListGroup, Badge };
});

const loadDocumentUploader = async () => {
  const mod = await import('../DocumentUploader');
  return mod.default;
};

afterEach(() => {
  cleanup();
  reduxMocks.dispatch.mockClear();
});

describe('DocumentUploader', () => {
  it('adds valid files and renders them in the list', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const { container } = render(
      <DocumentUploader onDocumentsChange={onDocumentsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onDocumentsChange).toHaveBeenCalledWith([file]);
    }, { timeout: 500 });

    expect(screen.getByText(/Archivos por subir/i)).toBeTruthy();
    expect(screen.getByText('report.pdf')).toBeTruthy();
  });

  it('dispatches a warning for invalid file types', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const { container } = render(
      <DocumentUploader onDocumentsChange={onDocumentsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'malicious.exe', { type: 'application/octet-stream' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(reduxMocks.dispatch).toHaveBeenCalled();

    const dispatched = reduxMocks.dispatch.mock.calls[0]?.[0];
    expect(dispatched?.type).toBe('ui/addNotification');
    expect(onDocumentsChange).not.toHaveBeenCalled();
  });

  it('ignores empty file selections', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const { container } = render(
      <DocumentUploader onDocumentsChange={onDocumentsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: null } });

    expect(onDocumentsChange).not.toHaveBeenCalled();
    expect(reduxMocks.dispatch).not.toHaveBeenCalled();
  });

  it('prevents adding files over the max limit', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const { container } = render(
      <DocumentUploader
        currentDocuments={['https://example.com/test.pdf']}
        maxFiles={1}
        onDocumentsChange={onDocumentsChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeTruthy();
    }, { timeout: 500 });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'second.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(reduxMocks.dispatch).toHaveBeenCalled();

    expect(onDocumentsChange).not.toHaveBeenCalled();
  });

  it('removes saved previews when delete is clicked', async () => {
    const DocumentUploader = await loadDocumentUploader();
    render(
      <DocumentUploader
        currentDocuments={['https://example.com/preview.pdf']}
        onDocumentsChange={vi.fn()}
      />
    );

    expect(screen.getByText('preview.pdf')).toBeTruthy();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(screen.queryByText('preview.pdf')).toBeNull();
  });

  it('dispatches warning for oversized files', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const { container } = render(
      <DocumentUploader onDocumentsChange={onDocumentsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(['content'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(reduxMocks.dispatch).toHaveBeenCalled();
    expect(onDocumentsChange).not.toHaveBeenCalled();
  });

  it('removes selected files when delete is clicked', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const { container } = render(
      <DocumentUploader onDocumentsChange={onDocumentsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onDocumentsChange).toHaveBeenCalledWith([file]);
    }, { timeout: 500 });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(onDocumentsChange).toHaveBeenCalledWith([]);
  });

  it('renders entries for multiple file types', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const { container } = render(
      <DocumentUploader onDocumentsChange={onDocumentsChange} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      new File(['content'], 'resume.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      new File(['content'], 'sheet.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      new File(['content'], 'photo.webp', { type: 'image/webp' }),
      new File(['content'], 'mystery.bin', { type: 'application/pdf' }),
    ];

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(onDocumentsChange).toHaveBeenCalledWith(files);
    }, { timeout: 500 });

    expect(screen.getByText('resume.docx')).toBeTruthy();
    expect(screen.getByText('sheet.xlsx')).toBeTruthy();
    expect(screen.getByText('photo.webp')).toBeTruthy();
    expect(screen.getByText('mystery.bin')).toBeTruthy();
  });

  it('renders icons, truncates long names, and handles empty sizes', async () => {
    const onDocumentsChange = vi.fn();
    const DocumentUploader = await loadDocumentUploader();
    const longPreviewName = `${'a'.repeat(45)}.pdf`;
    const longSelectedName = `${'b'.repeat(45)}.doc`;
    const { container } = render(
      <DocumentUploader
        currentDocuments={[
          `https://example.com/${longPreviewName}`,
          'https://example.com/',
        ]}
        maxFiles={10}
        onDocumentsChange={onDocumentsChange}
      />
    );

    const truncatedPreview = `${longPreviewName.substring(0, 40)}...`;
    await waitFor(() => {
      expect(screen.getByText('Documento')).toBeTruthy();
      expect(screen.getByText(truncatedPreview)).toBeTruthy();
    }, { timeout: 500 });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      new File([], longSelectedName, { type: 'application/msword' }),
      new File(['content'], 'sheet.xls', { type: 'application/vnd.ms-excel' }),
      new File(['content'], 'photo.jpg', { type: 'image/jpeg' }),
      new File(['content'], 'photo.jpeg', { type: 'image/jpeg' }),
      new File(['content'], 'photo.png', { type: 'image/png' }),
    ];

    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(onDocumentsChange).toHaveBeenCalledWith(files);
    }, { timeout: 500 });

    const truncatedSelected = `${longSelectedName.substring(0, 40)}...`;
    expect(screen.getByText(truncatedSelected)).toBeTruthy();
    expect(screen.getByText('0 Bytes')).toBeTruthy();
    expect(screen.getByText('📊')).toBeTruthy();
    expect(screen.getByText('📝')).toBeTruthy();
    expect(screen.getAllByText('🖼️').length).toBeGreaterThan(0);
  });
});
