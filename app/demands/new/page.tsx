"use client";

import { createClient } from "@/lib/supabase/client";
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuroraText } from "@/components/ui/aurora-text";

export default function PostNewDemandPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageList, setImageList] = useState<string[]>([]);

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImageList([...imageList, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageList(imageList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const budgetVal = parseFloat(budget);
    if (isNaN(budgetVal) || budgetVal <= 0) {
      setErrorMsg("Ngân sách dự kiến không hợp lệ");
      setLoading(false);
      return;
    }

    const finalImages = imageList.length > 0 ? imageList : imageUrl ? [imageUrl] : [];

    const { error } = await supabase.from("demands").insert({
      customer_id: user.id,
      title,
      budget: budgetVal,
      location,
      event_date: eventDate,
      description,
      images: finalImages,
      status: "pending",
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/demands"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Quay lại Sàn nhu cầu</span>
        </Link>

        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-border bg-card p-8 shadow-xl sm:p-10">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Đăng nhu cầu tuyển dụng / thuê ekip lên <AuroraText>LiveHub</AuroraText>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Thông tin nhu cầu sẽ được Quản trị viên LiveHub kiểm duyệt trước khi công khai cho các nhà cung cấp báo giá.
          </p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-sm">
              <CheckCircle2 className="mx-auto size-12 text-emerald-500 dark:text-emerald-400" />
              <h3 className="mt-4 text-xl font-bold text-emerald-800 dark:text-emerald-300">
                Đăng nhu cầu dự án thành công!
              </h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-emerald-950 dark:text-emerald-100">
                Bài viết đang ở trạng thái chờ duyệt. Quản trị viên LiveHub sẽ kiểm duyệt và duyệt bài trong thời gian sớm nhất.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/demands"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600"
                >
                  <span>📋 Đến Sàn nhu cầu dự án</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setTitle("");
                    setBudget("");
                    setLocation("");
                    setEventDate("");
                    setDescription("");
                    setImageList([]);
                  }}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Đăng thêm nhu cầu khác
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Tên tiêu đề nhu cầu dự án
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Cần thuê ekip livestream 3 camera cho ra mắt sản phẩm"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Ngân sách dự kiến (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="15000000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                    required
                  />
                </div>

                <DatePicker
                  label="Ngày tổ chức sự kiện"
                  value={eventDate}
                  onChange={(val) => setEventDate(val)}
                  placeholder="Chọn ngày tổ chức sự kiện..."
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Địa điểm tổ chức / Giao nhận
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Quận 3, TP. Hồ Chí Minh"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Mô tả chi tiết yêu cầu & Phạm vi công việc
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Số lượng camera, nền tảng livestream (TikTok, Facebook), yêu cầu ánh sáng, âm thanh..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  required
                />
              </div>

              {/* Multiple Reference Images */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Hình ảnh tham khảo / Moodboard / Sơ đồ sự kiện (Đính kèm nhiều ảnh)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {imageList.length} ảnh đã chọn
                  </span>
                </div>

                {/* URL Input & File Picker */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Dán link ảnh online (https://...)"
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="rounded-xl border border-border bg-muted px-4 py-3 text-xs font-semibold hover:bg-card shrink-0 transition-colors"
                  >
                    Thêm link
                  </button>

                  <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 px-4 py-3 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 shrink-0 transition-colors">
                    <span>📁 Tải ảnh từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              const result = uploadEvent.target?.result;
                              if (typeof result === "string") {
                                setImageList((prev) => [...prev, result]);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Quick Presets for Demo / Testing */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground mr-1 font-medium">Gợi ý nhanh:</span>
                  {[
                    { label: "Sân khấu Runway", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80" },
                    { label: "Studio TikTok Shop", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80" },
                    { label: "Hội thảo Talkshow", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&auto=format&fit=crop&q=80" },
                    { label: "Bàn trộn Kỹ thuật", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80" },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!imageList.includes(preset.url)) {
                          setImageList([...imageList, preset.url]);
                        }
                      }}
                      className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[10px] font-medium text-foreground hover:border-orange-500 hover:text-orange-500 transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                {/* Visual Thumbnail Grid */}
                {imageList.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                    {imageList.map((imgSrc, i) => (
                      <div
                        key={i}
                        className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-muted shadow-xs"
                      >
                        <Image
                          src={imgSrc}
                          alt=""
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="rounded-full bg-rose-600 p-1.5 text-white shadow-md hover:bg-rose-700 transition-colors"
                            title="Xóa ảnh này"
                          >
                            ✕
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Đang gửi duyệt..." : "Gửi nhu cầu đến Ban Quản trị"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
