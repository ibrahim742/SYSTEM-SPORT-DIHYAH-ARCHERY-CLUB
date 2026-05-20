"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";
import type { LandingSectionView } from "@/lib/landing";

export type GalleryImage = {
  alt: string;
  src: string;
};

export function LandingGallerySection({ images, section }: { images: GalleryImage[]; section: LandingSectionView }) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (section.status !== "ACTIVE" || !images.length) return null;

  function scrollGallery(direction: "left" | "right") {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({
      behavior: "smooth",
      left: direction === "left" ? -track.clientWidth * 0.8 : track.clientWidth * 0.8
    });
  }

  return (
    <section id="gallery" className="scroll-mt-20 overflow-hidden bg-white py-12">
      <ScrollReveal className="mx-auto max-w-3xl px-4 text-center">
        {section.subtitle ? <p className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-emerald-700">{section.subtitle}</p> : null}
        <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{section.title}</h2>
        {section.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p> : null}
      </ScrollReveal>

      <ScrollReveal className="mt-8 w-full" delay={0.08} distance={24}>
        <div className="relative">
          <button
            aria-label="Geser galeri ke kiri"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/70 bg-white/90 text-slate-700 shadow-lg shadow-slate-950/15 backdrop-blur-sm transition hover:bg-white hover:text-sky-700 md:left-6"
            onClick={() => scrollGallery("left")}
            type="button"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div ref={trackRef} className="scrollbar-hide flex w-full snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-1 sm:gap-4 md:px-0">
            {images.map((image, index) => (
              <div key={`${image.src}-${index}`} className="relative h-60 w-[82vw] shrink-0 snap-center overflow-hidden rounded-md bg-slate-100 shadow-sm shadow-slate-200/70 sm:h-64 sm:w-[42vw] lg:h-80 lg:w-[24vw] xl:w-[20vw]">
                <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 24vw, (min-width: 640px) 42vw, 82vw" unoptimized className="object-cover transition duration-700 hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-4">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{image.alt}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            aria-label="Geser galeri ke kanan"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/70 bg-white/90 text-slate-700 shadow-lg shadow-slate-950/15 backdrop-blur-sm transition hover:bg-white hover:text-sky-700 md:right-6"
            onClick={() => scrollGallery("right")}
            type="button"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </ScrollReveal>
    </section>
  );
}
