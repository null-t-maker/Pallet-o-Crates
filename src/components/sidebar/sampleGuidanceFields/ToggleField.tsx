import type { FC } from "react";
import { MenuSelect } from "../../MenuSelect";

interface ToggleFieldProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  onLabel: string;
  offLabel: string;
  marginTop: number;
}

export const ToggleField: FC<ToggleFieldProps> = ({
  label,
  enabled,
  onChange,
  onLabel,
  offLabel,
  marginTop,
}) => {
  return (
    <div className="field" style={{ marginTop }}>
      <label title={label}>{label}</label>
      <MenuSelect
        value={enabled ? "on" : "off"}
        onChange={(value) => onChange(value === "on")}
        ariaLabel={label}
        options={[
          { value: "on", label: onLabel },
          { value: "off", label: offLabel },
        ]}
      />
    </div>
  );
};
