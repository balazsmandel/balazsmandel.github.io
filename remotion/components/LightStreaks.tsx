import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loopProgress } from "../lib/loop.js";
import { GOLD, BLUE } from "../lib/colors.js";

export const LightStreaks: React.FC<{ count?: number; opacity?: number }> = ({
  count = 6,
  opacity = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const p = loopProgress(frame, durationInFrames);

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden" }}>
      {Array.from({ length: count }).map((_, i) => {
        const phase = (i / count + p) % 1; // wrap → seamless
        const left = phase * (width + 600) - 300;
        const color = i % 2 === 0 ? GOLD : BLUE;
        const top = (i * 137) % 100;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${top}%`,
              left,
              width: 260,
              height: 3,
              borderRadius: 3,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              filter: "blur(1px)",
              opacity,
              transform: "rotate(-18deg)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
