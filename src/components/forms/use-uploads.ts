'use client';
// src/components/forms/use-uploads.ts
// Quản lý vòng đời upload phía trình duyệt.
//
// Luồng cho MỖI file (đúng theo kiến trúc bắt buộc):
//   1. Trình duyệt gửi metadata -> POST /api/uploads/init (backend website)
//   2. Backend website gọi dashboard /api/public/uploads/init kèm API key
//   3. Dashboard trả signed upload URL
//   4. Trình duyệt PUT thẳng file vào Supabase private Storage (không qua server
//      website — file lớn không đi vòng, và server không phải làm proxy)
//   5. Trình duyệt báo backend -> POST /api/uploads/complete
//   6. Backend website gọi dashboard /api/public/uploads/complete
//   7. Dashboard tự kiểm object có thật, đúng dung lượng, đúng loại file
//
// Trình duyệt không bao giờ thấy DASHBOARD_API_KEY: nó chỉ nhận về signedUrl,
// vốn là URL dùng một lần cho đúng một đường dẫn.

import * as React from 'react';
import { resolveMime, MAX_FILES, type AllowedMime } from '@/lib/constants';
import { formatBytes } from '@/lib/utils';

export type UploadStatus = 'queued' | 'preparing' | 'uploading' | 'finalizing' | 'done' | 'error' | 'cancelled';

export interface UploadItem {
  /** Id nội bộ ở trình duyệt, không phải mã của dashboard. */
  localId: string;
  file: File;
  mimeType: AllowedMime;
  /** Mã UPL do dashboard cấp, có sau khi init xong. */
  uploadId: string | null;
  status: UploadStatus;
  progress: number;
  error: string | null;
  /** Ảnh xem trước, chỉ tạo cho PNG/JPG. */
  previewUrl: string | null;
}

interface UseUploadsOptions {
  maxBytes: number;
  maxFiles?: number;
  /** Gọi trước lượt upload đầu tiên để chắc chắn đã có phiên chống bot. */
  ensureSession: () => Promise<void>;
}

interface ApiError {
  error?: string;
}

export function useUploads({ maxBytes, maxFiles = MAX_FILES, ensureSession }: UseUploadsOptions) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const xhrRefs = React.useRef(new Map<string, XMLHttpRequest>());
  const previewRefs = React.useRef(new Set<string>());

  // Thu hồi object URL khi rời trang để không rò bộ nhớ.
  React.useEffect(() => {
    const urls = previewRefs.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const patch = React.useCallback((localId: string, changes: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.localId === localId ? { ...item, ...changes } : item)));
  }, []);

  /** Đẩy một file qua toàn bộ ba bước. Lỗi ở bước nào cũng hiện ngay tại file đó. */
  const run = React.useCallback(
    async (item: UploadItem) => {
      try {
        await ensureSession();

        // --- Bước 1: xin signed URL qua backend website -----------------------
        patch(item.localId, { status: 'preparing', progress: 0, error: null });

        const initRes = await fetch('/api/uploads/init', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            filename: item.file.name,
            mimeType: item.mimeType,
            sizeBytes: item.file.size,
          }),
        });

        const initBody = (await initRes.json()) as ApiError & { uploadId?: string; signedUrl?: string };
        if (!initRes.ok || !initBody.uploadId || !initBody.signedUrl) {
          patch(item.localId, { status: 'error', error: initBody.error ?? 'Không chuẩn bị được lượt tải lên.' });
          return;
        }

        const uploadId = initBody.uploadId;
        patch(item.localId, { uploadId, status: 'uploading', progress: 0 });

        // --- Bước 2: PUT thẳng vào Supabase Storage ---------------------------
        // Gửi thân nhị phân kèm content-type đúng như đã khai báo ở bước init.
        // Dashboard sẽ đối chiếu content-type Storage ghi nhận với khai báo, nên
        // hai giá trị phải trùng khớp, nếu không file bị đánh 'failed'.
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRefs.current.set(item.localId, xhr);

          xhr.open('PUT', initBody.signedUrl!, true);
          xhr.setRequestHeader('content-type', item.mimeType);
          xhr.setRequestHeader('cache-control', 'max-age=3600');
          xhr.setRequestHeader('x-upsert', 'false');

          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            // Chừa 5% cuối cho bước xác minh, để thanh không đứng ở 100% mà chưa xong.
            patch(item.localId, { progress: Math.round((event.loaded / event.total) * 95) });
          };

          xhr.onload = () => {
            xhrRefs.current.delete(item.localId);
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Storage trả về mã ${xhr.status}.`));
          };
          xhr.onerror = () => {
            xhrRefs.current.delete(item.localId);
            reject(new Error('Mất kết nối khi đang tải file.'));
          };
          xhr.onabort = () => {
            xhrRefs.current.delete(item.localId);
            reject(new DOMException('Đã hủy', 'AbortError'));
          };

          xhr.send(item.file);
        });

        // --- Bước 3: báo hoàn tất để dashboard xác minh -----------------------
        patch(item.localId, { status: 'finalizing', progress: 97 });

        const completeRes = await fetch('/api/uploads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ uploadId }),
        });

        const completeBody = (await completeRes.json()) as ApiError;
        if (!completeRes.ok) {
          patch(item.localId, { status: 'error', error: completeBody.error ?? 'File tải lên chưa được xác minh.' });
          return;
        }

        patch(item.localId, { status: 'done', progress: 100, error: null });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          patch(item.localId, { status: 'cancelled', progress: 0, error: null });
          return;
        }
        patch(item.localId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Tải file thất bại. Vui lòng thử lại.',
        });
      }
    },
    [ensureSession, patch],
  );

  /** Nhận file từ input hoặc kéo thả. Lọc trước, báo lỗi rõ ràng, rồi mới tải. */
  const addFiles = React.useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const accepted: UploadItem[] = [];
      const rejected: string[] = [];

      setItems((prev) => {
        const room = maxFiles - prev.length;
        if (room <= 0) {
          rejected.push(`Chỉ gửi được tối đa ${maxFiles} file mỗi yêu cầu.`);
          return prev;
        }

        for (const file of incoming.slice(0, room)) {
          const mimeType = resolveMime(file.type, file.name);

          if (!mimeType) {
            rejected.push(`${file.name}: định dạng không hỗ trợ. Chỉ nhận PNG, JPG, PDF, SVG, ZIP.`);
            continue;
          }
          if (file.size === 0) {
            rejected.push(`${file.name}: file rỗng.`);
            continue;
          }
          if (file.size > maxBytes) {
            rejected.push(`${file.name}: nặng ${formatBytes(file.size)}, vượt giới hạn ${formatBytes(maxBytes)}.`);
            continue;
          }
          if (prev.some((p) => p.file.name === file.name && p.file.size === file.size && p.status !== 'error')) {
            rejected.push(`${file.name}: đã có trong danh sách.`);
            continue;
          }

          const isImage = mimeType === 'image/png' || mimeType === 'image/jpeg';
          const previewUrl = isImage ? URL.createObjectURL(file) : null;
          if (previewUrl) previewRefs.current.add(previewUrl);

          accepted.push({
            localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            mimeType,
            uploadId: null,
            status: 'queued',
            progress: 0,
            error: null,
            previewUrl,
          });
        }

        if (incoming.length > room) {
          rejected.push(`Chỉ nhận thêm được ${room} file (tối đa ${maxFiles} file).`);
        }

        return [...prev, ...accepted];
      });

      for (const item of accepted) void run(item);
      return rejected;
    },
    [maxBytes, maxFiles, run],
  );

  const cancel = React.useCallback((localId: string) => {
    xhrRefs.current.get(localId)?.abort();
  }, []);

  const retry = React.useCallback(
    (localId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.localId === localId);
        if (item) void run(item);
        return prev;
      });
    },
    [run],
  );

  const remove = React.useCallback(
    (localId: string) => {
      cancel(localId);
      setItems((prev) => {
        const item = prev.find((i) => i.localId === localId);
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
          previewRefs.current.delete(item.previewUrl);
        }
        return prev.filter((i) => i.localId !== localId);
      });
    },
    [cancel],
  );

  const reset = React.useCallback(() => {
    for (const xhr of xhrRefs.current.values()) xhr.abort();
    xhrRefs.current.clear();
    setItems([]);
  }, []);

  const isUploading = items.some((i) => i.status === 'preparing' || i.status === 'uploading' || i.status === 'finalizing');
  const readyUploadIds = items.filter((i) => i.status === 'done' && i.uploadId).map((i) => i.uploadId!);

  return { items, addFiles, cancel, retry, remove, reset, isUploading, readyUploadIds };
}
