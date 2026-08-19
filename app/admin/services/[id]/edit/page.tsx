"use client";

import { DirectImageUploader, type PreviewItem } from "@/components/direct-image-uploader";
import { LocationPickerDialog } from "@/components/location-picker-dialog";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import { SEED_SERVICES } from "@/lib/mock-data";
import { uploadPendingImages } from "@/lib/storage-helper";
import type { ListingStatus, Service, ServiceCategory } from "@/lib/types/database";
import { AlertCircle, ArrowLeft, Check, MapPin, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminEditServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ServiceCategory>("equipment");
  const [pricePerDay, setPricePerDay] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ListingStatus>("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [imagePreviews, setImagePreviews] = useState<PreviewItem[]>([]);
  const [providerName, setProviderName] = useState("");
  const [providerEmail, setProviderEmail] = useState("");

  useEffect(() => {
    if (!serviceId) return;

    async function loadService() {
      setLoading(true);
      setError(null);
      try {
        let s: Service | null = null;
        try {
          const response = await adminFetch<{ service: Service }>(`/api/admin/services/${serviceId}`);
          s = response.service;
        } catch {
          s = SEED_SERVICES.find((item) => item.id === serviceId) || null;
        }

        if (!s) {
          throw new Error("Không tìm thấy thông tin dịch vụ này.");
        }

        setTitle(s.title || "");
        setCategory(s.category || "equipment");
        setPricePerDay(s.price_per_day ? s.price_per_day.toString() : "");
        setLocation(s.location || "");
        setDescription(s.description || "");
        setStatus(s.status || "pending");
        setRejectionReason(s.rejection_reason || "");
        setProviderName(s.provider?.full_name || "Nhà cung cấp");
        setProviderEmail(s.provider?.email || "");

        // Initialize image previews with existing remote URLs
        let sImages = Array.isArray(s.images) ? s.images.filter(Boolean) : [];
        if (sImages.length === 0) {
          const fallbackCand = SEED_SERVICES.find((c) => c.id === serviceId);
          if (fallbackCand?.images && fallbackCand.images.length > 0) {
            sImages = fallbackCand.images;
          }
        }

        if (sImages.length > 0) {
          const initialItems: PreviewItem[] = sImages.map((url, idx) => ({
            id: `existing-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            previewUrl: url,
            remoteUrl: url,
          }));
          setImagePreviews(initialItems);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải thông tin dịch vụ.");
      } finally {
        setLoading(false);
      }
    }

    void loadService();
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(pricePerDay);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Đơn giá thuê theo ngày không hợp lệ.");
      return;
    }

    if (status === "rejected" && !rejectionReason.trim()) {
      setError("Vui lòng nhập lý do từ chối khi chuyển trạng thái sang Từ chối.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Upload any newly added local file images to Supabase Storage
      const finalImageUrls = await uploadPendingImages(imagePreviews, "services");

      // 2. Send PATCH request
      await adminFetch<{ service: Service }>(`/api/admin/services/${serviceId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          category,
          price_per_day: priceNum,
          location: location.trim(),
          description: description.trim(),
          images: finalImageUrls,
          status,
          rejectionReason: status === "rejected" ? rejectionReason.trim() : undefined,
        }),
      });

      router.push("/admin/services");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật dịch vụ.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 text-slate-900">
        <Skeleton className="h-6 w-48 rounded-xl" />
        <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-6 shadow-xs">
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 text-slate-900 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 transition-colors hover:text-orange-600"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại Kiểm duyệt dịch vụ</span>
        </Link>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
          Nhà cung cấp: <strong className="text-slate-900">{providerName}</strong> {providerEmail ? `(${providerEmail})` : ""}
        </span>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
        <div className="border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Chỉnh sửa dịch vụ / thiết bị
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            Cập nhật hình ảnh, thông tin giá thuê và trạng thái kiểm duyệt của bài đăng.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs font-medium"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Direct Image Uploader for editing images */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <DirectImageUploader
              items={imagePreviews}
              onChange={setImagePreviews}
              maxImages={6}
              label="Hình ảnh thực tế của dịch vụ / thiết bị"
              description="Thêm, xóa hoặc tải ảnh mới để hiển thị sắc nét trên sàn và trang chi tiết"
            />
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Tiêu đề dịch vụ / thiết bị *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Trọn bộ máy quay Sony FX3 + Lens G-Master..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-orange-500 shadow-xs transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Danh mục dịch vụ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-orange-500 shadow-xs transition-colors"
              >
                <option value="equipment">Thiết bị quay / Livestream</option>
                <option value="studio">Phòng quay Studio</option>
                <option value="crew">Nhân sự / Ekip kỹ thuật</option>
              </select>
            </div>
          </div>

          {/* Price Per Day & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Đơn giá thuê theo ngày (VNĐ) *
              </label>
              <FormattedCurrencyInput
                value={pricePerDay}
                onChange={setPricePerDay}
                placeholder="VD: 1.500.000"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Khu vực / Địa chỉ phục vụ
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="VD: Bình Thạnh, TP. Hồ Chí Minh"
                  className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-orange-500 shadow-xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMapDialogOpen(true)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 text-xs font-bold text-orange-600 hover:bg-orange-500/20 transition-colors cursor-pointer"
                >
                  <MapPin className="size-4" />
                  <span className="hidden sm:inline">Bản đồ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Mô tả chi tiết tính năng & thông số
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Liệt kê tình trạng thiết bị, phụ kiện kèm theo, thông số kỹ thuật hoặc quy trình phục vụ..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 outline-none focus:border-orange-500 shadow-xs transition-colors"
            />
          </div>

          {/* Admin Moderation Status Section */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Quyền Quản trị viên: Trạng thái kiểm duyệt
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStatus("approved")}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  status === "approved"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Check className="size-4" /> Đã duyệt (Approved)
              </button>

              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  status === "pending"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Chờ duyệt (Pending)
              </button>

              <button
                type="button"
                onClick={() => setStatus("rejected")}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  status === "rejected"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Từ chối (Rejected)
              </button>
            </div>

            {status === "rejected" && (
              <div className="pt-2 animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-rose-800 mb-1.5">
                  Lý do từ chối bài đăng *
                </label>
                <input
                  type="text"
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="VD: Thông tin thiết bị không rõ nguồn gốc hoặc hình ảnh không hợp lệ..."
                  className="h-11 w-full rounded-xl border border-rose-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-rose-500 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/admin/services"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-xs font-bold text-white shadow-md shadow-orange-500/25 hover:bg-orange-600 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save className="size-4" />
              <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      </div>

      <LocationPickerDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        onSelectLocation={(address) => setLocation(address)}
        initialLocation={location}
      />
    </div>
  );
}
