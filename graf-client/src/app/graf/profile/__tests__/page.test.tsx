/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import EditUserPage from '../page';

// Mock Child Component
vi.mock('@/components/ProfileEditor', () => ({
  default: () => <div data-testid="profile-editor" />
}));

let container: HTMLDivElement;
let root: Root;

describe('EditUserPage', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders ProfileEditor', async () => {
    await act(async () => {
      root.render(<EditUserPage />);
    });
    expect(container.querySelector('[data-testid="profile-editor"]')).toBeTruthy();
  });
});
