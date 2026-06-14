/* @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PeriodSelector from '../PeriodSelector';

vi.mock('react-bootstrap', () => ({
  ButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ToggleButton: ({
    children,
    ...props
  }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        props.onChange?.({
          ...event,
          currentTarget: { value: props.value },
        } as unknown as any);
      }}
    >
      {children}
    </button>
  ),
  Row: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Col: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-datepicker', () => ({
  default: ({
    onChange,
  }: {
    onChange: (value: [Date | null, Date | null]) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onChange([new Date('2024-02-10'), new Date('2024-02-12')])}>
        pick
      </button>
      <button type="button" onClick={() => onChange([null, null])}>
        clear
      </button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('PeriodSelector', () => {
  it('clears date range when period is not custom', async () => {
    const onChangeDateRange = vi.fn();

    render(
      <PeriodSelector
        period="day"
        onChangePeriod={vi.fn()}
        startDate={null}
        endDate={null}
        onChangeDateRange={onChangeDateRange}
      />
    );

    await waitFor(() => {
      expect(onChangeDateRange).toHaveBeenCalledWith(null, null);
    });
  });

  it('sets default date range when custom and empty', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-01T00:00:00Z'));
    const onChangeDateRange = vi.fn();

    render(
      <PeriodSelector
        period="custom"
        onChangePeriod={vi.fn()}
        startDate={null}
        endDate={null}
        onChangeDateRange={onChangeDateRange}
      />
    );

    expect(onChangeDateRange).toHaveBeenCalledWith('2024-01-02', '2024-02-01');
  });

  it('emits formatted dates when date picker changes', () => {
    const onChangeDateRange = vi.fn();

    render(
      <PeriodSelector
        period="custom"
        onChangePeriod={vi.fn()}
        startDate="2024-02-01"
        endDate="2024-02-05"
        onChangeDateRange={onChangeDateRange}
      />
    );

    fireEvent.click(screen.getByText('pick'));

    expect(onChangeDateRange).toHaveBeenCalledWith('2024-02-10', '2024-02-12');
  });

  it('resets to default range when date picker is cleared', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01T00:00:00Z'));
    const onChangeDateRange = vi.fn();

    render(
      <PeriodSelector
        period="custom"
        onChangePeriod={vi.fn()}
        startDate="2024-02-01"
        endDate="2024-02-05"
        onChangeDateRange={onChangeDateRange}
      />
    );

    fireEvent.click(screen.getByText('clear'));

    expect(onChangeDateRange).toHaveBeenCalledWith('2024-01-31', '2024-03-01');
  });

  it('sets default range when switching to custom period', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-15T00:00:00Z'));
    const onChangePeriod = vi.fn();
    const onChangeDateRange = vi.fn();

    render(
      <PeriodSelector
        period="day"
        onChangePeriod={onChangePeriod}
        startDate={null}
        endDate={null}
        onChangeDateRange={onChangeDateRange}
      />
    );

    fireEvent.click(screen.getByText('Personalizado'));

    expect(onChangePeriod).toHaveBeenCalledWith('custom');
    expect(onChangeDateRange).toHaveBeenCalledWith('2024-03-16', '2024-04-15');
  });
});
