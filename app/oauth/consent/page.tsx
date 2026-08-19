"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuroraText } from "@/components/ui/aurora-text";

function OAuthConsentForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const appName =
    searchParams.get("client_name") ||
    searchParams.get("client_id") ||
    "Ứng dụng bên thứ ba";

  const handleApprove = async () => {
    setLoading(true);
    const redirectUrl = searchParams.get("redirect_uri") || "/";
    window.location.href = redirectUrl;
  };

  const handleDeny = () => {
    window.location.href = "/";
  };

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/brand/livehub-mark-white.png"
          alt="LiveHub Mark"
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
        />
        <h1 className="mt-4 text-2xl font-semibold">
          Ủy quyền truy cập <AuroraText>LiveHub</AuroraText>
        </h1>
        <p className="mt-2 text-xs text-neutral-400">
          Ứng dụng <strong className="text-white">{appName}</strong> đang yêu
          cầu quyền truy cập tài khoản LiveHub của bạn.
        </p>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <h3 className="text-xs font-semibold text-orange-400">
          Quyền được yêu cầu:
        </h3>
        <ul className="space-y-2 text-xs text-neutral-300">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-emerald-400" />
            <span>Xem thông tin hồ sơ (Tên, Email, Ảnh đại diện)</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-emerald-400" />
            <span>Xem danh sách dịch vụ & nhu cầu dự án</span>
          </li>
        </ul>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleDeny}
          className="flex-1 rounded-xl border border-neutral-700 bg-neutral-800 py-3 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
        >
          Từ chối
        </button>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 rounded-xl bg-orange-500 py-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Chấp nhận ủy quyền"}
        </button>
      </div>
    </div>
  );
}

export default function OAuthConsentPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12 text-white">
      <div className="relative z-10 w-full max-w-md">
        <Suspense
          fallback={
            <div className="text-center text-xs text-neutral-400">
              Đang tải...
            </div>
          }
        >
          <OAuthConsentForm />
        </Suspense>
      </div>
    </div>
  );
}
