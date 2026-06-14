/* @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import ClientLayout from '../ClientLayout';// Mock dependencies
vi.mock('../Header', () => ({
  default: () => <div className="mock-header">Header</div>
}));
vi.mock('../Footer', () => ({
  default: () => <div className="mock-footer">Footer</div>
}));
vi.mock('@/components/InfoAlert', () => ({
  default: () => <div className="mock-info-alert">InfoAlert</div>
}));
vi.mock('@/utils/theme', () => ({
  applyPalette: vi.fn()
}));
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div className="mock-browser-router">{children}</div>
}));
// Helper to mock imported modules for verification
import { applyPalette } from '@/utils/theme';
import { defaultPalette } from '@/utils/defaultPalette';
describe('ClientLayout', () => {
  let container: HTMLDivElement;
  let root: Root; beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  }); afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  }); it('renders correctly with children', async () => {
    await act(async () => {
      root.render(
        <ClientLayout>
          <div className="mock-child-content">Child Content</div>
        </ClientLayout>
      );
    }); expect(container.querySelector('.mock-browser-router')).toBeTruthy();
    expect(container.querySelector('.mock-header')).toBeTruthy();
    expect(container.querySelector('.mock-footer')).toBeTruthy();
    expect(container.querySelector('.mock-info-alert')).toBeTruthy();
    expect(container.querySelector('.mock-child-content')).toBeTruthy();
    expect(container.textContent).toContain('Child Content');    // Check if palette was applied
    expect(applyPalette).toHaveBeenCalledWith(defaultPalette);
  });
});
