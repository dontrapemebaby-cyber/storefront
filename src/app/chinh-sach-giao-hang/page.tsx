// src/app/chinh-sach-giao-hang/page.tsx
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { ArticlePage, ArticleSection } from '@/components/site/article-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Chính sách giao hàng',
  description: 'Thời gian sản xuất, cách nhận hàng và những gì xảy ra khi hàng bị chậm.',
  alternates: { canonical: '/chinh-sach-giao-hang' },
};

export default async function DeliveryPolicyPage() {
  const { brand } = await getSiteSettings();

  return (
    <ArticlePage
      eyebrow="Chính sách"
      title="Chính sách giao hàng"
      description="Khi nào có hàng, nhận bằng cách nào, và chúng tôi làm gì nếu chậm."
      updatedAt="01/07/2026"
    >
      <ArticleSection title="Thời gian sản xuất">
        <p>
          Thời gian ghi trên mỗi sản phẩm được tính <strong>từ lúc file được duyệt và đã thanh toán</strong>, không phải
          từ lúc bạn gửi yêu cầu. File cần sửa lại thì đồng hồ bắt đầu chạy từ khi nhận được file đúng.
        </p>
        <p>
          Đơn duyệt trước 10 giờ sáng thường trả trong ngày với các sản phẩm đơn giản. Đơn duyệt sau 16 giờ tính sang
          ngày làm việc kế tiếp.
        </p>
        <p>
          Chủ nhật và ngày lễ xưởng nghỉ, không tính vào thời gian sản xuất
          {brand.workingHours ? `. Giờ làm việc: ${brand.workingHours}` : ''}.
        </p>
      </ArticleSection>

      <ArticleSection title="Cách nhận hàng">
        <p>
          <strong>Lấy tại xưởng</strong> — miễn phí{brand.address ? `. Địa chỉ: ${brand.address}` : ''}. Chúng tôi nhắn
          tin khi hàng xong, bạn đọc mã yêu cầu là nhận.
        </p>
        <p>
          <strong>Giao trong nội thành Hà Nội</strong> — phí theo quãng đường, báo trước khi giao. Đơn lớn thường được
          miễn phí giao.
        </p>
        <p>
          <strong>Gửi tỉnh</strong> — qua nhà xe hoặc chuyển phát, phí theo bảng giá của đơn vị vận chuyển. Chúng tôi
          đóng gói và gửi mã vận đơn cho bạn.
        </p>
        <p>
          Hàng cồng kềnh (biển hiệu, standee, backdrop khổ lớn) cần trao đổi riêng về cách vận chuyển và lắp đặt.
        </p>
      </ArticleSection>

      <ArticleSection title="Kiểm hàng khi nhận">
        <p>
          Hãy mở kiểm ngay khi nhận. Có vấn đề về số lượng, chất lượng in hay hư hỏng do vận chuyển thì báo trong vòng
          48 giờ, kèm ảnh chụp — chúng tôi xử lý nhanh và không hỏi khó.
        </p>
        <p>
          Sau 48 giờ, chúng tôi vẫn hỗ trợ nhưng khó xác định lỗi phát sinh ở khâu nào, nên việc xử lý sẽ chậm hơn.
        </p>
      </ArticleSection>

      <ArticleSection title="Nếu chúng tôi giao chậm">
        <p>
          Chậm là chuyện có thể xảy ra: máy hỏng, hết vật tư đúng loại, hoặc đơn giản là chúng tôi nhận quá tải. Khi đó
          chúng tôi gọi báo bạn ngay khi biết, chứ không im lặng để bạn tự phát hiện.
        </p>
        <p>
          Chậm do lỗi của chúng tôi và bạn không dùng được hàng nữa (lỡ sự kiện, lỡ khai trương) thì hoàn toàn bộ tiền,
          kể cả khi hàng đã in xong.
        </p>
        <p>
          Đơn có mốc thời gian cứng — khai trương, hội chợ, sự kiện — thì nói rõ ngay khi đặt. Chúng tôi sẽ nói thẳng là
          có kịp hay không, thay vì nhận rồi để bạn hỏng việc.
        </p>
      </ArticleSection>
    </ArticlePage>
  );
}
