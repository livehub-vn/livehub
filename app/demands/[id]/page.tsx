"use client";

import { GoldenTicketBadge } from "@/components/golden-ticket-badge";
import { LocationPickerDialog } from "@/components/location-picker-dialog";
import { FormattedCurrencyInput } from "@/components/ui/formatted-currency-input";
import { Skeleton } from "@/components/ui/skeleton";
import { getDemandImages } from "@/lib/demand-helpers";
import { SEED_DEMANDS, SEED_SERVICES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Demand, DemandApplication, Service } from "@/lib/types/database";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  MapPin,
  PartyPopper,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
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
  const [recommendedServices, setRecommendedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Tab state: "proposals" | "recommendations"
  const [activeTab, setActiveTab] = useState<"proposals" | "recommendations">("proposals");

  // Proposal submit state (for providers applying)
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Owner Edit State
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editMapOpen, setEditMapOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);

  // Invited services list
  const [invitedServiceIds, setInvitedServiceIds] = useState<string[]>([]);

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
          setEditTitle(data.title);
          setEditBudget(data.budget.toString());
          setEditLocation(data.location || "");
          setEditEventDate(data.event_date || "");
          setEditDescription(data.description || "");
          setEditImages(data.images || []);
        } else {
          const fallback = SEED_DEMANDS.find((d) => d.id === demandId) || SEED_DEMANDS[0];
          if (fallback) {
            setDemand(fallback);
            setProposedPrice(fallback.budget.toString());
            setEditTitle(fallback.title);
            setEditBudget(fallback.budget.toString());
            setEditLocation(fallback.location || "");
            setEditEventDate(fallback.event_date || "");
            setEditDescription(fallback.description || "");
            setEditImages(fallback.images || []);
          }
        }

        // Fetch real matching services from Supabase
        const { data: recData } = await supabase
          .from("services")
          .select("*, provider:profiles(*)")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(8);

        if (recData && recData.length > 0) {
          setRecommendedServices(recData as Service[]);
        } else {
          setRecommendedServices(SEED_SERVICES);
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

  // Handle Edit Demand
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demand) return;
    setEditLoading(true);
    setEditError(null);

    const price = parseFloat(editBudget);
    if (isNaN(price) || price <= 0) {
      setEditError("Ngân sách dự kiến không hợp lệ");
      setEditLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("demands")
        .update({
          title: editTitle,
          budget: price,
          location: editLocation,
          event_date: editEventDate,
          description: editDescription,
          images: editImages,
        })
        .eq("id", demand.id);

      if (error) {
        throw error;
      }

      setDemand((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              budget: price,
              location: editLocation,
              event_date: editEventDate,
              description: editDescription,
              images: editImages,
            }
          : null
      );
      setEditOpen(false);
      setActionSuccessMsg("Đã cập nhật thông tin nhu cầu dự án thành công!");
    } catch (err: unknown) {
      setEditError((err as Error).message || "Không thể cập nhật nhu cầu");
    } finally {
      setEditLoading(false);
    }
  };

  // Provider submits proposal
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

    const { data: newApp, error } = await supabase
      .from("demand_applications")
      .insert({
        demand_id: demand.id,
        provider_id: user.id,
        proposed_price: price,
        proposal_note: proposalNote,
        status: "pending",
      })
      .select("*, provider:profiles(*)")
      .single();

    if (error) {
      setApplyError(error.message);
    } else {
      setApplySuccess(true);
      if (newApp) {
        setApplications((prev) => [newApp as DemandApplication, ...prev]);
      }
      setActionSuccessMsg("Nộp báo giá thành công! Khách hàng sẽ nhận được thông báo.");
    }
    setApplyLoading(false);
  };

  // Owner accepts proposal & initiates Escrow
  const handleAcceptProposal = async (appId: string) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp || !demand) return;

    // Update state: target app approved, others kept as pending/selectable
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "approved" } : { ...a, status: "pending" }))
    );
    setDemand((prev) => (prev ? { ...prev, status: "in_progress" } : null));

    const supabase = createClient();
    await supabase
      .from("demand_applications")
      .update({ status: "approved" })
      .eq("id", appId);

    await supabase
      .from("demands")
      .update({ status: "in_progress" })
      .eq("id", demand.id);

    setActionSuccessMsg(
      `Đã chọn đối tác "${targetApp.provider?.full_name || "Đối tác"}"! Tiến trình dự án đã chuyển sang giai đoạn Ký cọc Escrow & Chuẩn bị phiên live.`
    );
  };

  // Owner switches / un-selects partner before completion
  const handleSwitchPartner = async () => {
    if (!demand) return;

    setApplications((prev) => prev.map((a) => ({ ...a, status: "pending" })));
    setDemand((prev) => (prev ? { ...prev, status: "approved" } : null));

    const supabase = createClient();
    await supabase
      .from("demand_applications")
      .update({ status: "pending" })
      .eq("demand_id", demand.id);

    await supabase
      .from("demands")
      .update({ status: "approved" })
      .eq("id", demand.id);

    setActionSuccessMsg("Đã mở lại danh sách báo giá. Bạn có thể chọn lại đối tác khác phù hợp hơn.");
  };

  // Owner completes / finishes project (End-to-End completion)
  const handleCompleteProject = async () => {
    if (!demand) return;

    setDemand((prev) => (prev ? { ...prev, status: "completed" } : null));

    const supabase = createClient();
    await supabase
      .from("demands")
      .update({ status: "completed" })
      .eq("id", demand.id);

    setActionSuccessMsg("Chúc mừng! Dự án livestream đã được nghiệm thu và hoàn tất thành công. Escrow đã được giải ngân an toàn.");
  };

  // Re-open project if closed
  const handleReopenProject = async () => {
    if (!demand) return;

    setDemand((prev) => (prev ? { ...prev, status: "approved" } : null));

    const supabase = createClient();
    await supabase
      .from("demands")
      .update({ status: "approved" })
      .eq("id", demand.id);

    setActionSuccessMsg("Đã mở lại dự án để tiếp tục nhận báo giá.");
  };

  // Invite service handler
  const handleInviteService = (serviceId: string) => {
    setInvitedServiceIds((prev) => [...prev, serviceId]);
    setActionSuccessMsg("Đã gửi lời mời tham gia báo giá đến nhà cung cấp dịch vụ này.");
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
  const approvedApp = applications.find((a) => a.status === "approved");
  const isCompleted = demand.status === "completed";
  const isInProgress = demand.status === "in_progress" || Boolean(approvedApp && !isCompleted);

  // Stepper state
  let currentStep = 1;
  if (isCompleted) {
    currentStep = 4;
  } else if (isInProgress) {
    currentStep = 3;
  } else if (applications.length > 0) {
    currentStep = 2;
  }

  // Filter AI recommendations to exclude providers that already applied
  const appliedProviderIds = applications.map((a) => a.provider_id);
  const matchedServices = recommendedServices
    .filter(
      (srv) =>
        srv.provider_id !== demand.customer_id &&
        !appliedProviderIds.includes(srv.provider_id)
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background px-4 pt-28 pb-14 sm:px-6 sm:pt-32 text-foreground">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/demands"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Quay lại sàn nhu cầu</span>
          </Link>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors shadow-xs cursor-pointer"
              >
                <Edit3 className="size-3.5" />
                <span>Chỉnh sửa thông tin nhu cầu</span>
              </button>

              <Link
                href="/demands/my"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
              >
                <Users className="size-3.5 text-orange-500" />
                <span>Dự án của tôi</span>
              </Link>
            </div>
          )}
        </div>

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* 1. INTERACTIVE PROJECT PROGRESS TRACKER (Tiến trình dự án livestream) */}
        <div className="border-border bg-card rounded-[2.5rem] border p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-orange-600 dark:text-orange-400 ">
                Tiến trình dự án livestream
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {demand.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-3.5 py-1 text-xs font-bold ${
                  isCompleted
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : isInProgress
                      ? "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                }`}
              >
                {isCompleted
                  ? "✓ Đã hoàn tất & Nghiệm thu"
                  : isInProgress
                    ? "Đang chuẩn bị phiên live"
                    : "Đang nhận báo giá"}
              </span>
            </div>
          </div>

          {/* 4-Step Interactive Stepper */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              {
                step: 1,
                title: "1. Đăng tuyển & Xác thực",
                desc: "Yêu cầu kỹ thuật đã duyệt",
                done: currentStep >= 1,
                active: currentStep === 1,
              },
              {
                step: 2,
                title: "2. Nhận & Duyệt báo giá",
                desc: `${applications.length} đối tác đã nộp báo giá`,
                done: currentStep >= 2,
                active: currentStep === 2,
              },
              {
                step: 3,
                title: "3. Ký cọc & Chuẩn bị",
                desc: approvedApp ? `Đã chọn ${approvedApp.provider?.full_name}` : "Bảo đảm ký quỹ Escrow",
                done: currentStep >= 3,
                active: currentStep === 3,
              },
              {
                step: 4,
                title: "4. Lên sóng & Nghiệm thu",
                desc: isCompleted ? "Giải ngân an toàn 100%" : "Kết thúc & nghiệm thu dự án",
                done: currentStep >= 4,
                active: currentStep === 4,
              },
            ].map((st) => (
              <div
                key={st.step}
                className={`relative rounded-2xl border p-4 transition-all ${
                  st.done
                    ? "border-emerald-500/40 bg-emerald-500/5 text-foreground shadow-xs"
                    : st.active
                      ? "border-orange-500/50 bg-orange-500/5 text-foreground ring-1 ring-orange-500/30"
                      : "border-border bg-muted/20 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      st.done
                        ? "bg-emerald-500 text-white"
                        : st.active
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {st.done ? "✓" : st.step}
                  </div>
                  <span className="text-xs font-bold truncate">{st.title}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>

          {/* ACTIVE IN-PROGRESS / COMPLETION CONTROL BAR (End-to-End Actions) */}
          {isOwner && isInProgress && approvedApp && (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white font-bold text-base shadow-xs">
                    {approvedApp.provider?.full_name?.[0] || "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Đối tác đã chọn: <strong>{approvedApp.provider?.full_name}</strong>
                      </span>
                      {approvedApp.provider?.membership_tier && (
                        <GoldenTicketBadge tier={approvedApp.provider.membership_tier} variant="badge" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Báo giá đã chốt: <strong className="text-orange-600">{Number(approvedApp.proposed_price).toLocaleString("vi-VN")} đ</strong> • SĐT: {approvedApp.provider?.phone || "0908889999"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${approvedApp.provider?.phone || "0908889999"}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Phone className="size-3.5 text-orange-500" />
                    <span>Gọi điện trao đổi</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleSwitchPartner}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Hủy lựa chọn hiện tại để chọn đối tác khác"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Đổi đối tác khác</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteProject}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Check className="size-3.5" />
                    <span>Nghiệm thu & Hoàn tất dự án</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROJECT COMPLETED BANNER */}
          {isCompleted && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <PartyPopper className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Dự án livestream đã nghiệm thu & hoàn tất thành công!
                  </h4>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Toàn bộ phiên livestream đã lên sóng thuận lợi. Ký quỹ Escrow đã được thanh toán an toàn cho đối tác thực hiện.
                  </p>
                </div>
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={handleReopenProject}
                  className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  Mở lại dự án
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. MAIN DETAILS & PROPOSALS HUB GRID */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Main Demand Specs (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              {/* Multiple Images Gallery */}
              {(() => {
                const detailImages = getDemandImages(demand);
                if (detailImages.length === 0) return null;
                return (
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-md">
                      <Image
                        src={detailImages[0]!}
                        alt={demand.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {detailImages.length > 1 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {detailImages.slice(1).map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-xs hover:border-orange-500 transition-colors"
                          >
                            <Image src={img} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Meta information */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-y border-border py-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-orange-500" />
                  <span>Địa điểm:</span> <strong className="text-foreground">{demand.location}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4 text-amber-500" />
                  <span>Ngày diễn ra:</span> <strong className="text-foreground">{demand.event_date || "Chưa xác định"}</strong>
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

            {/* 3. CONSOLIDATED PROPOSALS & AI MATCHING HUB (Gộp Danh sách báo giá & Gợi ý đối tác) */}
            <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2 p-1 rounded-2xl bg-muted/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("proposals")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "proposals"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users className="size-4 text-orange-500" />
                    <span>Báo giá đã nhận ({applications.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("recommendations")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      activeTab === "recommendations"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sparkles className="size-4 text-amber-500" />
                    <span>Dịch vụ & đối tác gợi ý ({matchedServices.length})</span>
                  </button>
                </div>

                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {activeTab === "proposals"
                    ? "Duyệt hồ sơ & chốt đối tác"
                    : "Đối tác sẵn sàng nhận việc"}
                </span>
              </div>

              {/* TAB 1: PROPOSALS (BÁO GIÁ ĐÃ NHẬN) */}
              {activeTab === "proposals" && (
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
                      <Clock className="mx-auto size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-foreground">Chưa có báo giá ứng tuyển nào</p>
                      <p>Bạn có thể duyệt qua tab &quot;Dịch vụ & đối tác gợi ý&quot; để chủ động mời các nhà cung cấp uy tín.</p>
                    </div>
                  ) : (
                    applications.map((app) => {
                      const isSelectedApp = app.status === "approved";

                      return (
                        <div
                          key={app.id}
                          className={`group rounded-3xl border p-5 transition-all space-y-4 ${
                            isSelectedApp
                              ? "border-emerald-500/50 bg-emerald-500/5 shadow-md ring-1 ring-emerald-500/30"
                              : "border-border bg-muted/20 hover:border-orange-500/40 hover:shadow-md"
                          }`}
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
                                  {isSelectedApp && (
                                    <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                      Đối tác đã chọn
                                    </span>
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
                              <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                                {Number(app.proposed_price).toLocaleString("vi-VN")} đ
                              </p>
                            </div>
                          </div>

                          {/* Proposal Note */}
                          <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Phương án kỹ thuật & cam kết
                            </span>
                            <p className="leading-relaxed text-foreground whitespace-pre-line">
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
                              {app.provider?.phone && (
                                <a
                                  href={`tel:${app.provider.phone}`}
                                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <Phone className="size-3.5 text-orange-500" />
                                  <span>Gọi điện</span>
                                </a>
                              )}

                              {isOwner && (
                                <>
                                  {isSelectedApp ? (
                                    <button
                                      type="button"
                                      onClick={handleSwitchPartner}
                                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    >
                                      <RotateCcw className="size-3.5" />
                                      <span>Đổi đối tác khác</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptProposal(app.id)}
                                      disabled={isCompleted}
                                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
                                    >
                                      <Check className="size-3.5" />
                                      <span>Chấp nhận & Ký cọc Escrow</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: AI MATCHED RECOMMENDATIONS (GỢI Ý ĐỐI TÁC PHÙ HỢP) */}
              {activeTab === "recommendations" && (
                <div className="space-y-4">
                  {matchedServices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
                      <p className="font-semibold text-foreground">Tất cả đối tác phù hợp đã nộp báo giá cho dự án của bạn!</p>
                      <p>Hãy xem lại tab &quot;Báo giá đã nhận&quot; để chọn đơn vị thực hiện.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {matchedServices.map((srv) => {
                        const isInvited = invitedServiceIds.includes(srv.id);

                        return (
                          <div
                            key={srv.id}
                            className="group flex flex-col justify-between rounded-3xl border border-border bg-card p-4 transition-all duration-200 hover:border-orange-500/40 hover:shadow-md space-y-3"
                          >
                            <div>
                              {/* Thumbnail & Price */}
                              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                                {srv.images && srv.images.length > 0 ? (
                                  <Image
                                    src={srv.images[0]!}
                                    alt={srv.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                                    Chưa có ảnh
                                  </div>
                                )}

                                <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-orange-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                                  <Zap className="size-3" />
                                  <span>Phù hợp dự án</span>
                                </div>
                              </div>

                              {/* Title & Provider */}
                              <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                                    {srv.provider?.full_name || "Nhà cung cấp"}
                                  </span>
                                  {srv.provider?.membership_tier && (
                                    <GoldenTicketBadge
                                      tier={srv.provider.membership_tier}
                                      variant="badge"
                                    />
                                  )}
                                </div>

                                <h4 className="line-clamp-2 text-xs font-bold text-foreground group-hover:text-orange-500 transition-colors">
                                  {srv.title}
                                </h4>

                                <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                                  {Number(srv.price_per_day).toLocaleString("vi-VN")} đ
                                  <span className="text-[10px] font-normal text-muted-foreground">/ngày</span>
                                </p>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
                              {srv.provider?.phone ? (
                                <a
                                  href={`tel:${srv.provider.phone}`}
                                  className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                  <Phone className="size-3 text-orange-500" />
                                  <span>Gọi điện</span>
                                </a>
                              ) : (
                                <div />
                              )}

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleInviteService(srv.id)}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                    isInvited
                                      ? "bg-emerald-600 text-white"
                                      : "bg-orange-500 text-white hover:bg-orange-600"
                                  }`}
                                >
                                  {isInvited ? "✓ Đã mời" : "Mời báo giá"}
                                </button>

                                <Link
                                  href={`/services/${srv.id}`}
                                  className="flex size-7.5 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground hover:bg-muted transition-colors"
                                  title="Xem chi tiết dịch vụ"
                                >
                                  <ArrowUpRight className="size-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar (Sticky on Scroll) */}
          <div className="lg:col-span-1 sticky top-28 self-start z-20">
            <div className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
              <div className="border-b border-border pb-5">
                <span className="text-xs text-muted-foreground">Ngân sách dự kiến của dự án</span>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {Number(demand.budget).toLocaleString("vi-VN")} đ
                </p>
              </div>

              {/* If user is owner: show management controls */}
              {isOwner ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                      Bảng điều khiển người tạo
                    </span>
                    <p className="text-xs text-foreground font-semibold">
                      {isCompleted
                        ? "Dự án đã hoàn tất nghiệm thu."
                        : isInProgress
                          ? "Dự án đang trong giai đoạn triển khai."
                          : `Dự án đang nhận được ${applications.length} báo giá ứng tuyển.`}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Bạn có thể chỉnh sửa thông tin dự án bất cứ lúc nào hoặc lựa chọn đối tác phù hợp nhất.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>Chỉnh sửa thông tin nhu cầu</span>
                  </button>

                  {isInProgress && (
                    <button
                      type="button"
                      onClick={handleCompleteProject}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <Check className="size-3.5" />
                      <span>Nghiệm thu & Hoàn tất dự án</span>
                    </button>
                  )}
                </div>
              ) : applySuccess ? (
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
                    <FormattedCurrencyInput
                      value={proposedPrice}
                      onChange={setProposedPrice}
                      placeholder="VD: 3.500.000"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                      Giải pháp kỹ thuật & cam kết
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
                    disabled={applyLoading || isCompleted}
                    className="w-full rounded-xl bg-orange-500 py-3 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {applyLoading ? "Đang gửi báo giá..." : "Gửi báo giá cho khách hàng"}
                  </button>
                </form>
              )}

              {/* Escrow Guarantee Box */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <span>Bảo đảm giao dịch qua Escrow</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Toàn bộ tiền đặt cọc được giữ an toàn tại LiveHub và chỉ giải ngân cho đối tác sau khi khách hàng nghiệm thu phiên livestream thành công.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Demand Modal Dialog */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-bold">Chỉnh sửa thông tin nhu cầu</h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {editError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-500">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Tiêu đề nhu cầu</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Ngân sách (VNĐ)</label>
                  <FormattedCurrencyInput
                    value={editBudget}
                    onChange={setEditBudget}
                    placeholder="VD: 5.000.000"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Địa điểm thực hiện</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditMapOpen(true)}
                      className="inline-flex items-center gap-1 rounded-xl border border-orange-500/30 bg-orange-500/10 px-2.5 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors shrink-0 cursor-pointer"
                    >
                      <MapPin className="size-3.5" />
                      <span className="text-[11px]">Bản đồ</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Ngày dự kiến diễn ra</label>
                <input
                  type="text"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  placeholder="VD: 25/08/2026 hoặc 25/08 - 28/08/2026"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Mô tả chi tiết & Yêu cầu</label>
                <textarea
                  rows={4}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goong Map Location Picker Modal Dialog */}
      <LocationPickerDialog
        open={editMapOpen}
        onClose={() => setEditMapOpen(false)}
        initialLocation={editLocation}
        onSelectLocation={(addr) => setEditLocation(addr)}
      />
    </div>
  );
}
