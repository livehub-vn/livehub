"use client";

import { Plus, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export interface PreviewItem {
  id: string;
  previewUrl: string;
  file?: File;
  remoteUrl?: string;
}

interface DirectImageUploaderProps {
  items: PreviewItem[];
  onChange: (items: PreviewItem[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
}

export function DirectImageUploader({
  items,
  onChange,
  maxImages = 6,
  label = "Hình ảnh thực tế",
  description = "Thêm ảnh từ máy tính hoặc điện thoại để tăng độ uy tín cho bài đăng",
}: DirectImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const newItems: PreviewItem[] = files.slice(0, maxImages - items.length).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      previewUrl: URL.createObjectURL(file),
      file,
    }));

    onChange([...items, ...newItems]);
    // Reset file input so selecting the same file again works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const item = items[index];
    if (item && item.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFilesSelected}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-foreground">
            {label} ({items.length}/{maxImages} ảnh)
          </label>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>

        {items.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Thêm ảnh</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-orange-500/50 hover:bg-muted/30 transition-all space-y-2 group"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
            <UploadCloud className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              Nhấp vào đây để chọn ảnh
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Hỗ trợ định dạng JPG, PNG, WebP (Tối đa {maxImages} ảnh)
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {items.map((item, i) => (
            <div
              key={item.id || i}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-xs"
            >
              <Image
                src={item.previewUrl || item.remoteUrl || ""}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/75 text-white hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                title="Xóa ảnh"
              >
                <Trash2 className="size-3" />
              </button>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                #{i + 1}
              </span>
            </div>
          ))}

          {items.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-border hover:border-orange-500/50 hover:bg-muted/30 text-muted-foreground hover:text-orange-500 transition-all cursor-pointer"
            >
              <Plus className="size-5" />
              <span className="text-[10px] font-semibold mt-1">Thêm ảnh</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
