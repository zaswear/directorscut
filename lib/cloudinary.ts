const CLOUD_NAME   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? process.env.CLOUDINARY_UPLOAD_PRESET;
const TAG           = process.env.NEXT_PUBLIC_CLOUDINARY_TAG ?? process.env.CLOUDINARY_TAG ?? "pelicula";

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

/** Subida directa desde el cliente (sin firma, usando upload preset público) */
export async function uploadToCloudinary(
  file: File
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET ?? "directors_cut");
  formData.append("tags", TAG);
  formData.append("folder", "directors_cut");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();

  return {
    public_id:  data.public_id,
    secure_url: data.secure_url,
    width:      data.width,
    height:     data.height,
  };
}

/** Eliminar imagen (requiere llamada server-side con firma en producción — placeholder) */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await fetch("/api/images/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_id: publicId }),
  });
}

/** URL optimizada WebP con transformaciones */
export function optimizedUrl(
  publicId: string,
  options: { width?: number; height?: number } = {}
): string {
  const transforms = ["f_webp", "q_auto"];
  if (options.width)  transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(",")}/${publicId}`;
}
