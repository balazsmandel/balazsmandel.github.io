import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { FilmGrain } from "../components/FilmGrain";
import { GOLD } from "../lib/colors.js";

export const FLEET_PER = 75; // 2.5s / autó
export const CARS = [
  "assets/img/octavia.png",
  "assets/img/eniro.png",
  "assets/img/merci.png",
  "assets/img/transit.png",
];
export const FLEET_DURATION = FLEET_PER * CARS.length; // 300 = 10s

const CarSlide: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame(); // 0..FLEET_PER (Sequence-relatív)
  const fade = interpolate(frame, [0, 12, FLEET_PER - 12, FLEET_PER], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const float = Math.sin((frame / FLEET_PER) * Math.PI * 2) * 14;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade }}>
      <div style={{ position: "relative", transform: `translateY(${float}px)` }}>
        <Img
          src={staticFile(src)}
          style={{ width: 1000, filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.6))" }}
        />
        <AbsoluteFill
          style={{
            background: `radial-gradient(60% 40% at 50% 50%, ${GOLD}22, transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const FleetShowcase: React.FC = () => (
  <AbsoluteFill
    style={{ background: "radial-gradient(120% 100% at 50% 0%, #11203a 0%, #080b0f 60%)" }}
  >
    <AbsoluteFill
      style={{ top: "70%", background: "linear-gradient(180deg, rgba(78,160,255,0.08), transparent)" }}
    />
    {CARS.map((src, i) => {
      const overlap = i > 0 ? 12 : 0;
      return (
        <Sequence key={i} from={i * FLEET_PER - overlap} durationInFrames={FLEET_PER + overlap}>
          <CarSlide src={src} />
        </Sequence>
      );
    })}
    <FilmGrain />
  </AbsoluteFill>
);
