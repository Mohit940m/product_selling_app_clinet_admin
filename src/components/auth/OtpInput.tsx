import { useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

/** Six separate digit boxes with auto-advance, paste, and backspace-to-previous. */
const OtpInput = ({ length = 6, value, onChange, disabled = false }: OtpInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(''));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted.padEnd(digits.length, '').slice(0, length));
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2" role="group" aria-label="One-time passcode">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1}`}
          className={`h-14 w-12 rounded-ctl border text-center text-xl font-extrabold text-ink t-fast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            digit ? 'border-accent' : 'border-line'
          }`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
