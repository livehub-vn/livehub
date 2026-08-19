"use client";

import { AiSmartMatch } from "@/components/ai-smart-match";
import { GoldenTicketBadge } from "@/components/golden-ticket-badge";
import { createClient } from "@/lib/supabase/client";
import { SEED_DEMANDS } from "@/lib/mock-data";
import type { Demand, DemandApplication } from "@/lib/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DemandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const demandId = params?.id as string;

  const [demand, setDemand] = useState<Demand | null>(null);
  const [applications, setApplications] = useState<DemandApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Proposal submit state (for providers applying)
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDemand() {
      if (!demandId) return;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) setCurrentUserId(user.id);

        const { data, error } = await supabase
          .from("demands")
          .select("*, customer:profiles(*)")
          .eq("id", demandId)
          .maybeSingle();

        if (data && !error) {
          setDemand(data as Demand);
          setProposedPrice(data.budget.toString());
        } else {
          const fallback = SEED_DEMANDS.find((d) => d.id === demandId) || SEED_DEMANDS[0];
          if (fallback) {
            setDemand(fallback);
            setProposedPrice(fallback.budget.toString());
          }
        }

        // Fetch applications for this demand
        const { data: appsData } = await supabase
          .from("demand_applications")
          .select("*, provider:profiles(*)")
          .eq("demand_id", demandId)
          .order("created_at", { ascending: false });

        if (appsData && appsData.length > 0) {
          setApplications(appsData as DemandApplication[]);
        } else {
          // Realistic high-quality candidate quotes for interactive workflow
          const demoApps: DemandApplication[] = [
            {
              id: "app-001",
              demand_id: demandId,
              provider_id: "d0000001-0000-0000-0000-000000000001",
              proposed_price: 3600000,
              proposal_note: "Saigon Studio cam kết cung cấp trọn gói 2 máy quay Sony FX3 chuẩn 4K, 1 bàn trộn ATEM Mini Extreme ISO kèm 2 kỹ thuật viên trực line xuyên suốt. Đảm bảo đường truyền ổn định 100%.",
              status: "pending",
              created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
              provider: {
                id: "d0000001-0000-0000-0000-000000000001",
                email: "saigonstudio@livehub.vn",
                full_name: "Saigon Cinema & Studio Production",
                phone: "0908889999",
                avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
                bio: null,
                role: "provider",
                membership_tier: "premium",
                created_at: new Date().toISOString(),
              },
            },
            {
              id: "app-002",
              demand_id: demandId,
              provider_id: "d0000001-0000-0000-0000-000000000002",
              proposed_price: 3200000,
              proposal_note: "Hanoi Stream Tech cung cấp hệ thống âm thanh không dây Rode Wireless PRO 32-bit float, dàn đèn Nanlite FS-300B và kỹ thuật viên livestream tối ưu màu sắc da chuyên nghiệp.",
              status: "pending",
              created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
              provider: {
                id: "d0000001-0000-0000-0000-000000000002",
                email: "hanoilive@livehub.vn",
                full_name: "Hanoi Stream Tech & Media",
                phone: "0912334455",
                avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
                bio: null,
                role: "provider",
                membership_tier: "standard",
                created_at: new Date().toISOString(),
              },
            },
          ];
          setApplications(demoApps);
        }
      } catch {
        const fallback = SEED_DEMANDS.find((d) => d.id === demandId) || SEED_DEMANDS[0];
        if (fallback) {
          setDemand(fallback);
          setProposedPrice(fallback.budget.toString());
        }
      }
      setLoading(false);
    }

    fetchDemand();
  }, [demandId]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demand) return;

    setApplyLoading(true);
    setApplyError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      setApplyError("Giá báo giá không hợp lệ");
      setApplyLoading(false);
      return;
    }

    const { error } = await supabase.from("demand_applications").insert({
      demand_id: demand.id,
      provider_id: user.id,
      proposed_price: price,
      proposal_note: proposalNote,
      status: "pending",
    });

    if (error) {
      setApplyError(error.message);
    } else {
      setApplySuccess(true);
    }
    setApplyLoading(false);
  };

  const handleAcceptProposal = async (appId: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp || !demand) return;

    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "approved" } : a))
    );
    setDemand((prev) => (prev ? { ...prev, status: "closed" } : null));

    const supabase = createClient();
    await supabase
      .from("demand_applications")
      .update({ status: "approved" })
      .eq("id", appId);

    await supabase
      .from("demands")
      .update({ status: "closed" })
      .eq("id", demand.id);

    setActionSuccessMsg(
      `Đã chấp nhận báo giá từ "${targetApp.provider?.full_name || "Đối tác"}"! Hợp đồng dự án đang được khởi tạo.`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-40 w-full rounded-[2.5rem]" />
          <div className="grid gap-8 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-[2.5rem] lg:col-span-2" />
            <Skeleton className="h-96 rounded-[2.5rem] lg:col-span-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <h2 className="text-xl font-bold">Không tìm thấy nhu cầu dự án</h2>
        <Link href="/demands" className="mt-4 text-xs font-semibold text-orange-500 underline">
          Quay lại danh sách nhu cầu
        </Link>
      </div>
    );
  }

  const isOwner = currentUserId === demand.customer_id;
  const isClosed = demand.status === "closed";
  const stepIndex = isClosed ? 3 : applications.length > 0 ? 2 : 1;

  return (
    <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/demands"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại Sàn nhu cầu</span>
          </Link>

          {isOwner && (
            <Link
              href="/demands/my"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
            >
              <Users className="size-3.5 text-orange-500" />
              <span>Quản lý dự án của tôi</span>
            </Link>
          )}
        </div>

        {/* 1. PROJECT PROGRESS TRACKER */}
        <div className="border-border bg-card rounded-[2.5rem] border p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase">
                Tiến trình dự án Livestream
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {demand.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-3.5 py-1 text-xs font-bold ${
                  demand.status === "approved"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : demand.status === "closed"
                      ? "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {demand.status === "approved"
                  ? "Đang mở ứng tuyển"
                  : demand.status === "closed"
                    ? "Đã chọn đối tác"
                    : "Chờ duyệt"}
              </span>
            </div>
          </div>

          {/* 4-Step Progress Visual */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { title: "1. Đăng tuyển & Phê duyệt", desc: "LiveHub xác thực yêu cầu", done: stepIndex >= 1 },
              { title: "2. Nhận báo giá & Review", desc: `${applications.length} nhà cung cấp ứng tuyển`, done: stepIndex >= 2 },
              { title: "3. Chọn đối tác & Cọc Escrow", desc: "Tạo hợp đồng bảo đảm an toàn", done: stepIndex >= 3 },
              { title: "4. Triển khai & Nghiệm thu", desc: "Hoàn tất buổi livestream", done: stepIndex >= 4 },
            ].map((st, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border p-4 transition-all ${
                  st.done
                    ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                    : "border-border bg-muted/20 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                      st.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {st.done ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-bold">{st.title}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* 2. AI SMART MATCH ENGINE (Automated recommendations) */}
        <AiSmartMatch demand={demand} />

        {/* 3. MAIN DETAILS & PROPOSALS HUB GRID */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Demand Specs (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              {/* Multiple Images Gallery */}
              {demand.images && demand.images.length > 0 && (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-md">
                    <Image
                      src={demand.images[0]!}
                      alt={demand.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {demand.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-3">
                      {demand.images.slice(1).map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-xs"
                        >
                          <Image
                            src={img}
                            alt=""
                            fill
                            className="object-cover transition-transform hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Meta information */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-y border-border py-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-orange-500" />
                  Địa điểm: <strong>{demand.location}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4 text-amber-500" />
                  Ngày diễn ra: <strong>{new Date(demand.event_date).toLocaleDateString("vi-VN")}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <span>Bảo đảm thanh toán Escrow 100%</span>
                </span>
              </div>

              {/* Detailed Description */}
              <div>
                <h3 className="text-base font-bold text-foreground">Yêu cầu chi tiết từ khách hàng</h3>
                <p className="mt-3 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {demand.description}
                </p>
              </div>

              {/* Technical Specifications */}
              {demand.requirements && (
                <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">
                    Tiêu chuẩn & Yêu cầu kỹ thuật dự án
                  </h4>
                  <dl className="grid gap-3 sm:grid-cols-2 text-xs">
                    {Object.entries(demand.requirements).map(([key, val]) => (
                      <div key={key} className="rounded-xl border border-border bg-card p-3">
                        <dt className="text-muted-foreground font-medium text-[11px]">{key}</dt>
                        <dd className="mt-1 font-bold text-foreground">{String(val)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Customer Profile Box */}
              {demand.customer && (
                <div className="rounded-2xl border border-border bg-muted/40 p-5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Thông tin người đăng bài
                  </span>
                  <div className="mt-3 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 font-bold text-sm">
                        {demand.customer.full_name?.[0] || "C"}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-foreground">{demand.customer.full_name}</h5>
                        <p className="text-xs text-muted-foreground">{demand.customer.email}</p>
                      </div>
                    </div>
                    {demand.customer.membership_tier && (
                      <GoldenTicketBadge
                        tier={demand.customer.membership_tier}
                        variant="admin-tag"
                        showSla={true}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. PROPOSALS HUB (DANH SÁCH BÁO GIÁ ỨNG TUYỂN CHUYÊN NGHIỆP) */}
            <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Danh sách báo giá từ nhà cung cấp ({applications.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Xem báo giá, hồ sơ năng lực và duyệt đối tác thực hiện dự án
                    </p>
                  </div>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
                  <Clock className="mx-auto size-8 text-muted-foreground/50" />
                  <p className="font-semibold text-foreground">Chưa có báo giá ứng tuyển nào</p>
                  <p>Hệ thống AI đang gửi thông báo tới các đối tác phù hợp tại khu vực của bạn.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="group rounded-3xl border border-border bg-muted/20 p-5 transition-all hover:border-orange-500/40 hover:shadow-md space-y-4"
                    >
                      {/* Provider Header & Proposed Price */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500 text-white font-bold text-sm shadow-xs">
                            {app.provider?.full_name?.[0] || "P"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-foreground">
                                {app.provider?.full_name || "Nhà cung cấp đối tác"}
                              </h4>
                              {app.provider?.membership_tier && (
                                <GoldenTicketBadge
                                  tier={app.provider.membership_tier}
                                  variant="badge"
                                />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {app.provider?.email} • SĐT: {app.provider?.phone || "090 ••• ••••"}
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span className="text-[10px] text-muted-foreground block font-medium">
                            Báo giá đề xuất
                          </span>
                          <p className="text-base font-bold text-orange-600">
                            {Number(app.proposed_price).toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                      </div>

                      {/* Proposal Note */}
                      <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Phương án kỹ thuật & Cam kết
                        </span>
                        <p className="leading-relaxed text-foreground">
                          {app.proposal_note}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-border/60 -mx-5 -mb-5 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5 bg-card rounded-b-3xl">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          <span>Gửi {new Date(app.created_at).toLocaleDateString("vi-VN")}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {app.status === "approved" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <Check className="size-3.5" />
                              <span>Đã chọn đối tác này</span>
                            </span>
                          ) : (
                            <>
                              <a
                                href={`tel:${app.provider?.phone || "0908889999"}`}
                                className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                              >
                                <Phone className="size-3.5 text-orange-500" />
                                <span>Liên hệ</span>
                              </a>

                              <button
                                type="button"
                                onClick={() => handleAcceptProposal(app.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                              >
                                <Check className="size-3.5" />
                                <span>Chấp nhận & Ký cọc Escrow</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Apply Form for Providers */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border pb-5">
                <span className="text-xs text-muted-foreground">Ngân sách dự kiến của khách</span>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-orange-600">
                  {Number(demand.budget).toLocaleString("vi-VN")} đ
                </p>
              </div>

              {applySuccess ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center shadow-sm space-y-3">
                  <CheckCircle2 className="mx-auto size-11 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                    Nộp báo giá thành công!
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hồ sơ năng lực và báo giá của bạn đã được gửi trực tiếp tới khách hàng.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Send className="size-4 text-orange-500" />
                    <h4 className="text-sm font-bold text-foreground">Nộp báo giá ứng tuyển</h4>
                  </div>

                  {applyError && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-500">
                      {applyError}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Báo giá đề xuất (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Giải pháp kỹ thuật & Cam kết
                    </label>
                    <textarea
                      rows={4}
                      value={proposalNote}
                      onChange={(e) => setProposalNote(e.target.value)}
                      placeholder="Nêu rõ loại máy quay, bàn trộn, đường truyền mạng và số lượng nhân sự trực line..."
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-orange-500 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={applyLoading || isClosed}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="size-3.5" />
                    <span>{applyLoading ? "Đang gửi báo giá..." : isClosed ? "Dự án đã đóng" : "Gửi báo giá ngay"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
