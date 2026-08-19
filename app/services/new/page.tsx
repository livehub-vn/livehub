"use client";

import { createClient } from "@/lib/supabase/client";
import type { ServiceCategory } from "@/lib/types/database";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuroraText } from "@/components/ui/aurora-text";

export default function PostNewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("equipment");
  const [pricePerDay, setPricePerDay] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageList, setImageList] = useState<string[]>([]);

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImageList([...imageList, imageUrl.trim()]);
      setImageUrl("");
    }
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

    const price = parseFloat(pricePerDay);
    if (isNaN(price) || price <= 0) {
      setErrorMsg("Giá thuê theo ngày không hợp lệ");
      setLoading(false);
      return;
    }

    const finalImages = imageList.length > 0 ? imageList : imageUrl ? [imageUrl] : [];

    const { error } = await supabase.from("services").insert({
      provider_id: user.id,
      title,
      category,
      price_per_day: price,
      location,
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
          href="/services"
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          <span>Quay lại Sàn dịch vụ</span>
        </Link>

        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-border bg-card p-8 shadow-xl sm:p-10">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Đăng dịch vụ / thiết bị lên <AuroraText>LiveHub</AuroraText>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Sau khi tạo, dịch vụ sẽ được gửi đến Quản trị viên LiveHub để duyệt trước khi công khai trên thị trường.
          </p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-sm">
              <CheckCircle2 className="mx-auto size-12 text-emerald-500 dark:text-emerald-400" />
              <h3 className="mt-4 text-xl font-bold text-emerald-800 dark:text-emerald-300">
                Gửi bài đăng dịch vụ thành công!
              </h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-emerald-950 dark:text-emerald-100">
                Dịch vụ của bạn đã được lưu vào hệ thống. Quản trị viên LiveHub sẽ kiểm tra và kích hoạt hiển thị trực tiếp trên Sàn giao dịch.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600"
                >
                  <span>🛍️ Đến Cửa hàng / Sàn Dịch Vụ</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setTitle("");
                    setPricePerDay("");
                    setDescription("");
                    setImageList([]);
                  }}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  Đăng thêm dịch vụ khác
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
                  Tên dịch vụ / Thiết bị
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bộ máy quay Sony FX3 + Lens 24-70mm f/2.8 GM II"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Phân loại danh mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="equipment">Thiết bị Livestream</option>
                    <option value="studio">Studio / Phòng quay</option>
                    <option value="crew">Ekip sản xuất</option>
                    <option value="operator">Kỹ thuật viên / Operator</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Giá thuê 1 ngày (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    placeholder="1500000"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Khu vực / Địa điểm giao nhận
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Quận 1, TP. Hồ Chí Minh"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Mô tả chi tiết & Thông số kỹ thuật
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chi tiết cấu hình, tình trạng thiết bị, phụ kiện kèm theo..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  URL Hình ảnh minh họa (Thêm nhiều hình)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="rounded-xl border border-border bg-muted px-4 py-3 text-xs font-semibold hover:bg-card"
                  >
                    Thêm ảnh
                  </button>
                </div>

                {imageList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {imageList.map((_img, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                      >
                        Ảnh {i + 1}
                      </span>
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
                  {loading ? "Đang gửi duyệt..." : "Gửi dịch vụ đến Ban Quản trị"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
