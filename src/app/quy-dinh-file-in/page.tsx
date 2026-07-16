// src/app/quy-dinh-file-in/page.tsx
import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/data/settings';
import { ArticlePage, ArticleSection } from '@/components/site/article-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quy định về file in',
  description: 'Quyền sử dụng nội dung, những gì nhà in không nhận in, và cách chúng tôi xử lý file của bạn.',
  alternates: { canonical: '/quy-dinh-file-in' },
};

export default async function FileRulesPage() {
  const { brand } = await getSiteSettings();

  return (
    <ArticlePage
      eyebrow="Quy định"
      title="Quy định về file in"
      description="Đây là những điều bạn xác nhận khi tick vào ô “Tôi có quyền sử dụng nội dung trong file”."
      updatedAt="01/07/2026"
    >
      <ArticleSection title="Quyền sử dụng nội dung">
        <p>
          Khi gửi file, bạn xác nhận mình có quyền hợp pháp với toàn bộ nội dung trong đó: hình ảnh, logo, phông chữ,
          nhãn hiệu và mọi thành phần khác — dù là bạn tự tạo, đã mua bản quyền, hay được chủ sở hữu cho phép.
        </p>
        <p>
          Chúng tôi in theo file bạn gửi và không thẩm định quyền sở hữu của từng thành phần. Nếu có tranh chấp về bản
          quyền hay nhãn hiệu phát sinh từ nội dung bạn cung cấp, trách nhiệm thuộc về bạn.
        </p>
      </ArticleSection>

      <ArticleSection title="Nội dung chúng tôi không nhận in">
        <p>Chúng tôi từ chối và hủy đơn, kể cả khi đã thanh toán, với các nội dung:</p>
        <p>
          <strong>Vi phạm pháp luật Việt Nam</strong> — giấy tờ tùy thân, bằng cấp, con dấu, hóa đơn, tem chống hàng giả
          hoặc bất kỳ tài liệu nào nhằm giả mạo.
        </p>
        <p>
          <strong>Hàng giả, hàng nhái</strong> — bao bì, tem nhãn mang thương hiệu của người khác mà bạn không được ủy
          quyền.
        </p>
        <p>
          <strong>Nội dung bị cấm</strong> — kích động bạo lực, thù ghét, phân biệt đối xử; nội dung khiêu dâm; quảng
          cáo sản phẩm cấm kinh doanh.
        </p>
        <p>Đơn bị hủy vì lý do này sẽ được hoàn tiền, trừ phần vật tư đã tiêu hao nếu đã vào xưởng.</p>
      </ArticleSection>

      <ArticleSection title="Chúng tôi làm gì với file của bạn">
        <p>
          File được lưu trong kho riêng, không công khai. Chỉ nhân viên phụ trách đơn của bạn mở được. Website không tạo
          đường dẫn công khai tới file nào.
        </p>
        <p>
          Chúng tôi dùng file để: kiểm tra kỹ thuật, in, và lưu lại phục vụ việc in lại khi bạn đặt tiếp. Chúng tôi{' '}
          <strong>không</strong> dùng file của bạn để làm mẫu quảng cáo, không đưa lên mạng xã hội và không chia sẻ cho
          bên thứ ba, trừ khi bạn đồng ý bằng văn bản.
        </p>
        <p>
          File được giữ 12 tháng kể từ đơn gần nhất, sau đó xóa. Muốn xóa sớm hơn, gọi cho chúng tôi
          {brand.phone ? ` theo số ${brand.phone}` : ''} là được.
        </p>
      </ArticleSection>

      <ArticleSection title="Duyệt mẫu và trách nhiệm về lỗi">
        <p>
          Chúng tôi kiểm tra file về mặt kỹ thuật: tràn lề, độ phân giải, hệ màu, chữ đã convert chưa. Có vấn đề là báo
          bạn trước khi in.
        </p>
        <p>
          Chúng tôi <strong>không</strong> soát lỗi chính tả, sai số điện thoại hay sai địa chỉ trong thiết kế của bạn.
          Nội dung là của bạn, hãy đọc kỹ trước khi duyệt. File đã duyệt và đã in mà phát hiện sai nội dung thì phải in
          lại và tính phí như đơn mới.
        </p>
        <p>
          Ngược lại, nếu sản phẩm sai so với file đã duyệt — lệch màu quá mức, xén sai, in mờ — chúng tôi in lại miễn
          phí. Báo trong vòng 48 giờ kể từ khi nhận hàng, kèm ảnh chụp.
        </p>
      </ArticleSection>

      <ArticleSection title="Sai lệch màu chấp nhận được">
        <p>
          Màu in không bao giờ giống hệt màu trên màn hình, và hai lần in cách nhau vài tháng cũng chênh nhẹ do lô mực và
          lô giấy khác nhau. Sai lệch trong khoảng chấp nhận của ngành in không tính là lỗi.
        </p>
        <p>
          Cần màu tuyệt đối chính xác thì báo trước để chúng tôi in mẫu thử — có tính phí, nhưng chắc chắn hơn nhiều so
          với đoán.
        </p>
      </ArticleSection>
    </ArticlePage>
  );
}
