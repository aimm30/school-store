"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { ProductImage } from "./ProductImage";

export function ImageGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div>
      <div className="card overflow-hidden">
        <ProductImage src={current?.url ?? null} alt={current?.alt || name} sizes="(min-width:1024px) 40vw, 100vw" priority />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <li key={img.url}>
              <button type="button" onClick={() => setActive(i)} aria-label={`Show image ${i + 1} of ${images.length}`} aria-current={i === active} className={clsx("relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-slate-100", i === active ? "border-brand-600" : "border-transparent hover:border-slate-300")}>
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
