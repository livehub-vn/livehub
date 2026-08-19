import { createClient } from "@/lib/supabase/client";
import type { PreviewItem } from "@/components/direct-image-uploader";

/**
 * Upload pending local image files to Supabase Storage and return array of public URLs
 */
export async function uploadPendingImages(
  items: PreviewItem[],
  bucketName: "services" | "demands" | "avatars" = "services"
): Promise<string[]> {
  if (!items || items.length === 0) return [];

  const supabase = createClient();
  const urls: string[] = [];

  for (const item of items) {
    if (item.remoteUrl) {
      urls.push(item.remoteUrl);
      continue;
    }

    if (item.file) {
      const fileExt = item.file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, item.file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        urls.push(publicUrl);
      } else {
        console.error("Failed to upload image:", error);
        // Fallback: If mock data or unconfigured bucket, generate a clean data placeholder
        urls.push(item.previewUrl);
      }
    }
  }

  return urls;
}
