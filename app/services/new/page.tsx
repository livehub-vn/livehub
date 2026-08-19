"use client";

import { DirectImageUploader, type PreviewItem } from "@/components/direct-image-uploader";
import { LocationPickerDialog } from "@/components/location-picker-dialog";
import { AuroraText } from "@/components/ui/aurora-text";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { uploadPendingImages } from "@/lib/storage-helper";
import { createClient } from "@/lib/supabase/client";
import { getFallbackProfile } from "@/lib/demo-session";
import type { ServiceCategory } from "@/lib/types/database";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SERVICE_PRICE_PRESETS = [500000, 1000000, 2000000, 3500000, 5000000, 10000000];

export default function PostNewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("equipment");
  const [pricePerDay, setPricePerDay] = useState("1500000");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState<PreviewItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const providerId = user?.id || getFallbackProfile("provider").id;

    const price = parseFloat(pricePerDay);
    if (isNaN(price) || price <= 0) {
      setErrorMsg("Giá thuê theo ngày không hợp lệ");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload any pending local image files to Supabase Storage
      const uploadedUrls = await uploadPendingImages(imagePreviews, "services");

      // 2. Insert service record into database
      let insertResult = await supabase
        .from("services")
        .insert({
          provider_id: providerId,
          title,
          category,
          price_per_day: price,
          location,
          description,
          images: uploadedUrls,
          status: "pending",
        })
        .select()
        .single();

      // Fallback: If remote schema cache lacks 'images' column, retry without 'images' field
      if (insertResult.error && insertResult.error.message?.includes("images")) {
        insertResult = await supabase
          .from("services")
          .insert({
            provider_id: providerId,
            title,
            category,
            price_per_day: price,
            location,
            description,
            status: "pending",
          })
          .select()
          .single();
      }

      if (insertResult.error) {
        setErrorMsg(insertResult.error.message);
        setLoading(false);
      } else if (insertResult.data) {
        router.push(`/services/${insertResult.data.id}`);
      } else {
        router.push("/services/my");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi khi tạo dịch vụ.");
      setLoading(false);
    }
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
            Sau khi đăng, dịch vụ sẽ được gửi đến Quản trị viên LiveHub để duyệt và chuyển trực tiếp tới trang chi tiết.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                Tên dịch vụ / Thiết bị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Bộ máy quay Sony FX3 + Lens 24-70mm f/2.8 GM II"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Phân loại danh mục <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                >
                  <option value="equipment">Thiết bị Livestream</option>
                  <option value="studio">Studio / Phòng quay</option>
                  <option value="crew">Ekip sản xuất</option>
                  <option value="operator">Kỹ thuật viên / Operator</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Giá thuê 1 ngày (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <FormattedCurrencyInput
                  value={pricePerDay}
                  onChange={setPricePerDay}
                  placeholder="VD: 1.500.000"
                  presetAmounts={SERVICE_PRICE_PRESETS}
                  unitSuffix="/ngày"
                  required
                />
              </div>
            </div>

            {/* Location with Goong Map Dialog Picker */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                Khu vực / Địa điểm giao nhận <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Quận 1, TP. Hồ Chí Minh"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMapDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors cursor-pointer shrink-0"
                >
                  <MapPin className="size-4" />
                  <span>Chọn trên bản đồ</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                Mô tả chi tiết & Thông số kỹ thuật <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Chi tiết cấu hình, tình trạng thiết bị, phụ kiện kèm theo..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                required
              />
            </div>

            {/* Direct Image Uploader (Zero modal dialog, direct upload on submit) */}
            <DirectImageUploader
              items={imagePreviews}
              onChange={setImagePreviews}
              maxImages={6}
              label="Hình ảnh thực tế thiết bị / studio"
              description="Thêm ảnh trực tiếp từ máy để tăng độ uy tín cho bài đăng (ảnh sẽ được lưu khi bấm Đăng)"
            />

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang tải ảnh & lưu dịch vụ..." : "Hoàn tất & Chuyển tới trang chi tiết dịch vụ"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Goong Map Location Picker Modal Dialog */}
      <LocationPickerDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        initialLocation={location}
        onSelectLocation={(addr) => setLocation(addr)}
      />
    </div>
  );
}
