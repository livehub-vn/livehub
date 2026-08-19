"use client";

import { DirectImageUploader, type PreviewItem } from "@/components/direct-image-uploader";
import { LocationPickerDialog } from "@/components/location-picker-dialog";
import { AuroraText } from "@/components/ui/aurora-text";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { uploadPendingImages } from "@/lib/storage-helper";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DEMAND_BUDGET_PRESETS = [3000000, 5000000, 10000000, 20000000, 50000000];

export default function PostNewDemandPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("5000000");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreviews, setImagePreviews] = useState<PreviewItem[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/demands/new");
      }
    }
    checkAuth();
  }, [router]);

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

    try {
      // 1. Upload any pending local image files to Supabase Storage
      const uploadedUrls = await uploadPendingImages(imagePreviews, "demands");

      // 2. Insert demand record into database with automatic schema fallback
      let { data: newDemand, error } = await supabase
        .from("demands")
        .insert({
          customer_id: user.id,
          title,
          budget: budgetVal,
          location,
          event_date: eventDate,
          description,
          images: uploadedUrls,
          requirements: { images: uploadedUrls },
          status: "pending",
        })
        .select()
        .single();

      // If remote Supabase lacks 'images' column in schema cache, fallback to storing in requirements JSONB
      if (error && (error.message?.includes("images") || error.code === "PGRST204")) {
        const fallback = await supabase
          .from("demands")
          .insert({
            customer_id: user.id,
            title,
            budget: budgetVal,
            location,
            event_date: eventDate,
            description,
            requirements: { images: uploadedUrls },
            status: "pending",
          })
          .select()
          .single();

        newDemand = fallback.data;
        error = fallback.error;
      }

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else if (newDemand) {
        router.push(`/demands/${newDemand.id}`);
      } else {
        router.push("/demands");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi khi tạo nhu cầu.");
      setLoading(false);
    }
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
            Sau khi đăng, bạn sẽ được chuyển ngay đến trang chi tiết nhu cầu để quản lý, chỉnh sửa và nhận báo giá từ các nhà cung cấp.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-500">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold">
                Tiêu đề nhu cầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Cần thuê Ekip 3 máy quay 4K livestream giải chạy Marathon"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Ngân sách dự kiến (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <FormattedCurrencyInput
                  value={budget}
                  onChange={setBudget}
                  placeholder="VD: 5.000.000"
                  presetAmounts={DEMAND_BUDGET_PRESETS}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Địa điểm thực hiện <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="VD: Quận 1, TP. Hồ Chí Minh"
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
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold">
                Ngày dự kiến diễn ra
              </label>
              <DateRangePicker
                value={eventDate}
                onChange={setEventDate}
                placeholder="Chọn ngày hoặc khoảng thời gian tổ chức..."
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold">
                Mô tả chi tiết & Yêu cầu kỹ thuật <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả cụ thể thời gian, kịch bản, số lượng camera cần thiết, yêu cầu bàn switcher hoặc đường truyền..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Direct Image Uploader (Zero modal dialog, direct upload on submit) */}
            <DirectImageUploader
              items={imagePreviews}
              onChange={setImagePreviews}
              maxImages={6}
              label="Hình ảnh tham khảo / Kịch bản"
              description="Thêm ảnh hoặc sơ đồ sân khấu trực tiếp từ thiết bị (ảnh sẽ được lưu khi bấm Đăng)"
            />

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang tải ảnh & đăng nhu cầu..." : "Hoàn tất & Chuyển tới trang chi tiết nhu cầu"}
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
