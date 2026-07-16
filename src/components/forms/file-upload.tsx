'use client';
// src/components/forms/file-upload.tsx
// Vùng kéo thả + danh sách file. Mọi thông báo bằng tiếng Việt và nói rõ phải
// làm gì tiếp theo.
import * as React from 'react';
import Image from 'next/image';
import { FileArchive, FileText, FileType, Loader2, RotateCw, Trash2, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { InlineError } from '@/components/ui/states';
import { ACCEPT_ATTRIBUTE, MAX_FILES } from '@/lib/constants';
import { cn, formatBytes } from '@/lib/utils';
import type { UploadItem } from '@/components/forms/use-uploads';

interface FileUploadProps {
  items: UploadItem[];
  maxBytes: number;
  onAdd: (files: FileList | File[]) => string[];
  onCancel: (localId: string) => void;
  onRetry: (localId: string) => void;
  onRemove: (localId: string) => void;
  disabled?: boolean;
}

function FileIcon({ mime }: { mime: string }) {
  if (mime === 'application/pdf') return <FileText className="h-5 w-5 text-danger" aria-hidden />;
  if (mime === 'application/zip') return <FileArchive className="h-5 w-5 text-warning" aria-hidden />;
  if (mime === 'image/svg+xml') return <FileType className="h-5 w-5 text-primary" aria-hidden />;
  return <FileType className="h-5 w-5 text-muted" aria-hidden />;
}

const STATUS_TEXT: Record<UploadItem['status'], string> = {
  queued: 'Đang chờ',
  preparing: 'Đang chuẩn bị',
  uploading: 'Đang tải lên',
  finalizing: 'Đang kiểm tra file',
  done: 'Đã tải lên',
  error: 'Tải lên thất bại',
  cancelled: 'Đã hủy',
};

export function FileUpload({ items, maxBytes, onAdd, onCancel, onRetry, onRemove, disabled }: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [rejections, setRejections] = React.useState<string[]>([]);

  const handleFiles = (files: FileList | File[]) => {
    setRejections(onAdd(files));
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/*
        Vùng kéo thả là <button> chứ không phải <div onClick>: bàn phím Tab tới
        được và Enter/Space mở hộp chọn file như mọi nút khác.
      */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-token-lg border-2 border-dashed px-6 py-9 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          dragging ? 'border-primary bg-primary/[0.05]' : 'border-line-strong hover:border-primary hover:bg-surface',
          disabled && 'cursor-not-allowed opacity-50 hover:border-line-strong hover:bg-transparent',
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-sm font-semibold text-ink">Kéo thả file vào đây, hoặc bấm để chọn</span>
        <span className="text-[13px] text-muted">
          PNG, JPG, PDF, SVG, ZIP — tối đa {formatBytes(maxBytes)} mỗi file, {MAX_FILES} file mỗi yêu cầu
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        aria-label="Chọn file cần in"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          // Xóa value để chọn lại đúng file vừa xóa vẫn kích hoạt onChange.
          e.target.value = '';
        }}
      />

      {rejections.length > 0 && (
        <InlineError>
          <ul className="space-y-1">
            {rejections.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        </InlineError>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => {
            const busy = item.status === 'uploading' || item.status === 'preparing' || item.status === 'finalizing';
            const failed = item.status === 'error' || item.status === 'cancelled';

            return (
              <li
                key={item.localId}
                className={cn(
                  'flex items-center gap-3 rounded-token border p-3',
                  failed ? 'border-danger/30 bg-danger-soft' : 'border-line bg-canvas',
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-token-sm bg-surface-strong">
                  {item.previewUrl ? (
                    <Image
                      src={item.previewUrl}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileIcon mime={item.mimeType} />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13px] font-medium text-ink" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <span className="shrink-0 text-[12px] tabular-nums text-muted">{formatBytes(item.file.size)}</span>
                  </div>

                  {busy && <ProgressBar value={item.progress} label={`Tiến độ tải ${item.file.name}`} />}

                  <p className={cn('flex items-center gap-1.5 text-[12px]', failed ? 'text-danger' : 'text-muted')}>
                    {item.status === 'done' && <Check className="h-3.5 w-3.5 text-success" aria-hidden />}
                    {busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
                    <span>{item.error ?? STATUS_TEXT[item.status]}</span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {item.status === 'uploading' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(item.localId)}
                      aria-label={`Hủy tải ${item.file.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                  {failed && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRetry(item.localId)}
                      aria-label={`Tải lại ${item.file.name}`}
                    >
                      <RotateCw className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(item.localId)}
                    aria-label={`Xóa ${item.file.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted" aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
