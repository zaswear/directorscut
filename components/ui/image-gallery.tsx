"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { imageUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { Image as DBImage } from "@prisma/client";

interface Props {
  images:    DBImage[];
  onDelete?: (id: number) => void;
  className?: string;
}

export function ImageGallery({ images, onDelete, className }: Props) {
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const closeLightbox = () => setLightboxIdx(null);

  const goPrev = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  }, [images.length]);

  const goNext = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i + 1) % images.length : null));
  }, [images.length]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")     closeLightbox();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, goPrev, goNext]);

  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIdx]);

  async function handleDelete(image: DBImage) {
    if (!onDelete) return;
    setDeletingId(image.id);
    const res = await fetch(`/api/images/${image.id}`, { method: "DELETE" });
    if (res.ok) onDelete(image.id);
    setDeletingId(null);
  }

  if (!images.length) {
    return (
      <p className={cn("text-sm text-text-faint italic", className)}>
        Sin imágenes todavía.
      </p>
    );
  }

  const lightboxImage = lightboxIdx !== null ? images[lightboxIdx] : null;

  return (
    <>
      {/* ── Grid ── */}
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", className)}>
        {images.map((img, idx) => {
          const src = img.publicId
            ? imageUrl(img.publicId, { w: 400, crop: "fill" })
            : img.url;

          return (
            <div key={img.id} className="group relative aspect-square rounded-md overflow-hidden bg-surface">
              <button
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className="absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Ampliar imagen"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              </button>

              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                  disabled={deletingId === img.id}
                  aria-label="Eliminar imagen"
                  className={cn(
                    "absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center z-10",
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

      {/* ── Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

          {/* Imagen */}
          <div
            className="relative z-10 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={lightboxImage.id}
              src={
                lightboxImage.publicId
                  ? imageUrl(lightboxImage.publicId, { w: 1800 })
                  : lightboxImage.url
              }
              alt=""
              className="max-w-[90vw] max-h-[90dvh] object-contain rounded-md shadow-2xl"
            />

            {images.length > 1 && (
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-mono text-white/60 bg-black/40 px-2.5 py-1 rounded-full pointer-events-none">
                {(lightboxIdx ?? 0) + 1} / {images.length}
              </span>
            )}
          </div>

          {/* Cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          {/* Anterior */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Siguiente */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Eliminar desde lightbox */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(lightboxImage);
                closeLightbox();
              }}
              disabled={deletingId === lightboxImage.id}
              className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-red-500/60 text-white text-xs transition-colors disabled:opacity-40"
              aria-label="Eliminar imagen"
            >
              <Trash2 size={13} /> Eliminar
            </button>
          )}
        </div>
      )}
    </>
  );
}
