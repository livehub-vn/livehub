"use client";

import { AuroraText } from "@/components/ui/aurora-text";
import { DatePicker } from "@/components/ui/date-picker";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const turnkeyPackages = [
  {
    id: "ecommerce",
    name: "Gói Livestream Bán Hàng E-Commerce",
    badge: "Bán chạy nhất",
    price: 5500000,
    unit: "/ ca 4 tiếng",
    suitableFor:
      "Shop thời trang, mỹ phẩm, đồ gia dụng bán hàng trên TikTok Shop, Shopee Live, Facebook Live.",
    image:
      "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1000&auto=format&fit=crop&q=80",
    features: [
      "1-2 Máy quay Sony 4K chuyên dụng góc cận & góc toàn",
      "Bộ đèn Key Light, Fill Light & RGB tạo chiều sâu",
      "Hệ thống Micro không dây lọc tạp âm DJI Mic 2",
      "1 Kỹ thuật viên vận hành phần mềm OBS/vMix chuyên nghiệp",
      "Setup logo, voucher giảm giá, minigame tương tác trực tiếp",
      "Bàn giao toàn bộ video ghi hình sau buổi phát",
    ],
  },
  {
    id: "talkshow",
    name: "Gói Talkshow & Hội Thảo Doanh Nghiệp",
    badge: "Khuyên dùng cho Doanh nghiệp",
    price: 12500000,
    unit: "/ buổi",
    suitableFor:
      "Tọa đàm chuyên gia, hội thảo quốc tế, lễ ký kết hợp tác, webinar đa điểm cầu qua Zoom/Teams.",
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80",
    features: [
      "2-3 Máy quay Sony FX3/FX6 chuẩn điện ảnh đa góc bắt cảm xúc",
      "Bàn trộn hình chuyên dụng Blackmagic ATEM Mini Extreme ISO",
      "Hệ thống âm thanh mixer kỹ thuật số chống vang vọng tuyệt đối",
      "Đường truyền cầu nối Zoom/MS Teams đa điểm cầu trực tiếp",
      "2 Kỹ thuật viên điều khiển hình ảnh và âm thanh chuyên sâu",
      "Bàn giao file Master 4K ISO từng góc máy đóng gói hậu kỳ",
    ],
  },
  {
    id: "mega-event",
    name: "Gói Sự Kiện Ra Mắt & Đại Nhạc Hội Mega Event",
    badge: "Quy mô lớn & Truyền hình",
    price: 28000000,
    unit: "/ sự kiện",
    suitableFor:
      "Đại nhạc hội, lễ hội âm nhạc, lễ ra mắt sản phẩm thương hiệu, gala vinh danh 500+ khách mời.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80",
    features: [
      "4-6 Máy quay chuyên dụng (Cần cẩu Crane 7m, Gimbal, Tele lens, Flycam)",
      "Kết nối màn hình LED sân khấu P2.5 siêu sắc nét",
      "Bộ truyền dẫn không dây cáp quang cự ly xa không trễ",
      "Đường truyền Internet 4G Bonded đa nhà mạng + vệ tinh Starlink chống rớt",
      "Đạo diễn hình ảnh + Ekip kỹ thuật 8+ nhân sự túc trực",
      "Kịch bản luân chuyển khung hình đạt chuẩn tiếp sóng truyền hình",
    ],
  },
];

const workSteps = [
  {
    step: "01",
    title: "Tiếp nhận & Tư vấn",
    desc: "Lắng nghe mục tiêu, quy mô và lên giải pháp thiết bị tối ưu chi phí cho nhãn hàng.",
  },
  {
    step: "02",
    title: "Khảo sát & Kịch bản",
    desc: "Kiểm tra hạ tầng ánh sáng, âm thanh, đường truyền mạng và thống nhất timeline kỹ thuật.",
  },
  {
    step: "03",
    title: "Setup & Chạy thử",
    desc: "Hoàn tất lắp đặt và chạy tổng duyệt kỹ thuật trước giờ G ít nhất 120 phút.",
  },
  {
    step: "04",
    title: "Phát sóng & Bàn giao",
    desc: "Vận hành phát trực tiếp ổn định và xuất dữ liệu ghi hình đóng gói chất lượng cao.",
  },
];

function getBookingErrorMessage(error: unknown): string {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "";

  if (
    message.includes("turnkey_package_bookings") ||
    message.includes("schema cache")
  ) {
    return "Hệ thống tiếp nhận đăng ký đang được cấu hình. Vui lòng thử lại sau hoặc liên hệ LiveHub để được hỗ trợ; thông tin bạn đã nhập vẫn được giữ nguyên.";
  }

  return "LiveHub chưa thể lưu đăng ký của bạn lúc này. Vui lòng kiểm tra kết nối và thử lại; toàn bộ thông tin đã nhập vẫn được giữ nguyên.";
}

export default function PackagesPage() {
  // Booking Modal State
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const selectedPackageDetails = turnkeyPackages.find(
    (pkg) => pkg.id === selectedPackage
  );
  const checkoutHref =
    selectedPackageDetails && createdBookingId
      ? `/checkout/package_${selectedPackageDetails.id}?bookingId=${encodeURIComponent(
          createdBookingId
        )}&amount=${selectedPackageDetails.price}&title=${encodeURIComponent(
          selectedPackageDetails.name
        )}`
      : null;

  const handleOpenBooking = (packageId: string) => {
    setSelectedPackage(packageId);
    setSubmitError(null);
    setCreatedBookingId(null);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setCreatedBookingId(null);

    const pkg = turnkeyPackages.find((p) => p.id === selectedPackage);
    if (!pkg) {
      setSubmitError(
        "Không tìm thấy gói dịch vụ đã chọn. Vui lòng đóng cửa sổ và chọn lại."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          customerName,
          customerPhone,
          customerEmail,
          eventDate,
          location,
          notes,
        }),
      });
      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok) throw new Error(data.error || "Booking request failed");

      if (!data?.id) {
        throw new Error("Booking was saved without a confirmation id");
      }

      setCreatedBookingId(String(data.id));
    } catch (error) {
      setSubmitError(getBookingErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        {/* Back Link */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Trở về Trang chủ</span>
        </Link>

        {/* HERO BANNER */}
        <div className="border-border relative overflow-hidden rounded-[3rem] border bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 text-white shadow-2xl sm:p-14">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold text-orange-400">
              <Radio className="size-3.5 animate-pulse text-orange-400" />
              <span>Giải pháp sản xuất toàn diện từ A-Z</span>
            </div>

            <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              Dịch vụ livestream <AuroraText>trọn gói</AuroraText> chuyên nghiệp
            </h1>

            <p className="text-xs leading-relaxed text-neutral-300 sm:text-sm">
              Tiết kiệm 40% chi phí so với tự đầu tư thiết bị. LiveHub cung cấp
              trọn gói từ máy quay 4K HDR, phòng quay studio, ánh sáng, âm thanh
              chống tạp âm đến ekip kỹ thuật viên nhiều năm kinh nghiệm cam kết
              buổi phát sóng mượt mà, bùng nổ doanh số.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => handleOpenBooking("ecommerce")}
                className="group inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:scale-105 hover:bg-orange-600 active:scale-95"
              >
                <span>Đăng ký gói ngay</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="#packages-list"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-800/80 px-6 py-3.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                <span>Xem các gói dịch vụ</span>
              </a>
            </div>
          </div>

          {/* Decorative background badges */}
          <div className="absolute right-8 bottom-8 hidden flex-col gap-3 lg:flex">
            <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-xl backdrop-blur-md">
              <ShieldCheck className="size-6 text-emerald-400" />
              <div>
                <p className="text-xs font-bold">Cam kết ổn định 99.9%</p>
                <p className="text-[10px] text-neutral-400">
                  Đường truyền dự phòng chống rớt mạng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-xl backdrop-blur-md">
              <Sparkles className="size-6 text-orange-400" />
              <div>
                <p className="text-xs font-bold">500+ Sự kiện thành công</p>
                <p className="text-[10px] text-neutral-400">
                  Được tin dùng bởi các nhãn hàng hàng đầu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGES COMPARISON LIST */}
        <div id="packages-list" className="mt-20 space-y-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Các gói dịch vụ <AuroraText>chuẩn hóa</AuroraText>
            </h2>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Mỗi gói dịch vụ đều được thiết kế tối ưu cho từng mục đích sản
              xuất cụ thể, bảo đảm chất lượng hình ảnh sắc nét và âm thanh rõ
              ràng.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {turnkeyPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="border-border bg-card flex flex-col justify-between overflow-hidden rounded-[2.5rem] border shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <div>
                  {/* Package Image */}
                  <div className="bg-muted relative h-52 w-full overflow-hidden">
                    <Image
                      src={pkg.image}
                      alt={pkg.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-4 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-0.5 text-[11px] font-bold text-white shadow-md">
                      <Sparkles className="size-3" />
                      {pkg.badge}
                    </span>
                  </div>

                  {/* Package Content */}
                  <div className="space-y-4 p-6 sm:p-8">
                    <h3 className="text-lg leading-snug font-bold">
                      {pkg.name}
                    </h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {pkg.suitableFor}
                    </p>

                    <div className="border-border flex items-baseline gap-1.5 border-y py-4">
                      <span className="text-2xl font-extrabold text-orange-500">
                        {pkg.price.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-muted-foreground text-xs font-medium">
                        {pkg.unit}
                      </span>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-2.5 pt-2">
                      <p className="text-foreground text-xs font-bold">
                        Hạng mục bao gồm:
                      </p>
                      <ul className="text-muted-foreground space-y-2.5 text-xs">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange-500" />
                            <span className="text-foreground/90 leading-tight">
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 sm:p-8">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(pkg.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-[0.99]"
                  >
                    <span>Đăng ký gói này</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-STEP WORKFLOW */}
        <div className="border-border bg-card/60 mt-24 rounded-[3rem] border p-8 backdrop-blur-xs sm:p-14">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Quy trình làm việc <AuroraText>4 bước</AuroraText> chuyên nghiệp
            </h3>
            <p className="text-muted-foreground mt-2 text-xs">
              Chuẩn hóa quy trình từ lúc nhận yêu cầu đến khi bàn giao dữ liệu
              ghi hình hoàn tất.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workSteps.map((ws, i) => (
              <div
                key={i}
                className="border-border bg-background relative space-y-3 overflow-hidden rounded-3xl border p-6"
              >
                <span className="font-mono text-3xl font-extrabold text-orange-500/30">
                  {ws.step}
                </span>
                <h4 className="text-foreground text-sm font-bold">
                  {ws.title}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {ws.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* BOOKING / CONSULTATION MODAL */}
        {selectedPackage && (
          <div className="animate-in fade-in fixed inset-0 z-99999 flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md">
            <div className="border-border bg-card text-foreground relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2.5rem] border p-6 shadow-2xl sm:p-8">
              <button
                type="button"
                onClick={() => setSelectedPackage(null)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-6 right-6 rounded-full p-2"
              >
                <X className="size-5" />
              </button>

              {createdBookingId ? (
                <div className="space-y-4 py-6 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="size-9" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    Đăng ký tư vấn thành công!
                  </h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Chuyên viên kỹ thuật LiveHub sẽ liên hệ với bạn qua số điện
                    thoại <strong>{customerPhone}</strong> trong vòng 15 phút để
                    khảo sát và lên báo giá chi tiết.
                  </p>
                  <div className="flex flex-col gap-2 pt-4">
                    {checkoutHref && (
                      <Link
                        href={checkoutHref}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Đặt cọc giữ lịch ngay (Real VietQR)</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedPackage(null)}
                      className="border-border hover:bg-muted rounded-xl border py-2.5 text-xs font-semibold"
                    >
                      Đóng cửa sổ
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="border-border border-b pb-4">
                    <span className="text-[11px] font-bold text-orange-500">
                      Đăng ký dịch vụ trọn gói
                    </span>
                    <h3 className="mt-1 text-lg font-bold">
                      {selectedPackageDetails?.name}
                    </h3>
                  </div>

                  <form
                    onSubmit={handleSubmitBooking}
                    className="mt-6 space-y-4 text-xs"
                  >
                    {submitError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-left leading-relaxed font-medium text-rose-700 dark:text-rose-300"
                      >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-semibold">
                        Họ và tên của bạn / Đại diện doanh nghiệp *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="border-border bg-background w-full rounded-xl border px-3.5 py-2.5 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-muted-foreground mb-1.5 block font-semibold">
                          Số điện thoại liên hệ *
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="0987 654 321"
                          className="border-border bg-background w-full rounded-xl border px-3.5 py-2.5 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-muted-foreground mb-1.5 block font-semibold">
                          Email nhận báo giá *
                        </label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="email@congty.com"
                          className="border-border bg-background w-full rounded-xl border px-3.5 py-2.5 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <DatePicker
                      label="Ngày dự kiến phát sóng"
                      value={eventDate}
                      onChange={(val) => setEventDate(val)}
                      placeholder="Chọn ngày dự kiến..."
                      minDate={new Date()}
                      required
                    />

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-semibold">
                        Địa điểm tổ chức (Quận/Huyện, Tỉnh/Thành phố)
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
                        className="border-border bg-background w-full rounded-xl border px-3.5 py-2.5 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-muted-foreground mb-1.5 block font-semibold">
                        Yêu cầu kỹ thuật đặc biệt (nếu có)
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Số lượng máy quay thêm, yêu cầu phông xanh, MC..."
                        className="border-border bg-background w-full rounded-xl border px-3.5 py-2.5 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-orange-600 disabled:opacity-50"
                    >
                      <Send className="size-4" />
                      <span>
                        {isSubmitting
                          ? "Đang gửi thông tin..."
                          : "Gửi thông tin & Nhận báo giá"}
                      </span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
