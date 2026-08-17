import "dotenv/config";
import ImageKit, { toFile } from "@imagekit/nodejs";

const hasRequiredConfig = Boolean(
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT
);

const imagekit = hasRequiredConfig
  ? new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    })
  : null;

export function hasImageKitConfig() {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  );
}

function createFileName(originalName = "upload") {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `anon-chat-${Date.now()}-${safeName}`;
}

/**
 * Upload a media file to ImageKit.
 * Returns { url, fileId } — both should be stored on the Message document.
 */
export async function uploadChatMedia(file) {
  if (!hasImageKitConfig() || !imagekit) {
    throw new Error(
      "ImageKit config is missing. Add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT."
    );
  }

  const fileName = createFileName(file.originalname);

  const result = await imagekit.upload({
    file: await toFile(file.buffer, fileName, { type: file.mimetype }),
    fileName,
    folder: "/anon-chat",
  });

  return { url: result.url, fileId: result.fileId };
}

/**
 * Delete a media file from ImageKit by its fileId.
 * Fire-and-forget safe — logs errors but doesn't throw.
 */
export async function deleteMedia(fileId) {
  if (!hasImageKitConfig() || !imagekit || !fileId) return;

  try {
    await imagekit.deleteFile(fileId);
  } catch (err) {
    console.error("[ImageKit] Failed to delete file:", fileId, err.message);
  }
}