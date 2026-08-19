"use client";

import { ImageUploaderDialog } from "@/components/image-uploader-dialog";
import { AuroraText } from "@/components/ui/aurora-text";
import { DatePicker } from "@/components/ui/date-picker";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PostNewDemandPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");
  const [imageList, setImageList] = useState<string[]>([]);

  const handleRemoveImage = (index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
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

    const { data: newDemand, error } = await supabase
      .from("demands")
      .insert({
        customer_id: user.id,
        title,
        budget: budgetVal,
        location,
        event_date: eventDate,
        description,
        images: imageList,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else if (newDemand) {
      // Redirect straight to the created demand detail page as requested!
      router.push(`/demands/${newDemand.id}`);
    } else {
      router.push("/demands");
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
                <input
                  type="number"
                  required
                  min={100000}
                  step={50000}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="VD: 5000000"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Địa điểm thực hiện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold">
                Ngày dự kiến diễn ra
              </label>
              <DatePicker
                value={eventDate}
                onChange={(d: string) => setEventDate(d)}
                placeholder="Chọn ngày tổ chức sự kiện livestream..."
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

            {/* Premium Image Uploader Dialog Trigger */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold">
                  Hình ảnh tham khảo / Kịch bản ({imageList.length} ảnh)
                </label>
                <button
                  type="button"
                  onClick={() => setUploadDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors"
                >
                  <Upload className="size-3.5" />
                  <span>Tải ảnh lên (Không cần link)</span>
                </button>
              </div>

              {imageList.length === 0 ? (
                <div
                  onClick={() => setUploadDialogOpen(true)}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-orange-500/50 hover:bg-muted/20 transition-all space-y-2"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 shadow-xs">
                    <ImageIcon className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    Chưa có hình ảnh tham khảo
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Nhấp vào đây để mở hộp thoại tải ảnh lên trực tiếp từ thiết bị của bạn
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
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
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors shadow-sm"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="size-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                        #{i + 1}
                      </span>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setUploadDialogOpen(true)}
                    className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-border hover:border-orange-500/50 hover:bg-muted/20 text-muted-foreground transition-all"
                  >
                    <Plus className="size-5 text-orange-500" />
                    <span className="text-[10px] font-semibold mt-1">Thêm ảnh</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Đang tạo nhu cầu..." : "Hoàn tất & Chuyển tới trang chi tiết nhu cầu"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Uploader Modal Dialog */}
      <ImageUploaderDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onImagesSelected={(urls) => {
          setImageList(urls);
        }}
        initialImages={imageList}
        bucketName="demands"
        title="Tải lên hình ảnh nhu cầu dự án"
        maxImages={6}
      />
    </div>
  );
}
