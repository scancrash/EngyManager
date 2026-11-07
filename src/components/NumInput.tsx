"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label: string;
}

/** Editable number cell. Keeps what the user is typing ("1.", "0,5") until blur. */
export default function NumInput({ value, onChange, max, label }: Props) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <input
      className="cell-input num"
      inputMode="decimal"
      aria-label={label}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        e.currentTarget.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(String(value));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        let n = parseFloat(raw.replace(",", "."));
        if (!Number.isFinite(n) || n < 0) n = 0;
        if (max !== undefined && n > max) n = max;
        onChange(n);
      }}
    />
  );
}
