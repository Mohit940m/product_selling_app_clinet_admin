import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

const Button = ({ label, onClick, type = 'button', className = '', disabled, icon }: ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#A78BFA] px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#4C1D95] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
};

export default Button;
