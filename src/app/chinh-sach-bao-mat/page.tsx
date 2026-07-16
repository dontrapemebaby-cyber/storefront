// src/app/chinh-sach-bao-mat/page.tsx
// Chính sách bảo mật. Nội dung phải khớp với những gì hệ thống THỰC SỰ làm —
// xem lib/dashboard/client.ts và migration 0008. Đổi hành vi hệ thống thì phải
// sửa trang này theo.
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { ArticlePage, ArticleSection } from '@/components/site/article-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: 'Chúng tôi thu thập thông tin gì, dùng làm gì, giữ bao lâu và bạn có quyền gì.',
  alternates: { canonical: '/chinh-sach-bao-mat' },
};

export default async function PrivacyPolicyPage() {
  const { brand } = await getSiteSettings();

  return (
    <ArticlePage
      eyebrow="Chính sách"
      title="Chính sách bảo mật"
      description="Viết ngắn và nói thật. Đây là toàn bộ những gì chúng tôi làm với thông tin của bạn."
      updatedAt="01/07/2026"
    >
      <ArticleSection title="Chúng tôi thu thập gì">
        <p>
          <strong>Thông tin bạn tự nhập:</strong> họ tên, số điện thoại, Zalo, email, tên công ty, địa chỉ giao hàng và
          ghi chú. Chỉ họ tên và số điện thoại là bắt buộc.
        </p>
        <p>
          <strong>File bạn tải lên:</strong> file thiết kế và tên file gốc.
        </p>
        <p>
          <strong>Thông tin kỹ thuật:</strong> địa chỉ IP và loại trình duyệt, dùng để chống spam và giới hạn số lượt gửi.
        </p>
        <p>
          Chúng tôi <strong>không</strong> thu thập thông tin thẻ ngân hàng — website không có cổng thanh toán. Chúng tôi
          cũng không cài mã theo dõi quảng cáo của bên thứ ba.
        </p>
      </ArticleSection>

      <ArticleSection title="Dùng để làm gì">
        <p>
          Chỉ để xử lý yêu cầu của bạn: liên hệ báo giá, kiểm file, in, giao hàng, đối soát thanh toán, và hỗ trợ khi
          bạn đặt lại.
        </p>
        <p>
          Chúng tôi <strong>không</strong> bán, không cho thuê, không trao đổi thông tin của bạn với bất kỳ ai. Chúng tôi
          không gửi email quảng cáo nếu bạn không đăng ký.
        </p>
      </ArticleSection>

      <ArticleSection title="Ai xem được">
        <p>
          Nhân viên nhà in phụ trách đơn của bạn. File nằm trong kho lưu trữ riêng, không có đường dẫn công khai — kể cả
          người đoán đúng tên file cũng không mở được.
        </p>
        <p>
          Bên thứ ba duy nhất chạm tới dữ liệu là nhà cung cấp hạ tầng máy chủ và lưu trữ, và họ chỉ lưu chứ không đọc
          nội dung. Khi cần giao hàng, chúng tôi cung cấp tên, số điện thoại và địa chỉ cho đơn vị vận chuyển — chỉ vậy
          thôi.
        </p>
        <p>Chúng tôi chỉ cung cấp thông tin cho cơ quan nhà nước khi có yêu cầu hợp pháp bằng văn bản.</p>
      </ArticleSection>

      <ArticleSection title="Giữ bao lâu">
        <p>
          <strong>Thông tin đơn hàng:</strong> 24 tháng, để tra cứu lịch sử và xử lý bảo hành.
        </p>
        <p>
          <strong>File thiết kế:</strong> 12 tháng kể từ đơn gần nhất, để in lại nhanh khi bạn đặt tiếp. Sau đó xóa.
        </p>
        <p>
          <strong>Nhật ký kỹ thuật (IP):</strong> tối đa 90 ngày.
        </p>
      </ArticleSection>

      <ArticleSection title="Quyền của bạn">
        <p>Bạn có quyền yêu cầu chúng tôi:</p>
        <p>
          <strong>Cho xem</strong> thông tin đang lưu về bạn. <strong>Sửa</strong> thông tin sai.{' '}
          <strong>Xóa</strong> thông tin và file, trừ phần bắt buộc phải giữ theo quy định về kế toán.{' '}
          <strong>Ngừng liên hệ</strong> vì mục đích giới thiệu sản phẩm.
        </p>
        <p>
          Gọi{brand.phone ? ` ${brand.phone}` : ' cho nhà in'}
          {brand.email ? ` hoặc email ${brand.email}` : ''} và đọc số điện thoại đã dùng khi đặt. Chúng tôi xử lý trong 7
          ngày làm việc.
        </p>
      </ArticleSection>

      <ArticleSection title="Cookie">
        <p>
          Website dùng đúng một cookie kỹ thuật, để ghi nhớ rằng phiên của bạn đã qua bước kiểm tra chống bot. Cookie này
          hết hạn sau 1 giờ, không chứa thông tin cá nhân và không dùng để theo dõi bạn qua các website khác.
        </p>
        <p>Không có cookie quảng cáo, không có pixel theo dõi.</p>
      </ArticleSection>
    </ArticlePage>
  );
}
