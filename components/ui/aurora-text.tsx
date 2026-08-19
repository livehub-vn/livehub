"use client";

import React, { memo } from "react";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
}

export const AuroraText = memo(
  ({
    children,
    className = "",
    colors = ["#f97316", "#ea580c", "#fb923c", "#f59e0b"],
    speed = 1,
  }: AuroraTextProps) => {
    const gradientStyle = {
      backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${
        colors[0]
      })`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animationDuration: `${10 / speed}s`,
    };

    return (
      <span
        className={`animate-aurora inline-block bg-clip-text text-transparent ${className}`}
        style={gradientStyle}
      >
        {children}
      </span>
    );
  }
);

AuroraText.displayName = "AuroraText";
