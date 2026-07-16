'use client';
// src/components/forms/turnstile.tsx
// Cloudflare Turnstile + phiên chống bot.
//
// VÌ SAO KHÔNG GỬI THẲNG TOKEN Ở MỖI LƯỢT GỌI: token Turnstile chỉ dùng được một
// lần. Một lượt gửi form gồm nhiều lượt gọi API (init/complete cho từng file,
// rồi tạo yêu cầu), nên token phải đổi lấy một phiên có ký HMAC ở /api/session.
// Đổi một lần, dùng cho cả phiên, và khách chỉ xác minh đúng một lần.

import * as React from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TOKEN_TIMEOUT_MS = 25_000;

export interface AntiBotSession {
  ensureSession: () => Promise<void>;
  setToken: (token: string | null) => void;
  reset: () => void;
}

/**
 * Quản lý phiên chống bot. ensureSession() an toàn khi gọi nhiều lần: các lượt
 * gọi song song dùng chung một promise nên chỉ đổi phiên đúng một lần.
 */
export function useAntiBotSession(siteKey: string | undefined): AntiBotSession {
  const tokenRef = React.useRef<string | null>(null);
  const waitersRef = React.useRef<((token: string | null) => void)[]>([]);
  const sessionRef = React.useRef<Promise<void> | null>(null);

  const setToken = React.useCallback((token: string | null) => {
    tokenRef.current = token;
    const waiters = waitersRef.current.splice(0);
    for (const resolve of waiters) resolve(token);
  }, []);

  const waitForToken = React.useCallback((): Promise<string | null> => {
    // Chưa cấu hình Turnstile -> không có gì để chờ.
    if (!siteKey) return Promise.resolve(null);
    if (tokenRef.current) return Promise.resolve(tokenRef.current);

    return new Promise((resolve) => {
      waitersRef.current.push(resolve);
      // Không treo form vô hạn nếu widget không phản hồi.
      setTimeout(() => resolve(tokenRef.current), TOKEN_TIMEOUT_MS);
    });
  }, [siteKey]);

  const ensureSession = React.useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;

    sessionRef.current = (async () => {
      const token = await waitForToken();

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(token ? { turnstileToken: token } : {}),
      });

      if (!res.ok) {
        sessionRef.current = null; // Cho phép thử lại ở lượt sau.
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Không xác minh được phiên. Vui lòng tải lại trang.');
      }
    })();

    return sessionRef.current;
  }, [waitForToken]);

  const reset = React.useCallback(() => {
    sessionRef.current = null;
    tokenRef.current = null;
  }, []);

  return { ensureSession, setToken, reset };
}

interface TurnstileWidgetProps {
  siteKey: string | undefined;
  onToken: (token: string | null) => void;
}

/** Widget Turnstile. Không render gì nếu chưa cấu hình site key (thường là dev). */
export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetIdRef = React.useRef<string | null>(null);
  const onTokenRef = React.useRef(onToken);
  onTokenRef.current = onToken;

  React.useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        language: 'vi',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => {
          onTokenRef.current(null);
          if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
        },
        'error-callback': () => onTokenRef.current(null),
      });
    };

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src^="${SCRIPT_URL}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      // Script đang tải do một widget khác — chờ nó sẵn sàng.
      const timer = setInterval(() => {
        if (window.turnstile) {
          clearInterval(timer);
          render();
        }
      }, 120);
      return () => clearInterval(timer);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="min-h-[65px]" aria-label="Xác minh chống bot" />;
}
