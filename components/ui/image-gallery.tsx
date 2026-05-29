"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { imageUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { Image as DBImage } from "@prisma/client";

interface Props {
  images:    DBImage[];
  onDelete?: (id: number) => void;
  className?: string;
}

export function ImageGallery({ images, onDelete, className }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(image: DBImage) {
    if (!onDelete) return;
    setDeletingId(image.id);

    const res = await fetch(`/api/images/${image.id}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(image.id);
    }

    setDeletingId(null);
  }

  if (!images.length) {
    return (
      <p className={cn("text-sm text-text-faint italic", className)}>
        Sin imágenes todavía.
      </p>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", className)}>
      {images.map((img) => {
        const src = img.publicId
          ? imageUrl(img.publicId, { w: 400, crop: "fill" })
          : img.url;

        return (
          <div key={img.id} className="group relative aspect-square rounded-md overflow-hidden bg-surface">
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />

            {onDelete && (
              <button
                onClick={() => handleDelete(img)}
                disabled={deletingId === img.id}
                aria-label="Eliminar imagen"
                className={cn(
                  "absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center",
                  "bg-black/60 text-white opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-150 hover:bg-black/80",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {deletingId === img.id ? (
                  <span className="block w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <X size={12} />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
