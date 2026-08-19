"use client";

import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface RejectReasonDialogProps {
  open: boolean;
  title?: string | undefined;
  itemTitle?: string | null | undefined;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean | undefined;
}

const REASON_PRESETS = [
  "Hình ảnh mờ hoặc không đúng với thực tế",
  "Thông tin mô tả chưa đầy đủ, cần bổ sung chi tiết",
  "Mức giá hoặc ngân sách không hợp lý",
  "Thông tin liên hệ hoặc địa điểm không chính xác",
  "Nội dung vi phạm quy định cộng đồng LiveHub",
];

export function RejectReasonDialog({
  open,
  title = "Từ chối phê duyệt",
  itemTitle,
  onClose,
  onConfirm,
  loading = false,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do từ chối.");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Gửi phản hồi để người đăng biết lý do và chỉnh sửa lại
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {itemTitle && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200/70">
            Bài đăng: <strong className="text-slate-900">{itemTitle}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Lý do từ chối *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập lý do chi tiết để thông báo cho người đăng..."
              className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs transition-colors"
            />
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-1.5">
              Gợi ý lý do phổ biến:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REASON_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
