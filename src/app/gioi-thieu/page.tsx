// src/app/gioi-thieu/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/data/settings';
import { ArticlePage, ArticleSection } from '@/components/site/article-page';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description: 'Nhà in cho quán, cửa hàng và thương hiệu nhỏ tại Hà Nội.',
  alternates: { canonical: '/gioi-thieu' },
};

export default async function AboutPage() {
  const { brand } = await getSiteSettings();

  return (
    <ArticlePage eyebrow="Giới thiệu" title={brand.name} description={brand.slogan}>
      <ArticleSection title="Chúng tôi làm gì">
        <p>
          Chúng tôi in cho quán cà phê, cửa hàng, tiệm bánh và các thương hiệu nhỏ ở Hà Nội: tem nhãn, sticker, decal,
          menu, standee, backdrop, biển hiệu. Đơn vài trăm cái cũng nhận, không đặt mức tối thiểu cao đến mức chỉ công ty
          lớn mới đặt nổi.
        </p>
        <p>
          Phần lớn khách của chúng tôi không phải dân thiết kế. Họ có một ý tưởng, một file lấy từ đâu đó, hoặc chưa có
          gì cả. Website này được dựng cho đúng những người đó: chọn thông số là thấy giá, chưa có file thì vẫn gửi được
          yêu cầu.
        </p>
      </ArticleSection>

      <ArticleSection title="Cách chúng tôi làm việc">
        <p>
          <strong>Kiểm file trước, in sau.</strong> File thiếu tràn lề hay chữ chưa convert, chúng tôi báo bạn — không in
          bừa rồi bắt bạn chịu. Bước này miễn phí và luôn có, kể cả với đơn nhỏ nhất.
        </p>
        <p>
          <strong>Nói thật về thời gian.</strong> Đơn gấp mà chúng tôi không kịp thì nói không kịp, ngay lúc bạn hỏi. Nhận
          bừa rồi để bạn hỏng buổi khai trương thì tệ hơn nhiều so với việc mất một đơn.
        </p>
        <p>
          <strong>Giá không có phần ẩn.</strong> Sản phẩm có bảng giá thì hiện rõ cách tính. Sản phẩm cần khảo sát thì báo
          giá trước khi bạn trả bất cứ đồng nào.
        </p>
      </ArticleSection>

      <ArticleSection title="Điều chúng tôi không làm">
        <p>
          Chúng tôi không in giấy tờ giả, không in bao bì nhái thương hiệu người khác, không nhận đơn mà chúng tôi biết
          là mình làm không tốt. Việc gì nằm ngoài khả năng, chúng tôi nói thẳng và giới thiệu chỗ làm được.
        </p>
      </ArticleSection>

      <div className="flex flex-col gap-3 rounded-token-lg border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading font-semibold">Cần in gì đó?</p>
          <p className="text-[13px] text-muted">Xem bảng giá, hoặc gửi file để chúng tôi báo giá.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/san-pham">Xem sản phẩm</Link>
          </Button>
          <Button asChild>
            <Link href="/gui-file-in">Gửi file</Link>
          </Button>
        </div>
      </div>
    </ArticlePage>
  );
}
