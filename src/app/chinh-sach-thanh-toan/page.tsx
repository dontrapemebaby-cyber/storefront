// src/app/chinh-sach-thanh-toan/page.tsx
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { ArticlePage, ArticleSection } from '@/components/site/article-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Chính sách thanh toán',
  description: 'Cách thanh toán, cách chúng tôi đối soát chuyển khoản và chính sách hoàn tiền.',
  alternates: { canonical: '/chinh-sach-thanh-toan' },
};

export default async function PaymentPolicyPage() {
  const { brand } = await getSiteSettings();

  return (
    <ArticlePage
      eyebrow="Chính sách"
      title="Chính sách thanh toán"
      description="Nói rõ tiền đi đường nào và ai xác nhận, để bạn không phải đoán."
      updatedAt="01/07/2026"
    >
      <ArticleSection title="Các hình thức thanh toán">
        <p>
          <strong>Chuyển khoản ngân hàng</strong> — hình thức chính. Sau khi gửi yêu cầu với sản phẩm có giá sẵn, bạn
          nhận mã QR đã điền sẵn số tiền và nội dung chuyển khoản.
        </p>
        <p>
          <strong>Tiền mặt tại xưởng</strong> — khi bạn tới lấy hàng trực tiếp.
        </p>
        <p>
          Chúng tôi <strong>không</strong> nhận thanh toán bằng thẻ trên website và không lưu bất kỳ thông tin thẻ nào.
          Website cũng không tự động trừ tiền của bạn — mọi khoản chuyển đi đều do bạn chủ động thực hiện trong app ngân
          hàng của mình.
        </p>
      </ArticleSection>

      <ArticleSection title="Khi nào phải trả tiền">
        <p>
          <strong>Sản phẩm có bảng giá sẵn:</strong> thanh toán đủ 100% trước khi vào xưởng. Đây là hàng in theo yêu cầu
          riêng, không bán lại cho ai khác được, nên chúng tôi không sản xuất trước.
        </p>
        <p>
          <strong>Sản phẩm cần khảo sát</strong> (biển hiệu, thi công): đặt cọc theo thỏa thuận khi chốt báo giá, thanh
          toán phần còn lại khi nghiệm thu.
        </p>
        <p>
          <strong>Đơn cần báo giá:</strong> bạn không phải trả gì cho tới khi xem báo giá và đồng ý. Gửi yêu cầu và nhận
          báo giá là miễn phí.
        </p>
      </ArticleSection>

      <ArticleSection title="Chúng tôi xác nhận đã nhận tiền như thế nào">
        <p>
          Đây là điều nhiều khách hiểu nhầm nên nói thẳng: <strong>website không tự biết tiền đã vào hay chưa.</strong>{' '}
          Chúng tôi không tích hợp cổng thanh toán tự động.
        </p>
        <p>
          Sau khi bạn chuyển khoản và bấm “Tôi đã chuyển khoản”, đơn chuyển sang trạng thái chờ đối soát. Nhân viên mở
          sao kê ngân hàng, tìm giao dịch khớp với nội dung chuyển khoản, rồi mới xác nhận. Việc này thường mất 15–30
          phút trong giờ làm việc{brand.workingHours ? ` (${brand.workingHours})` : ''}.
        </p>
        <p>
          Vì vậy <strong>nội dung chuyển khoản rất quan trọng</strong>. Ghi đúng nội dung mà mã QR đã điền sẵn thì nhân
          viên tìm ra ngay. Ghi sai hoặc để trống thì phải dò tay, đơn của bạn chậm lại.
        </p>
        <p>
          Đã chuyển khoản hơn một tiếng trong giờ làm việc mà trạng thái chưa đổi? Gọi cho chúng tôi
          {brand.phone ? ` theo số ${brand.phone}` : ''} và đọc mã yêu cầu — đừng chuyển lần thứ hai.
        </p>
      </ArticleSection>

      <ArticleSection title="Hoàn tiền">
        <p>
          <strong>Chưa vào xưởng:</strong> hủy đơn được và hoàn 100%. Tiền về tài khoản trong 1–3 ngày làm việc.
        </p>
        <p>
          <strong>Đã vào xưởng:</strong> không hoàn được phần vật tư đã tiêu hao, vì hàng in riêng theo file của bạn
          không dùng cho đơn khác được. Phần chưa sản xuất vẫn hoàn.
        </p>
        <p>
          <strong>Lỗi do chúng tôi:</strong> sản phẩm sai so với file bạn đã duyệt thì in lại miễn phí, hoặc hoàn toàn bộ
          nếu bạn không muốn in lại nữa. Bạn chọn.
        </p>
        <p>
          <strong>Chuyển thừa hoặc chuyển nhầm:</strong> gọi ngay cho chúng tôi. Đối soát xong chúng tôi hoàn lại phần
          thừa.
        </p>
      </ArticleSection>

      <ArticleSection title="Hóa đơn">
        <p>
          Cần hóa đơn VAT thì báo ngay khi đặt và cung cấp thông tin xuất hóa đơn. Giá niêm yết trên website chưa gồm
          VAT.
        </p>
      </ArticleSection>
    </ArticlePage>
  );
}
