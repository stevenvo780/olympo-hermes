import React from 'react';
import { Form } from 'react-bootstrap';
import { formatNumberWithCommas } from '@/utils/formatters';

/**
 * Number input that keeps the formatted display value (with thousand separators)
 * and optionally emits the raw numeric value for parent consumers.
 */
interface FormattedNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  decimals?: number;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  readOnly?: boolean;
  /** Emits the numeric value so parents are not coupled to the formatted string. */
  onValueChange?: (value: number | null) => void;
}

export default function FormattedNumberInput({
  value,
  onChange,
  decimals = 0,
  placeholder,
  required = false,
  className,
  label,
  readOnly = false,
  onValueChange,
}: FormattedNumberInputProps) {
  const [editValue, setEditValue] = React.useState(value);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
    
    if (decimals === 0) {
      setEditValue(value.replace(/\./g, ''));
    } else {
      const commaIndex = value.lastIndexOf(',');
      if (commaIndex === -1) {
        setEditValue(value.replace(/\./g, ''));
      } else {
        const afterComma = value.slice(commaIndex + 1);
        if (afterComma.length <= decimals && /^\d+$/.test(afterComma)) {
          const intPart = value.slice(0, commaIndex).replace(/\./g, '');
          setEditValue(`${intPart}.${afterComma}`);
        } else {
          setEditValue(value.replace(/\./g, ''));
        }
      }
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    
    const cleanValue = editValue.replace(/[^\d.]/g, '');
    const numericValue = parseFloat(cleanValue);
    
    if (!isNaN(numericValue)) {
      const formattedValue = formatNumberWithCommas(numericValue, decimals);
      onChange(formattedValue);
      if (onValueChange) onValueChange(numericValue);
    } else {
      onChange('');
      if (onValueChange) onValueChange(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    if (decimals === 0) {
      const onlyDigits = rawValue.replace(/\D/g, '');
      setEditValue(onlyDigits);
      return;
    }

    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      setEditValue(rawValue);
    }
  };

  return (
    <Form.Group className={className || "mb-3"}>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        type="text"
        value={isEditing ? editValue : value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        data-raw-value={editValue}
        readOnly={readOnly}
      />
    </Form.Group>
  );
}
