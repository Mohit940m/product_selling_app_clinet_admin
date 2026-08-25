import { useRef, useState, type DragEvent } from 'react';

interface FileDropProps {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

/**
 * The dashed product-image drop zone (Kartly Commerce Kit.dc.html line
 * ~793). Supports click-to-browse, drag-over highlight, and multi-file.
 * Staging/removing files is the caller's concern (AddProductPage /
 * EditProductPage own the file list) — this just reports selections.
 */
const FileDrop = ({ onFiles, multiple = true, accept = 'image/*', label = 'Drop product images here', disabled = false }: FileDropProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={[
        'cursor-pointer rounded-tile border border-dashed p-6.5 text-center text-[12px] font-bold t-base',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        disabled ? 'cursor-not-allowed border-line text-muted opacity-60' : '',
        isDragOver ? 'border-accent bg-soft2 text-accent' : 'border-edge text-muted hover:border-accent hover:bg-soft2 hover:text-accent',
      ].join(' ')}
    >
      {label}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default FileDrop;
