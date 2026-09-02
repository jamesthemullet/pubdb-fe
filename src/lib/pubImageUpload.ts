import type { Pub } from "@/types/pub";

const MAX_PUB_IMAGE_BYTES = 8 * 1024 * 1024;

export type PubImageUploadResult = { pub: Pub } | { error: string };

export function validatePubImageSize(file: File): string | null {
  if (file.size > MAX_PUB_IMAGE_BYTES) {
    return "Image is too large — please choose a file under 8MB.";
  }
  return null;
}

export async function uploadPubImage(
  pubId: string,
  file: File
): Promise<PubImageUploadResult> {
  const sizeError = validatePubImageSize(file);
  if (sizeError) return { error: sizeError };

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`/api/pubs/${pubId}/image`, {
      method: "POST",
      body: formData,
    });
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Failed to upload image";
      return { error: message };
    }
    return { pub: data as Pub };
  } catch {
    return { error: "Network error" };
  }
}
