import type { Demand } from "@/lib/types/database";

const CONTEXTUAL_DEMAND_IMAGES: { keyword: RegExp; url: string }[] = [
  {
    keyword: /thời trang|fashion|runway|mẫu/i,
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&auto=format&fit=crop&q=80",
  },
  {
    keyword: /studio|phòng quay|phim trường|phông xanh/i,
    url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1000&auto=format&fit=crop&q=80",
  },
  {
    keyword: /hội thảo|webinar|hội nghị|talkshow|sự kiện/i,
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80",
  },
  {
    keyword: /kỹ thuật|bàn trộn|atem|vmix|operator|livestream/i,
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80",
  },
  {
    keyword: /máy quay|camera|sony|fx3|lens|ánh sáng|đèn/i,
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80",
  },
];

const DEFAULT_DEMAND_FALLBACK =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80";

export function getDemandDefaultImage(demand?: Partial<Demand> | null): string {
  if (!demand) return DEFAULT_DEMAND_FALLBACK;
  const text = `${demand.title || ""} ${demand.description || ""}`;
  const matched = CONTEXTUAL_DEMAND_IMAGES.find((c) => c.keyword.test(text));
  return matched ? matched.url : DEFAULT_DEMAND_FALLBACK;
}

/**
 * Safely extract images from a Demand record, supporting both top-level `images` column,
 * fallback `requirements.images` JSONB field, and contextual image fallback.
 */
export function getDemandImages(
  demand: Partial<Demand> | null | undefined,
  fallback = true
): string[] {
  if (!demand) return fallback ? [DEFAULT_DEMAND_FALLBACK] : [];

  // 1. Check top-level images array
  if (Array.isArray(demand.images) && demand.images.length > 0) {
    const valid = demand.images.filter(
      (img): img is string => typeof img === "string" && Boolean(img)
    );
    if (valid.length > 0) return valid;
  }

  // 2. Check JSONB requirements.images fallback
  if (demand.requirements && typeof demand.requirements === "object") {
    const reqImages = (demand.requirements as Record<string, unknown>).images;
    if (Array.isArray(reqImages) && reqImages.length > 0) {
      const valid = reqImages.filter(
        (img): img is string => typeof img === "string" && Boolean(img)
      );
      if (valid.length > 0) return valid;
    }
  }

  if (fallback) {
    return [getDemandDefaultImage(demand)];
  }

  return [];
}
