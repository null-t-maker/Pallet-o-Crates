import type { FC } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

export const NumberField: FC<NumberFieldProps> = ({
  label,
  value,
  disabled,
  onChange,
}) => {
  return (
    <div className="field" style={{ marginTop: 8 }}>
      <label title={label}>{label}</label>
      <input
        type="number"
        step={1}
        value={value}
        onChange={(event) => {
          const text = event.target.value.trim();
          if (!text) {
            onChange(0);
            return;
          }
          const raw = Number.parseInt(text, 10);
          if (!Number.isFinite(raw)) return;
          onChange(Math.trunc(raw));
        }}
        disabled={disabled}
      />
    </div>
  );
};
