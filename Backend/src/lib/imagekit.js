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

function hasImageKitConfig() {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  );
}

function createFileName(originalName = "upload") {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `chat-${Date.now()}-${safeName}`;
}

async function uploadChatMedia(file) {
  if (!hasImageKitConfig() || !imagekit) {
    throw new Error("ImageKit config is missing. Add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.");
  }

  const fileName = createFileName(file.originalname);

  const result = await imagekit.upload({
    file: await toFile(file.buffer, fileName, { type: file.mimetype }),
    fileName,
    folder: "/chat",
  });

  return result.url;
}

export { uploadChatMedia, hasImageKitConfig };