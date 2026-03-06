export const uploadToCloudinary = async (uri: string) => {
  try {
    const data = new FormData();

    data.append("file", {
      uri: uri,
      type: "application/octet-stream",
      name: "upload",
    } as any);

    data.append("upload_preset", "mobile");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dkwjotpyk/auto/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();

    // console.log("Cloudinary response:", result);

    if (!result.secure_url) {
      console.log("Upload failed:", result);
      return null;
    }

    return result.secure_url;
  } catch (error) {
    console.log("Cloudinary upload error:", error);
    return null;
  }
};