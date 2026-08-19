"use client";

import { DirectImageUploader, type PreviewItem } from "@/components/direct-image-uploader";
import { LocationPickerDialog } from "@/components/location-picker-dialog";
import { AuroraText } from "@/components/ui/aurora-text";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { uploadPendingImages } from "@/lib/storage-helper";
import { createClient } from "@/lib/supabase/client";
import { loginWithGoogle } from "@/lib/auth-client";
import type { ServiceCategory } from "@/lib/types/database";
import { ArrowLeft, Lock, LogIn, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SERVICE_PRICE_PRESETS = [500000, 1000000, 2000000, 3500000, 5000000, 10000000];

export default function PostNewServicePage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("equipment");
  const [pricePerDay, setPricePerDay] = useState("1500000");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState<PreviewItem[]>([]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Bạn cần đăng nhập để đăng dịch vụ mới.");
      setLoading(false);
      router.push("/login?next=/services/new");
      return;
    }

    const providerId = user.id;

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
        <div className="mx-auto w-full max-w-xl">
          <Link
            href="/services"
            className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại Sàn dịch vụ</span>
          </Link>

          <div className="rounded-[2.5rem] border border-border bg-card p-8 text-center shadow-xl sm:p-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-inner">
              <Lock className="size-7" />
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
              Yêu cầu đăng nhập
            </h1>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Bạn cần đăng nhập tài khoản Nhà cung cấp để đăng dịch vụ & thiết bị cho thuê trên LiveHub.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => loginWithGoogle("/services/new")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 cursor-pointer"
              >
                <LogIn className="size-4" />
                <span>Đăng nhập với Google</span>
              </button>
              <Link
                href="/login?next=/services/new"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-xs font-semibold text-foreground hover:border-orange-500 transition-colors"
              >
                Trang đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-500">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold">
                Tên dịch vụ / Thiết bị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cho thuê Combo Sony FX3 + Lens G-Master + Bàn Switcher Blackmagic"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Danh mục dịch vụ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                >
                  <option value="equipment">Thiết bị Livestream & Quay phim</option>
                  <option value="studio">Studio & Không gian ghi hình</option>
                  <option value="crew">Ekip trọn gói & Đạo diễn</option>
                  <option value="operator">Kỹ thuật viên & Livestream Operator</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Giá thuê theo ngày (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <FormattedCurrencyInput
                  value={pricePerDay}
                  onChange={setPricePerDay}
                  placeholder="VD: 1.500.000"
                  presetAmounts={SERVICE_PRICE_PRESETS}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold">
                Địa điểm / Khu vực cung cấp <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="VD: Quận Bình Thạnh, TP. Hồ Chí Minh"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMapDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-3 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors cursor-pointer shrink-0"
                >
                  <MapPin className="size-4" />
                  <span>Chọn trên bản đồ</span>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold">
                Mô tả chi tiết thiết bị / thông số / chính sách <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả danh sách phụ kiện đi kèm (pin, thẻ nhớ, chân máy), quy định đặt cọc, thời gian giao nhận thiết bị..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Direct Image Uploader (Zero modal dialog, direct upload on submit) */}
            <DirectImageUploader
              items={imagePreviews}
              onChange={setImagePreviews}
              maxImages={6}
              label="Hình ảnh dịch vụ / thiết bị thực tế"
              description="Thêm ảnh trực tiếp từ máy (tối đa 6 ảnh, sẽ được tải lên khi nhấn Đăng)"
            />

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang tải ảnh & lưu dịch vụ..." : "Hoàn tất & Gửi duyệt dịch vụ"}
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
