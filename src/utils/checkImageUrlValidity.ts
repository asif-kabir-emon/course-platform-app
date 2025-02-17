export const checkImageUrlValidity = async (imageUrl: string) => {
  if (!imageUrl) return;
  try {
    const response = await fetch(imageUrl, { method: "HEAD" });
    if (
      response.ok &&
      response.headers.get("content-type")?.startsWith("image")
    ) {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
};
