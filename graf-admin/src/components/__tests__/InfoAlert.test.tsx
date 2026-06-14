/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import InfoAlert from '../InfoAlert';
import { removeNotification } from '@/redux/ui';

const reduxMocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  state: {
    ui: {
      notifications: [] as { id?: string; color?: string; message: string }[],
    },
  },
}));

vi.mock('react-redux', () => ({
  useSelector: (selector: (state: typeof reduxMocks.state) => unknown) =>
    selector(reduxMocks.state),
  useDispatch: () => reduxMocks.dispatch,
}));

afterEach(() => {
  cleanup();
  reduxMocks.dispatch.mockClear();
  reduxMocks.state.ui.notifications = [];
  vi.useRealTimers();
});

describe('InfoAlert', () => {
  it('renders notifications and dispatches removal on timeout', async () => {
    vi.useFakeTimers();
    reduxMocks.state.ui.notifications = [
      { id: 'note-1', color: 'info', message: 'Test message' },
    ];

    render(<InfoAlert />);

    expect(screen.getByText('Test message')).toBeTruthy();

    await vi.runAllTimersAsync();

    expect(reduxMocks.dispatch).toHaveBeenCalledWith(removeNotification('note-1'));
  });

  it('falls back to defaults when id or color is missing', async () => {
    vi.useFakeTimers();
    reduxMocks.state.ui.notifications = [
      { message: 'Default message' },
    ];

    render(<InfoAlert />);

    expect(screen.getByText('Default message')).toBeTruthy();

    await vi.runAllTimersAsync();

    expect(reduxMocks.dispatch).toHaveBeenCalledWith(removeNotification(''));
  });
});
