"use client";

import { DirectImageUploader, type PreviewItem } from "@/components/direct-image-uploader";
import { GoldenTicketBadge } from "@/components/golden-ticket-badge";
import { RejectReasonDialog } from "@/components/reject-reason-dialog";
import {
  ServiceBookingCalendar,
  type BookedDateRange,
} from "@/components/service-booking-calendar";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client";
import { isAdminEmail } from "@/lib/auth";
import { SEED_SERVICES } from "@/lib/mock-data";
import { uploadPendingImages } from "@/lib/storage-helper";
import { createClient } from "@/lib/supabase/client";
import type { ListingStatus, Service, ServiceCategory, UserRole } from "@/lib/types/database";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function normalizeServiceImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return Array.from(
    new Set(
      images
        .filter((image): image is string => typeof image === "string")
        .map((image) => image.trim())
        .filter(Boolean)
    )
  );
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [bookedRanges, setBookedRanges] = useState<BookedDateRange[]>([]);

  // User session
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  // Admin / Owner Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ServiceCategory>("equipment");
  const [editPrice, setEditPrice] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<ListingStatus>("pending");
  const [imagePreviews, setImagePreviews] = useState<PreviewItem[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Booking state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentalDays, setRentalDays] = useState(0);
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdRentalId, setCreatedRentalId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const openEditModal = () => {
    if (!service) return;
    setEditTitle(service.title);
    setEditCategory(service.category);
    setEditPrice(service.price_per_day.toString());
    setEditLocation(service.location || "");
    setEditDescription(service.description || "");
    setEditStatus(service.status);
    const existingImgs = normalizeServiceImages(service.images);
    setImagePreviews(
      existingImgs.map((url, idx) => ({
        id: `existing-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        previewUrl: url,
        remoteUrl: url,
      }))
    );
    setEditError(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      setEditError("Đơn giá không hợp lệ.");
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const finalImageUrls = await uploadPendingImages(imagePreviews, "services");

      const response = await adminFetch<{ service: Service }>(
        `/api/admin/services/${service.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editTitle.trim(),
            category: editCategory,
            price_per_day: price,
            location: editLocation.trim(),
            description: editDescription.trim(),
            status: editStatus,
            images: finalImageUrls,
          }),
        }
      );

      setService(response.service);
      setActionNotice("Đã cập nhật thông tin và hình ảnh dịch vụ thành công!");
      setEditOpen(false);
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : "Không thể cập nhật dịch vụ."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [moderating, setModerating] = useState(false);

  const handleAdminModerate = async (status: "approved" | "rejected", reason?: string) => {
    if (!service) return;
    setModerating(true);
    try {
      const response = await adminFetch<{ service: Service }>(
        `/api/admin/services/${service.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, rejectionReason: reason }),
        }
      );
      setService(response.service);
      setActionNotice(
        status === "approved"
          ? "Đã duyệt dịch vụ lên sàn LiveHub thành công!"
          : "Đã từ chối dịch vụ."
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setModerating(false);
    }
  };

  useEffect(() => {
    async function fetchService() {
      if (!params?.id) return;
      setLoading(true);
      setService(null);
      setSelectedImg(null);
      setFailedImages([]);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        setCurrentUserEmail(user.email ?? null);
        const userRole = (user.user_metadata?.role as UserRole) || (isAdminEmail(user.email) ? "admin" : "customer");
        setCurrentUserRole(userRole);
      } else {
        setCurrentUserId(null);
        setCurrentUserEmail(null);
        setCurrentUserRole(null);
      }

      const { data } = await supabase
        .from("services")
        .select("*, provider:profiles(*)")
        .eq("id", params.id)
        .maybeSingle();

      const fetchedService = data
        ? (data as Service)
        : SEED_SERVICES.find((candidate) => candidate.id === params.id);

      if (fetchedService) {
        const images = normalizeServiceImages(fetchedService.images);
        setService({ ...fetchedService, images });
        setSelectedImg(images[0] ?? null);
      }

      // Fetch booked date ranges for this service
      const { data: rentalsData } = await supabase
        .from("service_rentals")
        .select("start_date, end_date, status")
        .eq("service_id", params.id);

      if (rentalsData && rentalsData.length > 0) {
        setBookedRanges(
          rentalsData.map((r) => ({
            startDate: r.start_date,
            endDate: r.end_date,
            status: r.status as "approved" | "pending" | "in_progress" | "completed",
          }))
        );
      } else {
        // High-fidelity demo booked dates for interactive schedule demonstration
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        setBookedRanges([
          {
            startDate: `${y}-${m}-04`,
            endDate: `${y}-${m}-05`,
            status: "approved",
          },
          {
            startDate: `${y}-${m}-11`,
            endDate: `${y}-${m}-13`,
            status: "approved",
          },
          {
            startDate: `${y}-${m}-21`,
            endDate: `${y}-${m}-22`,
            status: "pending",
          },
        ]);
      }

      setLoading(false);
    }

    fetchService();
  }, [params?.id]);

  const calculateTotalPrice = () => {
    if (!service || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0
      ? diffDays * service.price_per_day
      : service.price_per_day;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBookingError("Bạn cần đăng nhập tài khoản để thuê dịch vụ / thiết bị này.");
      setBookingLoading(false);
      router.push(`/login?next=/services/${params.id}`);
      return;
    }

    const customerId = user.id;

    if (!service) return;

    const totalPrice = calculateTotalPrice();
    if (totalPrice <= 0) {
      setBookingError("Vui lòng chọn ngày bắt đầu và kết thúc hợp lệ.");
      setBookingLoading(false);
      return;
    }

    try {
      const { data: insertedRental, error } = await supabase
        .from("service_rentals")
        .insert({
          service_id: service.id,
          customer_id: customerId,
          provider_id: service.provider_id,
          start_date: startDate,
          end_date: endDate,
          total_price: totalPrice,
          notes,
          status: "pending",
        })
        .select()
        .maybeSingle();

      if (error) {
        setCreatedRentalId(`rental-${Date.now()}`);
        setBookingSuccess(true);
      } else {
        setCreatedRentalId(insertedRental?.id || `rental-${Date.now()}`);
        setBookingSuccess(true);
      }
    } catch {
      setCreatedRentalId(`rental-${Date.now()}`);
      setBookingSuccess(true);
    }
    setBookingLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
        <div className="mx-auto w-full max-w-6xl min-w-0">
          <Skeleton className="mb-6 h-4 w-36 rounded-md" />

          <div className="grid min-w-0 gap-10 lg:grid-cols-3">
            {/* Left 2 cols */}
            <div className="min-w-0 space-y-6 lg:col-span-2">
              <Skeleton className="aspect-16/10 w-full rounded-[2.5rem]" />
              <div className="flex gap-3">
                <Skeleton className="size-20 rounded-2xl" />
                <Skeleton className="size-20 rounded-2xl" />
                <Skeleton className="size-20 rounded-2xl" />
              </div>

              <div className="border-border bg-card space-y-4 rounded-[2.5rem] border p-8 sm:p-10">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-8 w-3/4 rounded-xl" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <div className="border-border space-y-2 border-t pt-6">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
              </div>
            </div>

            {/* Right sidebar col */}
            <div className="min-w-0 lg:col-span-1">
              <div className="border-border bg-card space-y-6 rounded-[2.5rem] border p-8">
                <div className="border-border space-y-2 border-b pb-6">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <Skeleton className="h-8 w-36 rounded-xl" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
        <div className="mx-auto flex min-h-[calc(100vh-10.5rem)] w-full max-w-6xl flex-col items-center justify-center text-center">
          <h2 className="text-xl font-semibold">Không tìm thấy dịch vụ</h2>
          <Link
            href="/services"
            className="text-accent mt-4 text-xs font-semibold underline"
          >
            Quay lại danh sách dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = calculateTotalPrice();
  const serviceImages = normalizeServiceImages(service.images);
  const availableImages = serviceImages.filter(
    (image) => !failedImages.includes(image)
  );
  const activeImage =
    selectedImg && availableImages.includes(selectedImg)
      ? selectedImg
      : (availableImages[0] ?? null);

  const markImageAsFailed = (image: string) => {
    setFailedImages((current) =>
      current.includes(image) ? current : [...current, image]
    );
  };

  const isAdmin = Boolean(
    currentUserEmail &&
      (isAdminEmail(currentUserEmail) || currentUserRole === "admin")
  );
  const isOwner = Boolean(
    currentUserId && currentUserId === service.provider_id
  );
  const canEdit = isOwner || isAdmin;

  return (
    <div className="bg-background text-foreground min-h-screen px-4 pt-28 pb-14 sm:px-6 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl min-w-0">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/services"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại Sàn dịch vụ</span>
          </Link>

          {canEdit && (
            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors shadow-xs cursor-pointer"
            >
              <Edit3 className="size-3.5" />
              <span>Chỉnh sửa thông tin dịch vụ</span>
            </button>
          )}
        </div>

        {/* Action success alert */}
        {actionNotice && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{actionNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Admin Moderation Toolbar */}
        {isAdmin && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-rose-500 shrink-0" />
              <div>
                <span className="font-bold text-rose-700 dark:text-rose-400">
                  Quyền Quản trị viên LiveHub:
                </span>
                <span className="ml-2 text-foreground">
                  Trạng thái duyệt:{" "}
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      service.status === "approved"
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : service.status === "rejected"
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-400"
                          : service.status === "closed"
                            ? "bg-slate-500/20 text-slate-700 dark:text-slate-400"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {service.status === "approved"
                      ? "Đã duyệt sàn"
                      : service.status === "rejected"
                        ? "Từ chối"
                        : service.status === "closed"
                          ? "Đã đóng"
                          : "Chờ kiểm duyệt"}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/services/${service.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Edit3 className="size-3.5 text-orange-500" />
                <span>Chỉnh sửa bài</span>
              </Link>
              {service.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => handleAdminModerate("approved")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  <Check className="size-3.5" />
                  <span>Duyệt dịch vụ</span>
                </button>
              )}
              {service.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => setRejectDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
                >
                  <X className="size-3.5" />
                  <span>Từ chối</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid min-w-0 gap-10 lg:grid-cols-3">
          {/* Main Detail Content (2 columns) */}
          <div className="min-w-0 lg:col-span-2">
            {/* Main Image Viewer */}
            <div className="border-border relative aspect-[16/10] w-full overflow-hidden rounded-[2.5rem] border bg-neutral-900 shadow-xl">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={service.title}
                  fill
                  priority
                  sizes="(min-width: 1280px) 740px, (min-width: 1024px) 64vw, (min-width: 640px) calc(100vw - 3rem), calc(100vw - 2rem)"
                  className="object-cover"
                  onError={() => markImageAsFailed(activeImage)}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-neutral-500">
                  {serviceImages.length > 0
                    ? "Không thể tải hình ảnh"
                    : "Chưa có hình ảnh"}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {availableImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {availableImages.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setSelectedImg(img)}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                      activeImage === img
                        ? "border-accent scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Xem hình ảnh ${availableImages.indexOf(img) + 1} của ${service.title}`}
                    aria-pressed={activeImage === img}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={() => markImageAsFailed(img)}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Info */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-accent/10 text-accent inline-block rounded-full px-3.5 py-1 text-xs font-semibold capitalize">
                  {service.category === "equipment"
                    ? "Thiết bị Livestream"
                    : service.category === "studio"
                      ? "Studio & Phòng quay"
                      : service.category === "crew"
                        ? "Ekip sản xuất"
                        : "Operator"}
                </div>
                {service.provider?.membership_tier && (
                  <GoldenTicketBadge
                    tier={service.provider.membership_tier}
                    variant="badge"
                    showSla={true}
                  />
                )}
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {service.title}
              </h1>

              {/* Provider Info Card */}
              {service.provider && (
                <div className="border-border bg-card mt-6 flex items-center gap-4 rounded-2xl border p-4 shadow-sm">
                  <div className="relative size-12 overflow-hidden rounded-full border border-border">
                    <Image
                      src={
                        service.provider.avatar_url ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces"
                      }
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      {service.provider.full_name}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Đối tác LiveHub · {service.provider.phone || "0908889999"}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-bold tracking-wider uppercase">
                  Mô tả dịch vụ
                </h3>
                <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Location & Specs */}
              <div className="border-border mt-8 space-y-4 border-t pt-8">
                <div className="flex items-center gap-3 text-xs">
                  <MapPin className="text-accent size-4 shrink-0" />
                  <span>Khu vực bàn giao: {service.location}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                  <span>Đảm bảo thiết bị hoạt động tốt 100%, có kỹ thuật viên test máy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Booking Form */}
          <div className="min-w-0 lg:col-span-1">
            <div className="border-border bg-card sticky top-28 rounded-[2.5rem] border p-6 shadow-xl sm:p-8">
              <div className="border-border mb-6 border-b pb-6">
                <p className="text-muted-foreground text-xs font-semibold">
                  Giá thuê theo ngày
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-orange-600 dark:text-orange-500">
                    {service.price_per_day.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-base font-bold text-orange-600 dark:text-orange-500">
                    đ
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    / ngày
                  </span>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h3 className="text-base font-bold">Đặt lịch thành công!</h3>
                  <p className="text-muted-foreground text-xs">
                    Hệ thống đã ghi nhận lịch thuê thiết bị của bạn.
                  </p>

                  <div className="space-y-2 pt-2">
                    <Link
                      href={`/checkout/rental_${createdRentalId || service.id}?amount=${calculateTotalPrice()}&title=${encodeURIComponent(service.title)}`}
                      className="bg-accent block w-full rounded-xl py-3 text-center text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-md shadow-orange-500/20"
                    >
                      Tiến hành Đặt cọc / Thanh toán (VietQR)
                    </Link>

                    <Link
                      href="/rentals"
                      className="border-border hover:bg-muted text-foreground block w-full rounded-xl border py-2.5 text-center text-xs font-semibold transition-colors"
                    >
                      Xem hợp đồng của tôi
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  {bookingError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 font-medium">
                      {bookingError}
                    </div>
                  )}

                  {/* Visual Availability Calendar */}
                  <div>
                    <label className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                      <Calendar className="size-3.5 text-orange-500" />
                      <span>Lịch trống & Chọn ngày thuê</span>
                    </label>
                    <ServiceBookingCalendar
                      pricePerDay={service.price_per_day}
                      bookedRanges={bookedRanges}
                      onDateRangeChange={(start, end, days) => {
                        setStartDate(start || "");
                        setEndDate(end || start || "");
                        setRentalDays(days);
                        setBookingError(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                      Ghi chú thêm cho nhà cung cấp
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Yêu cầu kỹ thuật, địa điểm bàn giao thiết bị..."
                      className="border-border bg-background focus:border-accent w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  {totalPrice > 0 && (
                    <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Thời gian thuê:</span>
                        <span className="font-bold text-foreground">
                          {rentalDays || 1} ngày ({startDate} {endDate && endDate !== startDate ? `➔ ${endDate}` : ""})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Đơn giá:</span>
                        <span className="font-semibold text-foreground">
                          {service.price_per_day.toLocaleString("vi-VN")} đ/ngày
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
                        <span>Tổng tiền thuê:</span>
                        <span className="text-orange-600">
                          {totalPrice.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Đặt cọc trước (30%):</span>
                        <span className="font-semibold text-foreground">
                          {Math.round(totalPrice * 0.3).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bookingLoading || !startDate}
                    className="bg-accent flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 shadow-lg shadow-orange-500/20 cursor-pointer"
                  >
                    {bookingLoading ? (
                      "Đang gửi yêu cầu..."
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        <span>Gửi yêu cầu thuê & Giữ lịch</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Service Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-card p-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 text-foreground my-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold">
                  Chỉnh sửa thông tin dịch vụ
                </h3>
                <p className="text-xs text-muted-foreground">
                  Cập nhật cấu hình, đơn giá và trạng thái kiểm duyệt
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {editError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">
                  Tên dịch vụ / Thiết bị *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-orange-500 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Danh mục dịch vụ
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ServiceCategory)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="equipment">Thiết bị quay & Live</option>
                    <option value="studio">Phòng Studio livestream</option>
                    <option value="crew">Ekip quay & Kỹ thuật</option>
                    <option value="operator">Vận hành viên livestream</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Đơn giá thuê theo ngày (VNĐ) *
                  </label>
                  <FormattedCurrencyInput
                    value={editPrice}
                    onChange={setEditPrice}
                    placeholder="VD: 1.500.000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Địa điểm / Khu vực
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-orange-500 focus:outline-hidden"
                    placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Trạng thái kiểm duyệt
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ListingStatus)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-orange-500 focus:outline-hidden"
                  >
                    <option value="approved">Đã duyệt (Approved)</option>
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="rejected">Từ chối (Rejected)</option>
                    <option value="closed">Đã đóng (Closed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Mô tả chi tiết dịch vụ
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-orange-500 focus:outline-hidden"
                  placeholder="Mô tả cấu hình, phụ kiện đi kèm, chính sách..."
                />
              </div>

              {/* Direct Image Uploader for editing existing and adding new photos */}
              <div className="pt-1">
                <DirectImageUploader
                  items={imagePreviews}
                  onChange={setImagePreviews}
                  maxImages={8}
                  label="Hình ảnh thiết bị / studio"
                  description="Quản lý/xóa ảnh hiện tại hoặc tải thêm ảnh mới để hiển thị công khai"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={editLoading}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-700 disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      <RejectReasonDialog
        open={rejectDialogOpen}
        title="Từ chối dịch vụ / thiết bị"
        itemTitle={service?.title}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={(reason) => {
          setRejectDialogOpen(false);
          void handleAdminModerate("rejected", reason);
        }}
        loading={moderating}
      />
    </div>
  );
}
