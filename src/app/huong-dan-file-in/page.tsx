// src/app/huong-dan-file-in/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticlePage, ArticleSection } from '@/components/site/article-page';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hướng dẫn chuẩn bị file in',
  description: 'Tràn lề, convert chữ, hệ màu CMYK, độ phân giải — những thứ cần đúng trước khi gửi file cho nhà in.',
  alternates: { canonical: '/huong-dan-file-in' },
};

export default function FileGuidePage() {
  return (
    <ArticlePage
      eyebrow="Hướng dẫn"
      title="Chuẩn bị file in"
      description="Phần lớn đơn bị chậm là do file, không phải do máy in. Bốn thứ dưới đây làm đúng là gần như chắc chắn in ra đúng ý."
    >
      <ArticleSection title="1. Chừa tràn lề 2mm mỗi cạnh">
        <p>
          Máy xén không bao giờ cắt chính xác tuyệt đối — luôn lệch một chút. Nếu nền màu dừng đúng mép thành phẩm, chỗ
          lệch sẽ thành viền trắng.
        </p>
        <p>
          <strong>Cách làm:</strong> kéo nền màu và ảnh vượt ra ngoài mép thành phẩm 2mm mỗi cạnh. Tem 5×5cm thì file
          đặt 5,4×5,4cm.
        </p>
        <p>
          <strong>Ngược lại:</strong> chữ và logo phải lùi vào trong mép ít nhất 3mm, nếu không có nguy cơ bị xén mất.
        </p>
      </ArticleSection>

      <ArticleSection title="2. Convert chữ thành đường (outline)">
        <p>
          Máy của chúng tôi không có font của bạn. File chưa convert mở ra sẽ bị thay bằng font khác — chữ nhảy dòng,
          sai khoảng cách, có khi mất dấu tiếng Việt.
        </p>
        <p>
          <strong>Illustrator:</strong> chọn hết rồi Type → Create Outlines (Ctrl+Shift+O).{' '}
          <strong>CorelDRAW:</strong> chọn hết rồi Convert To Curves (Ctrl+Q).
        </p>
        <p>
          Nhớ giữ lại một bản chưa convert cho lần sửa sau — convert rồi là không sửa chữ được nữa.
        </p>
      </ArticleSection>

      <ArticleSection title="3. Dùng hệ màu CMYK">
        <p>
          Màn hình phát sáng nên dùng hệ RGB, máy in dùng mực nên dùng hệ CMYK. Một số màu RGB rực rỡ (xanh neon, cam
          chói, tím sáng) không có mực nào pha ra được — in ra sẽ xỉn hơn trên màn hình.
        </p>
        <p>
          <strong>Cách làm:</strong> đặt màu tài liệu là CMYK ngay từ đầu, đừng để cuối mới đổi. Đổi ở bước cuối là màu
          sẽ nhảy mà bạn không kiểm soát được nhảy đi đâu.
        </p>
        <p>
          Cần màu chính xác tuyệt đối (màu thương hiệu) thì báo mã Pantone, chúng tôi tư vấn cách xử lý gần nhất.
        </p>
      </ArticleSection>

      <ArticleSection title="4. Ảnh tối thiểu 300 DPI">
        <p>
          Ảnh lấy từ web thường chỉ 72 DPI — đủ đẹp trên màn hình, in ra thì vỡ hạt. Cần ảnh 300 DPI ở đúng kích thước
          thành phẩm.
        </p>
        <p>
          <strong>Riêng in khổ lớn</strong> (banner, backdrop) thì 100–150 DPI là đủ, vì người xem đứng xa. Phóng ảnh
          nhỏ lên to bằng phần mềm không làm ảnh nét hơn — chỉ làm file nặng hơn.
        </p>
      </ArticleSection>

      <ArticleSection title="Định dạng nên gửi">
        <p>
          <strong>Tốt nhất là PDF</strong> — giữ nguyên vector, không vỡ chữ, dung lượng gọn. Sau đó là AI, CDR, EPS
          (nén vào ZIP để gửi).
        </p>
        <p>
          PNG và JPG cũng nhận, nhưng nhớ xuất ở 300 DPI đúng kích thước thật. File có nhiều thành phần (font, ảnh,
          link) thì nén hết vào một ZIP.
        </p>
        <p>Mỗi file tối đa 25MB, mỗi yêu cầu tối đa 10 file.</p>
      </ArticleSection>

      <ArticleSection title="Chưa có file thì sao?">
        <p>
          Vẫn gửi yêu cầu được. Bỏ trống phần file, mô tả ý tưởng ở ô ghi chú — kèm ảnh chụp mẫu bạn thích nếu có.
          Chúng tôi dựng mẫu và gửi bạn duyệt trước khi in.
        </p>
      </ArticleSection>

      <div className="flex flex-col gap-3 rounded-token-lg border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading font-semibold">File của bạn xong rồi?</p>
          <p className="text-[13px] text-muted">Chúng tôi kiểm tra miễn phí và báo lại trước khi in.</p>
        </div>
        <Button asChild>
          <Link href="/gui-file-in">Gửi file ngay</Link>
        </Button>
      </div>
    </ArticlePage>
  );
}
