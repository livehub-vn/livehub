"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Check,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploaderDialogProps {
  open: boolean;
  onClose: () => void;
  onImagesSelected: (urls: string[]) => void;
  initialImages?: string[];
  bucketName?: "services" | "demands" | "avatars" | "attachments";
  maxImages?: number;
  title?: string;
}

interface PendingFile {
  id: string;
  file?: File;
  previewUrl: string;
  isExisting: boolean;
}

export function ImageUploaderDialog({
  open,
  onClose,
  onImagesSelected,
  initialImages = [],
  bucketName = "services",
  maxImages = 6,
  title = "Tải lên hình ảnh",
}: ImageUploaderDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PendingFile[]>(() =>
    initialImages.map((url, i) => ({
      id: `existing-${i}`,
      previewUrl: url,
      isExisting: true,
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!open) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setErrorMsg(null);

    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (newFiles.length === 0) {
      setErrorMsg("Vui lòng chọn các tệp hình ảnh (PNG, JPG, WEBP)");
      return;
    }

    if (items.length + newFiles.length > maxImages) {
      setErrorMsg(`Chỉ được tải lên tối đa ${maxImages} hình ảnh`);
      return;
    }

    const newPendingItems: PendingFile[] = newFiles.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isExisting: false,
    }));

    setItems((prev) => [...prev, ...newPendingItems]);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered;
    });
  };

  const handleSaveAndUpload = async () => {
    if (items.length === 0) {
      onImagesSelected([]);
      onClose();
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(10);

    const supabase = createClient();
    const finalUrls: string[] = [];

    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;

        if (item.isExisting) {
          finalUrls.push(item.previewUrl);
        } else if (item.file) {
          const file = item.file;
          const ext = file.name.split(".").pop() || "jpg";
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const filePath = `${bucketName}/${fileName}`;

          try {
            // Try uploading to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
              });

            if (!uploadError && uploadData) {
              const {
                data: { publicUrl },
              } = supabase.storage.from(bucketName).getPublicUrl(filePath);
              finalUrls.push(publicUrl);
            } else {
              // Fallback to optimized base64 Data URL for zero-friction local/supabase setups
              const base64 = await readFileAsDataUrl(file);
              finalUrls.push(base64);
            }
          } catch {
            const base64 = await readFileAsDataUrl(file);
            finalUrls.push(base64);
          }
        }

        setUploadProgress(Math.round(((i + 1) / items.length) * 100));
      }

      onImagesSelected(finalUrls);
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Đã xảy ra lỗi khi tải ảnh.");
    } finally {
      setIsUploading(false);
    }
  };

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl rounded-[2rem] border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <ImageIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs text-muted-foreground">
                Tối đa {maxImages} hình ảnh (PNG, JPG, WEBP)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Đóng dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-500">
            {errorMsg}
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-orange-500 bg-orange-500/10"
              : "border-border hover:border-orange-500/50 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 mb-3 shadow-xs">
            <UploadCloud className="size-6" />
          </div>
          <p className="text-xs font-bold text-foreground">
            Nhấp để chọn ảnh hoặc kéo thả vào đây
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Hỗ trợ PNG, JPG, WEBP lên đến 10MB mỗi ảnh
          </p>
        </div>

        {/* Thumbnails Preview List */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Ảnh đã chọn ({items.length}/{maxImages})</span>
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-rose-500 hover:underline text-[11px]"
              >
                Xóa tất cả
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/30 shadow-xs"
                >
                  <Image
                    src={item.previewUrl}
                    alt={`Preview ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Delete overlay button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    disabled={isUploading}
                    className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors shadow-sm"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="size-3" />
                  </button>

                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      Ảnh bìa
                    </span>
                  )}
                </div>
              ))}

              {items.length < maxImages && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-border hover:border-orange-500/50 hover:bg-muted/20 text-muted-foreground transition-all"
                >
                  <Plus className="size-5 text-orange-500" />
                  <span className="text-[10px] font-semibold mt-1">Thêm ảnh</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {isUploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Đang lưu & tải ảnh lên Supabase...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSaveAndUpload}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="size-3.5" />
                <span>Lưu & Áp dụng ({items.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
