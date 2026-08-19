"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const featuredStudios = [
  {
    name: "LiveHub Studio Flagship Q1",
    location: "Quận 1, TP. Hồ Chí Minh",
    rating: 4.9,
    reviewsCount: 38,
    specs: ["Phòng cách âm tiêu chuẩn", "Hệ thống ánh sáng Aputure", "Mạng cáp quang chuyên dụng 1Gbps"],
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop",
    price: "1.200.000 đ/giờ",
  },
  {
    name: "Mega Studio Livestream Hà Nội",
    location: "Cầu Giấy, Hà Nội",
    rating: 4.85,
    reviewsCount: 42,
    specs: ["Phông xanh vô cực", "3 Máy quay Sony FX3 4K", "Bàn switch Blackmagic ATEM"],
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop",
    price: "8.500.000 đ/ngày",
  },
  {
    name: "Creative Live Space Đà Nẵng",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.8,
    reviewsCount: 19,
    specs: ["Setup talkshow cao cấp", "Micro Rode Wireless Pro", "Hỗ trợ kỹ thuật trực tiếp"],
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1000&auto=format&fit=crop",
    price: "950.000 đ/giờ",
  },
];

const packages = [
  {
    title: "Gói Livestream Bán Hàng (E-commerce)",
    desc: "Tối ưu tương tác và hình ảnh sản phẩm sắc nét cho phiên live TikTok Shop & Shopee.",
    features: ["2 Máy quay Sony A7M4", "Ánh sáng beauty light chuyên nghiệp", "1 Kỹ thuật viên switch hình trực tiếp", "Hỗ trợ kết nối âm thanh không delay"],
    badge: "Phổ biến nhất",
    price: "3.500.000 đ/buổi",
  },
  {
    title: "Gói Talkshow & Hội Thảo Doanh Nghiệp",
    desc: "Đảm bảo đường truyền ổn định, âm thanh trong trẻo và chuẩn nhận diện thương hiệu.",
    features: ["3 Máy quay Sony FX3 đa góc", "Micro cài áo Rode Wireless Pro", "Phòng thu studio cách âm", "Kỹ thuật viên & Đạo diễn hình ảnh"],
    badge: "Chuyên nghiệp",
    price: "7.900.000 đ/buổi",
  },
  {
    title: "Gói Sự Kiện & Hội Nghị Đa Điểm Cầu",
    desc: "Giải pháp trọn gói cho lễ ra mắt, hội nghị trực tuyến và biểu diễn nghệ thuật.",
    features: ["Hệ thống 4 - 6 máy quay chuyên dụng", "Đường truyền Internet dự phòng 4G/5G", "Ekip đạo diễn & quay phim 4 người", "Ghi hình master 4K sau sự kiện"],
    badge: "Doanh nghiệp",
    price: "Liên hệ báo giá",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Chọn dịch vụ hoặc Đăng nhu cầu",
    desc: "Dễ dàng tìm thiết bị, studio có sẵn trên Sàn dịch vụ hoặc đăng bài dự án để nhận báo giá cạnh tranh.",
  },
  {
    step: "02",
    title: "Xác nhận & Khóa lịch an toàn",
    desc: "Mọi thông tin hợp đồng, chi phí và thời gian được ghi nhận minh bạch giữa hai bên.",
  },
  {
    step: "03",
    title: "Triển khai & Hỗ trợ kỹ thuật",
    desc: "Thiết bị được kiểm tra kỹ thuật trước giờ live, đối tác bàn giao đúng hẹn và hỗ trợ tận tâm.",
  },
];

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background px-4 pt-28 pb-16 sm:px-6 sm:pt-32 text-foreground">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-500">
            <Sparkles className="size-3.5" />
            <span>Hệ sinh thái đối tác tin cậy</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Khám phá <AuroraText>LiveHub</AuroraText>
          </h1>

          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Nơi kết nối các thương hiệu, nhà sáng tạo nội dung với mạng lưới thiết bị, phòng quay studio và ekip sản xuất livestream hàng đầu tại Việt Nam.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:-translate-y-0.5"
            >
              <span>Vào Sàn dịch vụ</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/demands/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-orange-500"
            >
              <span>Đăng nhu cầu dự án</span>
            </Link>
          </div>
        </div>

        {/* Section 1: Featured Studios */}
        <div id="studios" className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold">Studio & Phòng quay nổi bật</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Các không gian sản xuất tiêu chuẩn được khách hàng đánh giá cao nhất.
              </p>
            </div>

            <Link
              href="/services?category=studio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:underline"
            >
              <span>Xem tất cả studio</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featuredStudios.map((studio, idx) => (
              <div
                key={idx}
                className="group rounded-3xl border border-border bg-card p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={studio.image}
                    alt={studio.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-amber-400 backdrop-blur-md">
                    <Star className="size-3 fill-amber-400" />
                    <span>{studio.rating}</span>
                  </div>
                </div>

                <div className="mt-4 px-1">
                  <h3 className="text-base font-bold text-foreground group-hover:text-orange-500 transition-colors">
                    {studio.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 text-orange-500" />
                    <span>{studio.location}</span>
                  </p>

                  <div className="mt-3 space-y-1">
                    {studio.specs.map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                        <span className="line-clamp-1">{spec}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-500">{studio.price}</span>
                    <Link
                      href="/services"
                      className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-orange-500 hover:text-orange-500"
                    >
                      Đặt thuê
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Package Solutions */}
        <div id="packages" className="mt-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold sm:text-3xl">Gói giải pháp livestream phổ biến</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Tiết kiệm thời gian với các combo thiết bị và nhân sự được thiết kế chuyên biệt cho từng mục đích.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-xl"
              >
                <div>
                  <span className="inline-block rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500">
                    {pkg.badge}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{pkg.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{pkg.desc}</p>

                  <div className="mt-6 space-y-2.5 border-t border-border pt-4">
                    {pkg.features.map((ft, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="size-3.5 text-orange-500 shrink-0" />
                        <span>{ft}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-border pt-4">
                  <p className="text-base font-bold text-orange-500">{pkg.price}</p>
                  <Link
                    href="/demands/new"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-orange-600"
                  >
                    <span>Yêu cầu báo giá gói này</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Process */}
        <div id="process" className="mt-24 rounded-3xl border border-border bg-card p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-500">
              <ShieldCheck className="size-3.5" />
              <span>An tâm chất lượng</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Quy trình làm việc 3 bước tại LiveHub</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Đảm bảo tính minh bạch, đúng hẹn và chuẩn kỹ thuật cho mọi phiên livestream của bạn.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {processSteps.map((item, idx) => (
              <div key={idx} className="relative rounded-2xl border border-border bg-background p-6">
                <span className="text-3xl font-black text-orange-500/30">{item.step}</span>
                <h3 className="mt-2 text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: FAQ Quick Link */}
        <div id="faq" className="mt-16 text-center border-t border-border pt-12">
          <h3 className="text-lg font-bold">Bạn có thắc mắc cần hỗ trợ?</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Đội ngũ hỗ trợ kỹ thuật LiveHub luôn sẵn sàng giải đáp và tư vấn phương án livestream phù hợp nhất.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/services"
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-600"
            >
              Khám phá ngay Sàn dịch vụ
            </Link>
            <Link
              href="/demands/new"
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-orange-500"
            >
              Đăng yêu cầu tư vấn
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
