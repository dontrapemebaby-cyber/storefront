import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Màu và bo góc đều trỏ tới CSS variables do /admin/site-settings sinh ra
 * (xem src/lib/theme.ts). Nhờ vậy đổi màu chủ đạo trong trang quản trị là toàn
 * bộ website đổi theo, không cần build lại và không phải sửa từng component.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--sf-primary) / <alpha-value>)',
          fg: 'rgb(var(--sf-primary-fg) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--sf-accent) / <alpha-value>)',
          fg: 'rgb(var(--sf-accent-fg) / <alpha-value>)',
        },
        canvas: 'rgb(var(--sf-bg) / <alpha-value>)',
        ink: 'rgb(var(--sf-fg) / <alpha-value>)',
        // Xám dựng từ màu chữ nên luôn hài hòa với nền admin chọn.
        muted: {
          DEFAULT: 'rgb(var(--sf-fg) / 0.60)',
          soft: 'rgb(var(--sf-fg) / 0.45)',
        },
        surface: {
          DEFAULT: 'rgb(var(--sf-fg) / 0.03)',
          strong: 'rgb(var(--sf-fg) / 0.06)',
        },
        line: {
          DEFAULT: 'rgb(var(--sf-fg) / 0.10)',
          strong: 'rgb(var(--sf-fg) / 0.18)',
        },
        danger: {
          DEFAULT: '#D92D20',
          soft: '#FEF3F2',
        },
        success: {
          DEFAULT: '#067647',
          soft: '#ECFDF3',
        },
        warning: {
          DEFAULT: '#B54708',
          soft: '#FFFAEB',
        },
      },
      fontFamily: {
        heading: ['var(--sf-font-heading)'],
        body: ['var(--sf-font-body)'],
      },
      borderRadius: {
        token: 'var(--sf-radius)',
        'token-lg': 'calc(var(--sf-radius) * 1.6)',
        'token-sm': 'calc(var(--sf-radius) * 0.6)',
      },
      boxShadow: {
        token: 'var(--sf-shadow)',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-up': 'slide-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
