import type { Demand } from "@/lib/types/database";

/**
 * Safely extract images from a Demand record, supporting both top-level `images` column
 * and fallback `requirements.images` JSONB field.
 */
export function getDemandImages(
  demand: Partial<Demand> | null | undefined
): string[] {
  if (!demand) return [];

  // 1. Check top-level images array
  if (Array.isArray(demand.images) && demand.images.length > 0) {
    return demand.images.filter((img): img is string => typeof img === "string" && Boolean(img));
  }

  // 2. Check JSONB requirements.images fallback
  if (demand.requirements && typeof demand.requirements === "object") {
    const reqImages = (demand.requirements as Record<string, unknown>).images;
    if (Array.isArray(reqImages) && reqImages.length > 0) {
      return reqImages.filter((img): img is string => typeof img === "string" && Boolean(img));
    }
  }

  return [];
}
