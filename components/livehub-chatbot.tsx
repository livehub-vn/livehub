"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Bot,
  ChevronDown,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  actionLink?: { label: string; href: string } | undefined;
}

const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ["thuê", "thiết bị", "quy trình", "đặt cọc", "máy quay"],
    reply:
      "Để thuê thiết bị trên LiveHub: Bạn chỉ cần vào mục Sàn Dịch Vụ -> Chọn thiết bị mong muốn -> Chọn ngày thuê -> Bấm 'Gửi yêu cầu thuê' và thanh toán đặt cọc an toàn qua Real VietQR. Số tiền cọc được LiveHub bảo đảm 100% cho đến khi bàn giao xong.",
    actionLink: { label: "Xem Sàn Dịch Vụ", href: "/services" },
  },
  {
    keywords: ["gói", "thành viên", "basic", "standard", "premium", "dùng thử", "60 ngày"],
    reply:
      "Tất cả tài khoản mới đều được tặng 02 tháng (60 ngày) dùng thử miễn phí toàn bộ tính năng. LiveHub có 3 gói thành viên chính thức: Basic (199k/tháng), Standard (499k/tháng - phổ biến nhất), và Premium (999k/tháng - VIP Pro không giới hạn bài đăng & ưu tiên hiển thị).",
    actionLink: { label: "Xem Bảng Giá Gói", href: "/pricing" },
  },
  {
    keywords: ["trọn gói", "dịch vụ trọn gói", "talkshow", "bán hàng", "sự kiện", "concert"],
    reply:
      "LiveHub cung cấp 3 gói Dịch Vụ Livestream Trọn Gói chuẩn chỉnh từ A-Z: Gói E-commerce Bán hàng (1-2 máy), Gói Talkshow/Hội thảo Doanh nghiệp (2-3 máy FX3/FX6 + ATEM ISO), và Gói Sự kiện Mega Event (4-6 máy + Crane + Starlink backup).",
    actionLink: { label: "Xem Dịch Vụ Trọn Gói", href: "/packages" },
  },
  {
    keywords: ["thanh toán", "vietqr", "vnpay", "momo", "hoàn tiền", "chuyển khoản"],
    reply:
      "Hệ thống hỗ trợ thanh toán Real VietQR động tự động điền đúng số tiền và cú pháp giao dịch. Bạn cũng có thể thanh toán qua VNPay, MoMo, ZaloPay hoặc Thẻ Quốc tế Visa/MasterCard. Sau khi chuyển khoản, bạn sẽ nhận được biên lai điện tử ngay lập tức.",
  },
  {
    keywords: ["đăng bài", "tạo dịch vụ", "đăng nhu cầu", "nhận dự án"],
    reply:
      "Để đăng bài: Bạn hãy bấm 'Đăng dịch vụ' (nếu là nhà cung cấp) hoặc 'Đăng nhu cầu' (nếu là khách hàng tìm kiếm ekip). Bài đăng sẽ được ban quản trị duyệt trong vòng 15-30 phút.",
    actionLink: { label: "Đăng Dịch Vụ Mới", href: "/services/new" },
  },
];

export function LiveHubChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Xin chào! Tôi là Trợ lý AI LiveHub 24/7. Tôi có thể hỗ trợ bạn tìm kiếm thiết bị, tư vấn gói thành viên hoặc tra cứu đơn hàng nhanh chóng.",
      timestamp: "Vừa xong",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [showPromptTooltip, setShowPromptTooltip] = useState(false);
  const [typedText, setTypedText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll detection to trigger 3-ping animation and typing question tooltip
  useEffect(() => {
    let triggered = false;
    const handleScroll = () => {
      if (triggered || hasScrolled || isOpen) return;
      if (window.scrollY > 120) {
        triggered = true;
        setHasScrolled(true);
        setIsPinging(true);
        setShowPromptTooltip(true);

        // Stop pinging after 3 waves (~4.5s)
        setTimeout(() => {
          setIsPinging(false);
        }, 4500);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasScrolled, isOpen]);

  // Typing effect for the prompt question tooltip with auto-hide after 3 seconds
  useEffect(() => {
    if (!showPromptTooltip || isOpen) return;

    const fullPrompt = "Bạn cần tôi hỗ trợ gì?";
    let currentIdx = 0;
    setTypedText("");

    const typingInterval = setInterval(() => {
      if (currentIdx < fullPrompt.length) {
        setTypedText(fullPrompt.slice(0, currentIdx + 1));
        currentIdx++;
      } else {
        clearInterval(typingInterval);
        // Auto-hide tooltip 3 seconds after typing completes if not clicked
        setTimeout(() => {
          setShowPromptTooltip(false);
        }, 3000);
      }
    }, 45);

    return () => clearInterval(typingInterval);
  }, [showPromptTooltip, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowPromptTooltip(false);
    }
  }, [messages, isOpen]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // Simulate AI response logic
    setTimeout(async () => {
      const lowerQuery = query.toLowerCase();

      // Check if query is an Order Code lookup
      const orderMatch = query.match(/LH-?\d{5,8}/i);
      if (orderMatch) {
        const orderCode = orderMatch[0].toUpperCase().replace("LH", "LH-");
        try {
          const supabase = createClient();
          const { data: tx } = await supabase
            .from("transactions")
            .select("*")
            .ilike("order_code", `%${orderCode}%`)
            .maybeSingle();

          if (tx) {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                sender: "bot",
                text: `🔍 Tra cứu mã đơn [${tx.order_code}]:\n- Trạng thái: ${
                  tx.payment_status === "completed" ? "✅ Thanh toán thành công" : "⏳ Đang xử lý"
                }\n- Số tiền: ${Number(tx.amount).toLocaleString("vi-VN")} đ\n- Phương thức: ${tx.payment_method?.toUpperCase()}\n- Thời gian: ${new Date(
                  tx.created_at
                ).toLocaleString("vi-VN")}`,
                timestamp: "Vừa xong",
                actionLink: { label: "Xem Hợp Đồng Đơn Thuê", href: "/rentals" },
              },
            ]);
            setIsTyping(false);
            return;
          }
        } catch {
          // Continue to fallback
        }
      }

      // Check keyword knowledge base
      let matchedReply: { reply: string; actionLink?: { label: string; href: string } } | null = null;

      for (const item of FAQ_KNOWLEDGE_BASE) {
        if (item.keywords.some((kw) => lowerQuery.includes(kw))) {
          matchedReply = item;
          break;
        }
      }

      if (matchedReply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: matchedReply!.reply,
            timestamp: "Vừa xong",
            actionLink: matchedReply!.actionLink,
          },
        ]);
      } else {
        // General AI Assistant answer with options
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text:
              "Cảm ơn bạn đã liên hệ. Bạn có thể chọn các tác vụ gợi ý nhanh bên dưới hoặc kết nối trực tiếp với chuyên viên kỹ thuật LiveHub qua Hotline 1900 8888 hoặc Zalo OA để được hỗ trợ tức thì!",
            timestamp: "Vừa xong",
          },
        ]);
      }

      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* 1. TYPING QUESTION TOOLTIP ON THE LEFT OF CHATBOT (Auto-hides with blur transition) */}
      <AnimatePresence>
        {!isOpen && showPromptTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, y: 6, filter: "blur(8px)" }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-6 right-20 sm:right-24 z-9990 flex items-center max-w-[260px] sm:max-w-[310px]"
          >
            <div
              onClick={() => {
                setIsOpen(true);
                setShowPromptTooltip(false);
              }}
              className="group relative cursor-pointer rounded-2xl border border-orange-500/30 bg-card/95 p-3.5 sm:py-3.5 sm:px-4.5 shadow-2xl backdrop-blur-md ring-1 ring-orange-500/20 transition-all hover:scale-102 hover:border-orange-500"
            >
              <div>
                <p className="text-xs sm:text-[13.5px] font-bold text-foreground leading-snug">
                  {typedText}
                  {/* Dash typing indicator cursor at the end */}
                  <span className="inline-block w-2.5 h-[2.5px] bg-orange-500 ml-1 mb-0.5 animate-pulse rounded-full" />
                </p>
                <span className="mt-1 block text-[11px] font-semibold text-orange-500 group-hover:underline">
                  LiveHub AI luôn sẵn sàng
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING CHATBOT BUTTON (Slightly larger on mobile for easy tap) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-9990">
          {/* Subtle Elegant Ping Aura (Gently pulses 2-3 times upon scrolling then stops) */}
          {isPinging && (
            <span className="absolute -inset-1 rounded-full bg-orange-500/25 ring-2 ring-orange-500/35 animate-pulse duration-1000 pointer-events-none" />
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setShowPromptTooltip(false);
            }}
            className="relative flex size-14 sm:size-auto sm:h-auto items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-3 sm:px-5 sm:py-3.5 text-white shadow-2xl shadow-orange-500/40 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/60 active:scale-95 cursor-pointer"
            aria-label="Mở Trợ lý AI LiveHub 24/7"
          >
            <div className="relative flex size-7 shrink-0 items-center justify-center">
              <Bot className="size-7 sm:size-6" />
              <span className="absolute -top-0.5 -right-0.5 size-3 sm:size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <span className="hidden sm:inline-block text-sm font-bold tracking-tight">
              Trợ lý AI 24/7
            </span>
          </button>
        </div>
      )}

      {/* 3. CHAT WINDOW CONTAINER (Taller height on mobile + 10% larger text) */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-9990 flex h-[82vh] max-h-[640px] w-[calc(100vw-1.5rem)] sm:w-[400px] flex-col rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-5 duration-200 overflow-hidden text-foreground">
          {/* Header - Orange Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-4.5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 items-center justify-center rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-xs shadow-xs">
                <Bot className="size-5.5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Trợ lý AI LiveHub 24/7</h4>
                <p className="text-[11px] text-orange-100 flex items-center gap-1 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Sẵn sàng giải đáp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              title="Thu nhỏ cửa sổ chat"
            >
              <ChevronDown className="size-5" />
            </button>
          </div>

          {/* Quick Action Suggestion Pills */}
          <div className="border-b border-border/70 bg-muted/40 px-3.5 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleSendMessage("Quy trình thuê thiết bị và đặt cọc như thế nào?")}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-orange-500/40 hover:text-orange-500 transition-colors cursor-pointer"
            >
              🎥 Thuê thiết bị
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Tư vấn các gói thành viên LiveHub")}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-orange-500/40 hover:text-orange-500 transition-colors cursor-pointer"
            >
              💎 Gói thành viên
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Báo giá dịch vụ livestream trọn gói")}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-orange-500/40 hover:text-orange-500 transition-colors cursor-pointer"
            >
              📦 Gói trọn gói
            </button>
          </div>

          {/* Messages List Area (10% larger text: text-[15px]) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[15px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 mt-0.5">
                    <Bot className="size-4.5" />
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-2xl p-3.5 sm:p-4 leading-relaxed space-y-2 text-[15px] ${
                    msg.sender === "user"
                      ? "bg-orange-500 text-white rounded-br-xs font-normal"
                      : "bg-muted/70 text-foreground border border-border/70 rounded-bl-xs font-normal"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed text-[15px]">{msg.text}</p>

                  {msg.actionLink && (
                    <div className="pt-1">
                      <Link
                        href={msg.actionLink.href}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-background border border-border px-3.5 py-1.5 text-xs font-bold text-orange-500 shadow-xs hover:bg-muted transition-colors"
                      >
                        <Sparkles className="size-3.5" />
                        <span>{msg.actionLink.label}</span>
                      </Link>
                    </div>
                  )}

                  <span
                    className={`block text-[11px] ${
                      msg.sender === "user" ? "text-white/70 text-right" : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs pl-10">
                <span className="size-2 rounded-full bg-orange-500 animate-bounce" />
                <span className="size-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                <span className="size-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs font-medium">Trợ lý đang phản hồi...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Hotline & Human Support Footer Bar */}
          <div className="border-t border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Cần hỗ trợ trực tiếp?</span>
            <div className="flex items-center gap-2.5">
              <a
                href="tel:19008888"
                className="inline-flex items-center gap-1 text-orange-500 hover:underline font-bold"
              >
                <Phone className="size-3.5" />
                <span>1900 8888</span>
              </a>
              <span>•</span>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className="text-sky-500 hover:underline font-bold"
              >
                Zalo OA
              </a>
            </div>
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-border p-3 sm:p-3.5 flex items-center gap-2.5 bg-card"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi hoặc mã đơn (LH-xxxxxx)..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex size-10.5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-md shadow-orange-500/25 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Gửi tin nhắn"
            >
              <Send className="size-4.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
