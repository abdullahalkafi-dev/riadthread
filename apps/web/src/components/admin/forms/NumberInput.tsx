'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { Input } from '../Field';

interface NumberInputProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/**
 * A whole-number field that lets the user clear it while typing. The number is
 * reported as soon as the text is a valid one, and tidied up when focus leaves.
 */
export function NumberInput({ value, onChange, min = 0, max, onBlur, ...props }: NumberInputProps) {
  const [text, setText] = useState(String(value));

  // Follow outside changes (a reset, a saved value) without fighting the user's typing.
  useEffect(() => {
    setText((current) => (Number(current) === value && current !== '' ? current : String(value)));
  }, [value]);

  return (
    <Input
      {...props}
      type="number"
      inputMode="numeric"
      min={min}
      {...(max !== undefined ? { max } : {})}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value !== '' && Number.isFinite(n)) onChange(Math.round(n));
      }}
      onBlur={(e) => {
        const n = Number(text);
        const fixed = text === '' || !Number.isFinite(n) ? min : Math.min(max ?? Infinity, Math.max(min, Math.round(n)));
        setText(String(fixed));
        if (fixed !== value) onChange(fixed);
        onBlur?.(e);
      }}
    />
  );
}
