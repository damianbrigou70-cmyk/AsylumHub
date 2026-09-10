/**
 * BrandHexLogo — the Asylum++ emblem, used in the sidebar/header and on /login.
 */
import { BRAND } from "@/lib/brand";
import { useState } from "react";
import { IconLogo } from "@/components/ui-custom/CustomIcon";
import logoAsset from "@/assets/asylum-logo.png.asset.json";

interface BrandHexLogoProps {
  /** Rendered height in px. */
  size?: number;
  className?: string;
}

export function BrandHexLogo({ size = 42, className }: BrandHexLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <span
      className={`group relative grid place-items-center shrink-0${className ? ` ${className}` : ""}`}
      style={{ height: size, width: size }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.22 25 / 0.6), transparent 70%)" }}
      />
      {imageFailed ? (
        <span className="relative grid h-full w-full place-items-center text-primary">
          <IconLogo size={size * 0.72} />
        </span>
      ) : (
        <img
          src={logoAsset.url}
          alt={`${BRAND.name} emblem`}
          className="relative h-full w-full object-contain"
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}
