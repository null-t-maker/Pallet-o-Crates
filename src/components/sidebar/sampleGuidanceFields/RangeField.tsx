import type { FC } from "react";

interface RangeFieldProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  displayValue: string;
  disabled: boolean;
}

export const RangeField: FC<RangeFieldProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  displayValue,
  disabled,
}) => {
  return (
    <div className="field" style={{ marginTop: 8 }}>
      <label title={label}>{label}</label>
      <div className="sample-guidance-strength-row">
        <input
          type="range"
          className="sample-guidance-strength-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const raw = Number.parseInt(event.target.value, 10);
            if (!Number.isFinite(raw)) return;
            onChange(raw);
          }}
          disabled={disabled}
        />
        <span className="sample-guidance-strength-value">{displayValue}</span>
      </div>
    </div>
  );
};
