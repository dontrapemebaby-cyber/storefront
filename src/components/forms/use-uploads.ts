'use client';
// src/components/forms/use-uploads.ts
// Quản lý vòng đời upload phía trình duyệt.
//
// Luồng cho mỗi file:
//   1. POST /api/uploads/init để lấy uploadId + signedUrl
//   2. PUT trực tiếp file lên Supabase Storage
//   3. POST /api/uploads/complete để dashboard xác minh file

import * as React from 'react';

import { resolveMime, MAX_FILES, type AllowedMime } from '@/lib/constants';
import { formatBytes } from '@/lib/utils';

export type UploadStatus =
  | 'queued'
  | 'preparing'
  | 'uploading'
  | 'finalizing'
  | 'done'
  | 'error'
  | 'cancelled';

export interface UploadItem {
  /** ID tạm ở trình duyệt, không phải mã upload của dashboard. */
  localId: string;
  file: File;
  mimeType: AllowedMime;
  /** Mã UPL do dashboard cấp sau bước init. */
  uploadId: string | null;
  status: UploadStatus;
  progress: number;
  error: string | null;
  previewUrl: string | null;
}

interface UseUploadsOptions {
  maxBytes: number;
  maxFiles?: number;
  /** Tạo phiên chống bot trước khi gọi API upload. */
  ensureSession: () => Promise<void>;
}

interface ApiError {
  error?: string;
}

const API_TIMEOUT_MS = 30_000;
const STORAGE_TIMEOUT_MS = 90_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = API_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Kết nối máy chủ quá lâu. Vui lòng thử lại.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

export function useUploads({ maxBytes, maxFiles = MAX_FILES, ensureSession }: UseUploadsOptions) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const itemsRef = React.useRef<UploadItem[]>([]);
  const xhrRefs = React.useRef(new Map<string, XMLHttpRequest>());
  const previewRefs = React.useRef(new Set<string>());
  const runningRefs = React.useRef(new Set<string>());

  const updateItems = React.useCallback(
    (updater: UploadItem[] | ((previous: UploadItem[]) => UploadItem[])) => {
      setItems((previous) => {
        const next = typeof updater === 'function' ? updater(previous) : updater;
        itemsRef.current = next;
        return next;
      });
    },
    [],
  );

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Thu hồi object URL khi rời trang để tránh rò bộ nhớ.
  React.useEffect(() => {
    const urls = previewRefs.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const patch = React.useCallback(
    (localId: string, changes: Partial<UploadItem>) => {
      updateItems((previous) =>
        previous.map((item) => (item.localId === localId ? { ...item, ...changes } : item)),
      );
    },
    [updateItems],
  );

  /** Đẩy một file qua toàn bộ ba bước. */
  const run = React.useCallback(
    async (item: UploadItem) => {
      // Chặn chạy trùng cùng một file khi người dùng bấm thử lại nhiều lần.
      if (runningRefs.current.has(item.localId)) return;
      runningRefs.current.add(item.localId);

      try {
        // Đổi trạng thái ngay lập tức. Trước đây status chỉ đổi sau khi
        // ensureSession hoàn tất nên giao diện có thể đứng ở “Đang chờ”.
        patch(item.localId, {
          status: 'preparing',
          progress: 0,
          error: null,
          uploadId: null,
        });

        await ensureSession();

        // Bước 1: xin signed URL qua backend website.
        const initRes = await fetchWithTimeout('/api/uploads/init', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            filename: item.file.name,
            mimeType: item.mimeType,
            sizeBytes: item.file.size,
          }),
        });

        const initBody = (await initRes.json().catch(() => ({}))) as ApiError & {
          uploadId?: string;
          signedUrl?: string;
        };

        if (!initRes.ok || !initBody.uploadId || !initBody.signedUrl) {
          patch(item.localId, {
            status: 'error',
            progress: 0,
            error: initBody.error ?? 'Không chuẩn bị được lượt tải lên.',
          });
          return;
        }

        const uploadId = initBody.uploadId;
        patch(item.localId, { uploadId, status: 'uploading', progress: 1 });

        // Bước 2: PUT trực tiếp lên Supabase Storage.
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRefs.current.set(item.localId, xhr);

          xhr.open('PUT', initBody.signedUrl, true);
          xhr.timeout = STORAGE_TIMEOUT_MS;
          xhr.setRequestHeader('content-type', item.mimeType);
          xhr.setRequestHeader('cache-control', 'max-age=3600');
          xhr.setRequestHeader('x-upsert', 'false');

          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            // Chừa 5% cuối cho bước xác minh.
            patch(item.localId, {
              progress: Math.max(1, Math.round((event.loaded / event.total) * 95)),
            });
          };

          xhr.onload = () => {
            xhrRefs.current.delete(item.localId);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Kho lưu trữ trả về mã ${xhr.status}.`));
            }
          };

          xhr.onerror = () => {
            xhrRefs.current.delete(item.localId);
            reject(new Error('Mất kết nối khi đang tải file.'));
          };

          xhr.ontimeout = () => {
            xhrRefs.current.delete(item.localId);
            reject(new Error('Tải file quá lâu. Vui lòng kiểm tra mạng và thử lại.'));
          };

          xhr.onabort = () => {
            xhrRefs.current.delete(item.localId);
            reject(new DOMException('Đã hủy', 'AbortError'));
          };

          xhr.send(item.file);
        });

        // Bước 3: dashboard xác minh object đã upload.
        patch(item.localId, { status: 'finalizing', progress: 97 });

        const completeRes = await fetchWithTimeout('/api/uploads/complete', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ uploadId }),
        });

        const completeBody = (await completeRes.json().catch(() => ({}))) as ApiError;
        if (!completeRes.ok) {
          patch(item.localId, {
            status: 'error',
            error: completeBody.error ?? 'File tải lên chưa được xác minh.',
          });
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
          progress: 0,
          error: error instanceof Error ? error.message : 'Tải file thất bại. Vui lòng thử lại.',
        });
      } finally {
        runningRefs.current.delete(item.localId);
      }
    },
    [ensureSession, patch],
  );

  /** Nhận file từ input/kéo thả, lọc rồi tự bắt đầu upload ngay. */
  const addFiles = React.useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const accepted: UploadItem[] = [];
      const rejected: string[] = [];
      const currentItems = itemsRef.current;
      const room = maxFiles - currentItems.length;

      if (room <= 0) {
        return [`Chỉ gửi được tối đa ${maxFiles} file mỗi yêu cầu.`];
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
          rejected.push(
            `${file.name}: nặng ${formatBytes(file.size)}, vượt giới hạn ${formatBytes(maxBytes)}.`,
          );
          continue;
        }

        const duplicated = [...currentItems, ...accepted].some(
          (existing) =>
            existing.file.name === file.name &&
            existing.file.size === file.size &&
            existing.status !== 'error' &&
            existing.status !== 'cancelled',
        );

        if (duplicated) {
          rejected.push(`${file.name}: đã có trong danh sách.`);
          continue;
        }

        const isImage = mimeType === 'image/png' || mimeType === 'image/jpeg';
        const previewUrl = isImage ? URL.createObjectURL(file) : null;
        if (previewUrl) previewRefs.current.add(previewUrl);

        accepted.push({
          localId: `${Date.now()}-${crypto.randomUUID()}`,
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

      if (accepted.length > 0) {
        // QUAN TRỌNG: accepted phải được tạo trước setState. Bản cũ thêm file
        // vào accepted bên trong updater rồi gọi run ngay bên ngoài, nên updater
        // chưa chạy thì accepted vẫn rỗng và file đứng mãi ở “Đang chờ”.
        updateItems((previous) => [...previous, ...accepted]);

        for (const item of accepted) {
          void run(item);
        }
      }

      return rejected;
    },
    [maxBytes, maxFiles, run, updateItems],
  );

  const cancel = React.useCallback((localId: string) => {
    xhrRefs.current.get(localId)?.abort();
  }, []);

  const retry = React.useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((candidate) => candidate.localId === localId);
      if (!item) return;

      void run({
        ...item,
        uploadId: null,
        status: 'queued',
        progress: 0,
        error: null,
      });
    },
    [run],
  );

  const remove = React.useCallback(
    (localId: string) => {
      cancel(localId);
      runningRefs.current.delete(localId);

      updateItems((previous) => {
        const item = previous.find((candidate) => candidate.localId === localId);
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
          previewRefs.current.delete(item.previewUrl);
        }
        return previous.filter((candidate) => candidate.localId !== localId);
      });
    },
    [cancel, updateItems],
  );

  const reset = React.useCallback(() => {
    for (const xhr of xhrRefs.current.values()) xhr.abort();
    xhrRefs.current.clear();
    runningRefs.current.clear();

    for (const item of itemsRef.current) {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
        previewRefs.current.delete(item.previewUrl);
      }
    }

    updateItems([]);
  }, [updateItems]);

  const isUploading = items.some((item) =>
    ['queued', 'preparing', 'uploading', 'finalizing'].includes(item.status),
  );

  const readyUploadIds = items
    .filter((item) => item.status === 'done' && item.uploadId)
    .map((item) => item.uploadId!);

  return {
    items,
    addFiles,
    cancel,
    retry,
    remove,
    reset,
    isUploading,
    readyUploadIds,
  };
}
