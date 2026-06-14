/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';

vi.mock('react-bootstrap', () => {
  const MockComponent = ({ children, show }: { children?: React.ReactNode; show?: boolean }) => (
    show !== false ? <div>{children}</div> : null
  );
  return {
    Modal: Object.assign(MockComponent, {
      Header: MockComponent,
      Title: MockComponent,
      Body: MockComponent,
      Footer: MockComponent,
    }),
    Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
      <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
    Form: Object.assign(
      ({ children, onSubmit }: { children: React.ReactNode; onSubmit?: (e: React.FormEvent) => void }) => (
        <form onSubmit={onSubmit}>{children}</form>
      ),
      {
        Group: MockComponent,
        Label: MockComponent,
        Control: ({ onChange, value, type }: { onChange?: (e: any) => void; value?: string; type?: string }) => (
          <input type={type || 'text'} value={value} onChange={onChange} />
        ),
        Select: ({ children, onChange, value }: { children?: React.ReactNode; onChange?: (e: any) => void; value?: string }) => (
          <select value={value} onChange={onChange}>{children}</select>
        ),
      }
    ),
    Spinner: () => <span data-testid="spinner">Loading</span>,
  };
});

vi.mock('@/types', () => ({ CustomQuestion: {} }));

import CustomQuestions from '../CustomQuestions';

describe('CustomQuestions', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onHide = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders modal when show is true', async () => {
    await act(async () => {
      root.render(
        <CustomQuestions
          show={true}
          onHide={onHide}
          questions={[]}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );
    });
    expect(container.innerHTML).toContain('Información Adicional');
  });

  it('renders questions', async () => {
    const questions = [
      { question: 'What is your name?', type: 'text', required: true },
    ];
    await act(async () => {
      root.render(
        <CustomQuestions
          show={true}
          onHide={onHide}
          questions={questions as any}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );
    });
    expect(container.textContent).toContain('What is your name?');
  });

  it('accepts custom title', async () => {
    await act(async () => {
      root.render(
        <CustomQuestions
          show={true}
          onHide={onHide}
          questions={[]}
          onSubmit={onSubmit}
          isSubmitting={false}
          title="Custom Title"
        />
      );
    });
    expect(container.textContent).toContain('Custom Title');
  });

  it('shows spinner when submitting', async () => {
    await act(async () => {
      root.render(
        <CustomQuestions
          show={true}
          onHide={onHide}
          questions={[]}
          onSubmit={onSubmit}
          isSubmitting={true}
        />
      );
    });
    expect(container.querySelector('[data-testid="spinner"]')).toBeTruthy();
  });

  it('calls onHide when cancel clicked', async () => {
    await act(async () => {
      root.render(
        <CustomQuestions
          show={true}
          onHide={onHide}
          questions={[]}
          onSubmit={onSubmit}
          isSubmitting={false}
        />
      );
    });
    const cancelBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Cancelar');
    await act(async () => {
      cancelBtn?.click();
    });
    expect(onHide).toHaveBeenCalled();
  });
});
