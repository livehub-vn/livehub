"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Bot,
  ChevronDown,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
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

      // Check if query is an Order Code lookup (e.g., LH-123456 or contain "LH-")
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
      {/* 1. FLOATING CHATBOT BUTTON (Fixed bottom-6 right-6) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-9990 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-3.5 sm:px-5 sm:py-3.5 text-white shadow-2xl shadow-orange-500/35 transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50 active:scale-95"
          aria-label="Mở Trợ lý AI LiveHub 24/7"
        >
          <div className="relative flex size-6 shrink-0 items-center justify-center">
            <Bot className="size-6" />
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <span className="hidden sm:inline-block text-xs font-bold tracking-tight">
            Trợ lý AI 24/7
          </span>
        </button>
      )}

      {/* 2. CHAT WINDOW CONTAINER */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-9990 flex h-[540px] w-[calc(100vw-2rem)] sm:w-[380px] flex-col rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-5 duration-200 overflow-hidden">
          {/* Header - Orange Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 p-4.5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative flex size-9 items-center justify-center rounded-2xl bg-white/20 text-white border border-white/30 backdrop-blur-xs shadow-xs">
                <Bot className="size-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-orange-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">Trợ lý AI LiveHub 24/7</h4>
                <p className="text-[10px] text-orange-100 flex items-center gap-1 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Sẵn sàng giải đáp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              title="Thu nhỏ cửa sổ chat"
            >
              <ChevronDown className="size-5" />
            </button>
          </div>

          {/* Quick Action Suggestion Pills */}
          <div className="border-b border-border/70 bg-muted/40 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleSendMessage("Quy trình thuê thiết bị và đặt cọc như thế nào?")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-foreground hover:border-orange-500/40 hover:text-orange-500 transition-colors"
            >
              🎥 Thuê thiết bị
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Tư vấn các gói thành viên LiveHub")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-foreground hover:border-orange-500/40 hover:text-orange-500 transition-colors"
            >
              💎 Gói thành viên
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("Báo giá dịch vụ livestream trọn gói")}
              className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-foreground hover:border-orange-500/40 hover:text-orange-500 transition-colors"
            >
              📦 Gói trọn gói
            </button>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 leading-relaxed space-y-2 ${
                    msg.sender === "user"
                      ? "bg-orange-500 text-white rounded-br-xs"
                      : "bg-muted/70 text-foreground border border-border/70 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {msg.actionLink && (
                    <div className="pt-1">
                      <Link
                        href={msg.actionLink.href}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-background border border-border px-3 py-1.5 text-[11px] font-bold text-orange-500 shadow-xs hover:bg-muted"
                      >
                        <Sparkles className="size-3" />
                        <span>{msg.actionLink.label}</span>
                      </Link>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] ${
                      msg.sender === "user" ? "text-white/70 text-right" : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs pl-9">
                <span className="size-1.5 rounded-full bg-orange-500 animate-bounce" />
                <span className="size-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                <span className="size-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px]">Trợ lý đang phản hồi...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Hotline & Human Support Footer Bar */}
          <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Cần hỗ trợ trực tiếp?</span>
            <div className="flex items-center gap-2">
              <a
                href="tel:19008888"
                className="inline-flex items-center gap-1 text-orange-500 hover:underline font-semibold"
              >
                <Phone className="size-3" />
                <span>1900 8888</span>
              </a>
              <span>•</span>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noreferrer"
                className="text-sky-500 hover:underline font-semibold"
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
            className="border-t border-border p-3 flex items-center gap-2 bg-card"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi hoặc mã đơn (LH-xxxxxx)..."
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/25 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
              title="Gửi tin nhắn"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
