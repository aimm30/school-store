import Image from "next/image";
import { Package } from "lucide-react";

export function ProductImage({ src, alt, sizes, priority }: { src: string | null; alt: string; sizes: string; priority?: boolean }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300" role="img" aria-label={`${alt} (no photo yet)`}>
          <Package className="h-10 w-10" aria-hidden />
        </div>
      )}
    </div>
  );
}
