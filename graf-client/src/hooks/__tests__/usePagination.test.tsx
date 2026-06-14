/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { usePagination } from '../usePagination';

// Mock IntersectionObserver
const observeMock = vi.fn();
const disconnectMock = vi.fn();

const MockIntersectionObserver = vi.fn(function (this: any, callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
  this.observe = observeMock;
  this.disconnect = disconnectMock;
  this.callback = callback;
  this.options = options;
  // Return this explicitly or let new handle it, but to match previous logic where we returned an object:
  return {
    observe: observeMock,
    disconnect: disconnectMock,
    callback,
    options,
  };
});

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

let container: HTMLDivElement;
let root: Root;
let onLoadMoreMock: any;

const TestComponent = ({ hasMore, isLoading }: { hasMore: boolean; isLoading: boolean }) => {
  const { setLastItemRef } = usePagination({
    hasMore,
    isLoading,
    onLoadMore: onLoadMoreMock,
  });

  return <div ref={setLastItemRef} id="target">Target</div>;
};

const renderComponent = async (hasMore = true, isLoading = false) => {
  await act(async () => {
    root.render(<TestComponent hasMore={hasMore} isLoading={isLoading} />);
  });
};

describe('usePagination', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    onLoadMoreMock = vi.fn();
    observeMock.mockClear();
    disconnectMock.mockClear();
    MockIntersectionObserver.mockClear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it('observes the element when hasMore is true and not loading', async () => {
    await renderComponent(true, false);

    expect(MockIntersectionObserver).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalled();
  });

  it('does not observe if hasMore is false', async () => {
    await renderComponent(false, false);
    // Note: The hook logic is: if (!node || !hasMore || isLoading) return;
    // But ref callback is called once with node.
    // If hasMore is false, it disconnects (if exists) and returns.
    // So observe should NOT be called.
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('does not observe if isLoading is true', async () => {
    await renderComponent(true, true);
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('triggers onLoadMore when intersecting', async () => {
    vi.useFakeTimers();
    await renderComponent(true, false);

    // Get the observer instance and callback
    const observerInstance = MockIntersectionObserver.mock.results[0].value;
    const callback = observerInstance.callback;

    // Simulate intersection
    const entries = [{ isIntersecting: true }];
    act(() => {
      callback(entries);
    });

    // Advance timers for the timeout in hook
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onLoadMoreMock).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not trigger onLoadMore if not intersecting', async () => {
    vi.useFakeTimers();
    await renderComponent(true, false);

    const observerInstance = MockIntersectionObserver.mock.results[0].value;
    const callback = observerInstance.callback;

    // Simulate NON-intersection
    const entries = [{ isIntersecting: false }];
    act(() => {
      callback(entries);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onLoadMoreMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('allows reloading after the debounce window resets', async () => {
    vi.useFakeTimers();
    await renderComponent(true, false);

    const observerInstance = MockIntersectionObserver.mock.results[0].value;
    const callback = observerInstance.callback;

    act(() => {
      callback([{ isIntersecting: true }]);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onLoadMoreMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      callback([{ isIntersecting: true }]);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onLoadMoreMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
