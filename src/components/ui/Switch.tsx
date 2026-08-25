interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

/** The dark-mode toggle track/knob from the Kartly profile screen. */
const Switch = ({ checked, onChange, label, disabled = false }: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`flex h-[27px] w-12 items-center rounded-full p-[3px] t-base ${
        checked ? 'justify-end bg-accent' : 'justify-start bg-line'
      } disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <span className="h-[21px] w-[21px] rounded-full bg-card t-base" />
    </button>
  );
};

export default Switch;
