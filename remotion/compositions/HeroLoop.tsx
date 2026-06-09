import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FilmGrain } from "../components/FilmGrain";
import { loopProgress } from "../lib/loop.js";
import { DARK, GOLD, BLUE } from "../lib/colors.js";

export const HERO_LOOP_DURATION = 240; // 8s @ 30fps

export type HeroLoopProps = { plate: string };

// A big bright light beam that clearly sweeps across the whole hero — obvious,
// unmistakably-not-part-of-the-photo motion. Period 80 divides 240 → seamless.
const SweepBeam: React.FC<{ frame: number; width: number }> = ({ frame, width }) => {
  const x = loopProgress(frame, 80) * (width + 1400) - 700;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: "-25%",
          left: x,
          width: 300,
          height: "150%",
          transform: "rotate(14deg)",
          background: `linear-gradient(90deg, transparent, ${GOLD}99 35%, #fff4d6cc 50%, ${GOLD}99 65%, transparent)`,
          filter: "blur(26px)",
          opacity: 0.75,
        }}
      />
    </AbsoluteFill>
  );
};

// Synthwave perspective floor grid scrolling toward the viewer.
const NeonGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const tile = 64;
  const offset = loopProgress(frame, 80) * tile; // seamless (240/80 = 3)
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "-60%",
          right: "-60%",
          bottom: 0,
          height: "55%",
          transform: "perspective(440px) rotateX(75deg)",
          transformOrigin: "bottom center",
          backgroundImage: `repeating-linear-gradient(0deg, ${GOLD}99 0 2px, transparent 2px ${tile}px), repeating-linear-gradient(90deg, ${BLUE}88 0 2px, transparent 2px ${tile}px)`,
          backgroundPosition: `0px ${offset}px, 0 0`,
          WebkitMaskImage: "linear-gradient(180deg, transparent, #000 70%)",
          maskImage: "linear-gradient(180deg, transparent, #000 70%)",
          opacity: 0.55,
          filter: "drop-shadow(0 0 6px rgba(231,200,132,0.45))",
        }}
      />
    </AbsoluteFill>
  );
};

export const HeroLoop: React.FC<HeroLoopProps> = ({ plate }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const p = loopProgress(frame, durationInFrames);
  const wave = Math.sin(p * Math.PI * 2); // -1..1, seamless

  // Pronounced, clearly visible "breathing" zoom (1.02 ↔ 1.22) + horizontal drift.
  const scale = 1.12 + 0.1 * wave;
  const x = interpolate(wave, [-1, 1], [-40, 40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const src = plate.startsWith("http") ? plate : staticFile(plate);

  return (
    <AbsoluteFill style={{ backgroundColor: DARK }}>
      {/* Photographic plate with pronounced parallax zoom */}
      <AbsoluteFill style={{ transform: `scale(${scale}) translateX(${x}px)` }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {/* Cinematic color grade: blue shadows up top, gold warmth at the bottom */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${BLUE}55 0%, transparent 42%, ${GOLD}33 100%)`,
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(110% 75% at 50% 32%, ${GOLD}33, transparent 60%)`,
          mixBlendMode: "screen",
        }}
      />

      {/* Neon synthwave floor grid */}
      <NeonGrid frame={frame} />

      {/* Big sweeping light beam — the obvious motion */}
      <SweepBeam frame={frame} width={width} />

      {/* Depth + legibility gradient (keeps hero text readable) */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,11,15,0.35) 0%, rgba(8,11,15,0) 35%, rgba(8,11,15,0.7) 100%)",
        }}
      />
      <FilmGrain />
    </AbsoluteFill>
  );
};
