/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import DefaultFooter from '../Footer';

vi.mock('react-bootstrap', () => {
  const Container = ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  );
  const Row = ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  );
  const Col = ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  );
  const Accordion = Object.assign(
    ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & { defaultActiveKey?: string }>) => (
      <div {...props}>{children}</div>
    ),
    {
      Collapse: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & { eventKey?: string }>) => (
        <div {...props}>{children}</div>
      ),
    }
  );
  const useAccordionButton = (_eventKey: string, onClick?: () => void) => () => onClick?.();

  return { Container, Row, Col, Accordion, useAccordionButton };
});

let container: HTMLDivElement;
let root: Root;
let initialWidth: number;

const renderFooter = async () => {
  await act(async () => {
    root.render(<DefaultFooter />);
  });
  await act(async () => {
    window.dispatchEvent(new Event('resize'));
  });
};

const setWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
};

beforeEach(() => {
  initialWidth = window.innerWidth;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  setWindowWidth(initialWidth);
});

describe('Graf Footer', () => {
  it('renders desktop footer content', async () => {
    setWindowWidth(1024);
    await renderFooter();

    expect(container.textContent).toContain('Cauce');
    expect(container.textContent).toContain('Contacto');
    expect(container.textContent).toContain('Redes Sociales');
    expect(container.textContent).toContain('sales@humanizar.co');
  });

  it('renders mobile accordion toggles when screen is small', async () => {
    setWindowWidth(500);
    await renderFooter();

    const buttons = Array.from(container.querySelectorAll('button'));
    const contactButton = buttons.find((button) => button.textContent?.includes('Contacto'));
    const socialButton = buttons.find((button) => button.textContent?.includes('Redes Sociales'));

    expect(contactButton).toBeTruthy();
    expect(socialButton).toBeTruthy();

    // Click to toggle accordion
    act(() => {
      contactButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Check if the chevron rotated (isOpen is true)
    // We need to re-query or check the style
    const rotateIcon = contactButton?.querySelector('svg');
    expect(rotateIcon?.getAttribute('style')).toContain('rotate(180deg)');
  });
});
