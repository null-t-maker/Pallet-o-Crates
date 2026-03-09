import type { FC } from "react";
import { MenuSelect } from "../../MenuSelect";
import type { SampleGuidanceFilter } from "../../../lib/packer";

interface FilterFieldProps {
  label: string;
  value: SampleGuidanceFilter;
  onChange: (value: SampleGuidanceFilter) => void;
  allLabel: string;
  dimsLabel: string;
  shapeLabel: string;
  exactLabel: string;
  disabled: boolean;
}

function isSampleGuidanceFilter(value: string): value is SampleGuidanceFilter {
  return value === "all"
    || value === "dims"
    || value === "shape"
    || value === "exact";
}

export const FilterField: FC<FilterFieldProps> = ({
  label,
  value,
  onChange,
  allLabel,
  dimsLabel,
  shapeLabel,
  exactLabel,
  disabled,
}) => {
  return (
    <div className="field" style={{ marginTop: 8 }}>
      <label title={label}>{label}</label>
      <MenuSelect
        value={value}
        onChange={(nextValue) => {
          if (isSampleGuidanceFilter(nextValue)) {
            onChange(nextValue);
          }
        }}
        ariaLabel={label}
        disabled={disabled}
        options={[
          { value: "all", label: allLabel },
          { value: "dims", label: dimsLabel },
          { value: "shape", label: shapeLabel },
          { value: "exact", label: exactLabel },
        ]}
      />
    </div>
  );
};
