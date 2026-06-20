import { createHash } from "node:crypto";

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  version: number;
  width: number;
  height: number;
  error?: { message?: string };
};

function getCloudinaryConfig() {
  const rawUrl = process.env.CLOUDINARY_URL;
  if (!rawUrl) throw new Error("CLOUDINARY_URL is not configured.");

  const url = new URL(rawUrl);
  const cloudName = url.hostname;
  const apiKey = decodeURIComponent(url.username);
  const apiSecret = decodeURIComponent(url.password);
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_URL is invalid.");
  }

  const baseFolder = (process.env.CLOUDINARY_BASE_FOLDER || "course-platform")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-");

  return { cloudName, apiKey, apiSecret, baseFolder };
}

export async function uploadProfileAvatar(file: File, userId: string) {
  const { cloudName, apiKey, apiSecret, baseFolder } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `profile-${userId}`;
  const signedParams = {
    folder: `${baseFolder}/profiles/${userId}`,
    invalidate: "true",
    overwrite: "true",
    public_id: publicId,
    timestamp,
    unique_filename: "false",
  };
  const signaturePayload = Object.entries(signedParams)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = createHash("sha1")
    .update(`${signaturePayload}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.append("file", file, `profile-${userId}.jpg`);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);
  Object.entries(signedParams).forEach(([key, value]) =>
    formData.append(key, value),
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );
  const result = (await response.json()) as CloudinaryUploadResult;
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || "Cloudinary rejected the upload.");
  }

  return result;
}
