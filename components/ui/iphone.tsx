import type { HTMLAttributes, ReactNode } from "react";

const PHONE_WIDTH = 430;
const PHONE_HEIGHT = 880;

// Screen Bounds (Thick, seamless black bezel between chassis and display)
const SCREEN_X = 16;
const SCREEN_Y = 16;
const SCREEN_WIDTH = 398;
const SCREEN_HEIGHT = 848;
const SCREEN_RADIUS = 48;

const LEFT_PCT = (SCREEN_X / PHONE_WIDTH) * 100;
const TOP_PCT = (SCREEN_Y / PHONE_HEIGHT) * 100;
const WIDTH_PCT = (SCREEN_WIDTH / PHONE_WIDTH) * 100;
const HEIGHT_PCT = (SCREEN_HEIGHT / PHONE_HEIGHT) * 100;

export interface IphoneProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  videoSrc?: string;
  children?: ReactNode;
}

export function Iphone({
  src,
  videoSrc,
  children,
  className = "",
  style,
  ...props
}: IphoneProps) {
  const hasVideo = !!videoSrc;
  const hasImage = !hasVideo && !!src;

  return (
    <div
      className={`relative inline-block w-full select-none bg-transparent ${className}`}
      style={{
        aspectRatio: `${PHONE_WIDTH}/${PHONE_HEIGHT}`,
        ...style,
      }}
      {...props}
    >
      {/* Screen Content Container - Light White Theme Throughout */}
      <div
        className="absolute z-0 overflow-hidden bg-white text-neutral-900"
        style={{
          left: `${LEFT_PCT}%`,
          top: `${TOP_PCT}%`,
          width: `${WIDTH_PCT}%`,
          height: `${HEIGHT_PCT}%`,
          borderRadius: `${SCREEN_RADIUS}px`,
        }}
      >
        {hasVideo && (
          <video
            className="block size-full object-cover"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        )}

        {hasImage && (
          <img
            src={src}
            alt="iPhone 17 Screen"
            className="block size-full object-cover object-top"
          />
        )}

        {children && (
          <div className="relative size-full overflow-y-auto no-scrollbar">
            {children}
          </div>
        )}
      </div>

      {/* iPhone 17 Orange Titanium + Solid Black Bezel Ring SVG */}
      <svg
        viewBox={`0 0 ${PHONE_WIDTH} ${PHONE_HEIGHT}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 size-full"
        style={{ transform: "translateZ(0)" }}
      >
        <defs>
          {/* Punch hole mask so screen content shows through transparently inside the black bezel */}
          <mask id="iphone17ScreenHole" maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width={PHONE_WIDTH} height={PHONE_HEIGHT} fill="white" />
            <rect
              x={SCREEN_X}
              y={SCREEN_Y}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              rx={SCREEN_RADIUS}
              fill="black"
            />
          </mask>

          {/* Pure Orange Titanium Chassis Gradient (No white stops) */}
          <linearGradient id="orangeTitanium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="40%" stopColor="#F97316" />
            <stop offset="75%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>

          <linearGradient id="orangeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="50%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>
        </defs>

        {/* Outer Titanium Chassis (Vibrant Orange Titanium, No White Edge) */}
        <rect
          x="2"
          y="2"
          width="426"
          height="876"
          rx="65"
          fill="url(#orangeTitanium)"
          stroke="url(#orangeBorder)"
          strokeWidth="2.5"
          mask="url(#iphone17ScreenHole)"
        />

        {/* Solid Black Bezel Layer (Pure Black Ring between orange frame and screen) */}
        <rect
          x="6"
          y="6"
          width="418"
          height="868"
          rx="60"
          fill="#000000"
          stroke="#000000"
          strokeWidth="2"
          mask="url(#iphone17ScreenHole)"
        />

        {/* Black Bezel Inner Edge Stroke */}
        <rect
          x={SCREEN_X}
          y={SCREEN_Y}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          rx={SCREEN_RADIUS}
          className="fill-none stroke-[#000000]"
          strokeWidth="2.5"
        />

        {/* Left Buttons (Orange Titanium Tint) */}
        {/* Action Button */}
        <rect x="0" y="145" width="2.5" height="32" rx="1.25" className="fill-[#F97316]" />
        {/* Volume Up */}
        <rect x="0" y="200" width="2.5" height="58" rx="1.25" className="fill-[#EA580C]" />
        {/* Volume Down */}
        <rect x="0" y="275" width="2.5" height="58" rx="1.25" className="fill-[#EA580C]" />

        {/* Right Buttons */}
        {/* Power Button */}
        <rect x="427.5" y="210" width="2.5" height="80" rx="1.25" className="fill-[#EA580C]" />
        {/* Camera Control Capacitive Surface */}
        <rect x="427.5" y="325" width="2.5" height="64" rx="1.25" className="fill-[#F97316]" />

        {/* Top Speaker Earpiece Slit */}
        <rect
          x="180"
          y="8.5"
          width="70"
          height="2.5"
          rx="1.25"
          className="fill-[#431407]"
          opacity="0.8"
        />

        {/* Floating Dynamic Island */}
        <rect
          x="152"
          y="23"
          width="126"
          height="31"
          rx="15.5"
          className="fill-[#000000]"
        />
        {/* Front TrueDepth Camera Sensor */}
        <circle cx="254" cy="38.5" r="4.5" className="fill-[#08090C]" />
        <circle cx="254" cy="38.5" r="1.8" className="fill-[#1A253C]" />

        {/* Orange Live Indicator in Dynamic Island */}
        <circle cx="170" cy="38.5" r="2.5" className="fill-[#F97316]" />

        {/* Bottom iOS Home Indicator Bar */}
        <rect
          x="145"
          y="848"
          width="140"
          height="4.5"
          rx="2.25"
          className="fill-neutral-900/30"
        />
      </svg>
    </div>
  );
}
