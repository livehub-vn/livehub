"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&auto=format&fit=crop&q=80";

export function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  fill,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    if (fallbackSrc && !error) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt || ""}
          fill={fill ? true : false}
          className={className}
          onError={() => setError(true)}
          {...props}
        />
      );
    }

    return (
      <div
        className={`flex size-full items-center justify-center bg-muted text-muted-foreground ${
          className || ""
        }`}
      >
        <ImageIcon className="size-6 opacity-40" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ""}
      fill={fill ? true : false}
      className={`transition-opacity duration-300 ${
        loading ? "opacity-70 blur-xs" : "opacity-100"
      } ${className || ""}`}
      onLoad={() => setLoading(false)}
      onError={() => {
        setError(true);
        setLoading(false);
      }}
      {...props}
    />
  );
}
