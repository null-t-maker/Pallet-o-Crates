export interface MenuSelectOption {
  value: string;
  label: string;
}

export interface MenuSelectProps {
  value: string;
  options: readonly MenuSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}
