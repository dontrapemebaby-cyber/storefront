'use client';
// src/app/global-error.tsx
// Lỗi xảy ra ngay trong root layout — ví dụ CSDL sập nên không đọc được cấu hình.
//
// File này phải tự dựng <html> và <body> vì layout đã hỏng, và không được dùng
// component nào phụ thuộc theme (theme cũng đến từ chính chỗ đang hỏng). Vì vậy
// style ở đây viết thẳng, không qua Tailwind token.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error('[app] lỗi ở root layout:', error);

  return (
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#101114' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, margin: 0 }}>Website đang gặp sự cố</h1>
          <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.7, color: 'rgba(16,17,20,0.6)' }}>
            Chúng tôi đang khắc phục. Bạn vẫn đặt in được bằng cách gọi trực tiếp cho nhà in.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 32,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#0057FF',
              border: 0,
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
