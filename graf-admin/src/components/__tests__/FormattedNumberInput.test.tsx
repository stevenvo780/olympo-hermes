/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FormattedNumberInput from '../FormattedNumberInput';

afterEach(() => cleanup());

describe('FormattedNumberInput', () => {
  it('formats decimal values on blur and emits the numeric value', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();

    render(
      <FormattedNumberInput
        value="1.234,5"
        decimals={2}
        onChange={onChange}
        onValueChange={onValueChange}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    expect(input.value).toBe('1234.5');
    expect(input.getAttribute('data-raw-value')).toBe('1234.5');

    fireEvent.change(input, { target: { value: '9876.5' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('9.876,50');
    expect(onValueChange).toHaveBeenCalledWith(9876.5);
  });

  it('strips separators on focus and clears invalid values on blur', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();

    render(<FormattedNumberInput value="1.234" onChange={onChange} onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    expect(input.value).toBe('1234');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('');
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it('removes dots when decimals are enabled without a comma', () => {
    const onChange = vi.fn();

    render(
      <FormattedNumberInput value="1.234" decimals={2} onChange={onChange} />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);

    expect(input.value).toBe('1234');
  });

  it('normalizes invalid decimal input on focus', () => {
    const onChange = vi.fn();

    render(
      <FormattedNumberInput value="1.234,567" decimals={2} onChange={onChange} />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.focus(input);

    expect(input.value).toBe('1234,567');
  });

  it('renders a label when provided', () => {
    const onChange = vi.fn();

    render(
      <FormattedNumberInput
        value="100"
        onChange={onChange}
        label="Precio"
      />
    );

    expect(screen.getByText('Precio')).toBeTruthy();
  });
});
