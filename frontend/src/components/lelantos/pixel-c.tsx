import * as React from "react";

interface PixelCProps {
  className?: string;
  size?: "default" | "hero" | "inner";
}

/**
 * PixelC — Custom pixel-perfect "C" glyph designed specifically to match
 * Pixelify Sans bold weights in Lelantos.
 * 
 * - 'hero' (or default): tuned for the large hero headline on the main landing page
 * - 'inner': tuned precisely to match the exact cap-height (0.70em) of Pixelify Sans
 *   in inner console page headers (Dashboard, Chat, Memory, Timeline, Conversations, API, Settings)
 *   so it is the exact same size as the surrounding letters.
 */
export function PixelC({ className = "", size = "default" }: PixelCProps) {
  const isInner = size === "inner";
  const dimensions = isInner
    ? {
        width: "0.58em",
        height: "0.70em",
        verticalAlign: "-0.01em",
      }
    : {
        width: "0.74em",
        height: "0.86em",
        verticalAlign: "-0.04em",
      };

  return (
    <svg
      viewBox="0 0 10 12"
      fill="currentColor"
      shapeRendering="crispEdges"
      className={`inline-block align-baseline select-none ${
        isInner ? "-mb-[0.01em] mr-[0.01em]" : "-mb-[0.02em] mr-[0.03em]"
      } ${className}`}
      style={dimensions}
      aria-hidden="true"
    >
      {/* Top horizontal bar */}
      <rect x="2" y="0" width="8" height="2.2" />
      {/* Top-right subtle pixel terminal cap */}
      <rect x="8.5" y="2.2" width="1.5" height="1.4" />
      {/* Top-left corner diagonal step */}
      <rect x="0.8" y="0.8" width="2" height="1.8" />
      
      {/* Main left vertical spine */}
      <rect x="0" y="2" width="2.4" height="8" />
      
      {/* Bottom-left corner diagonal step */}
      <rect x="0.8" y="9.4" width="2" height="1.8" />
      {/* Bottom horizontal bar */}
      <rect x="2" y="9.8" width="8" height="2.2" />
      {/* Bottom-right subtle pixel terminal cap */}
      <rect x="8.5" y="8.4" width="1.5" height="1.4" />
    </svg>
  );
}
