import { AbsoluteFill } from "remotion";
import { LightStreaks } from "../components/LightStreaks";
import { DARK } from "../lib/colors.js";

export const SECTION_AMBIENT_DURATION = 180; // 6s @ 30fps

export const SectionAmbient: React.FC = () => (
  <AbsoluteFill style={{ background: DARK }}>
    <LightStreaks count={10} opacity={0.35} />
    <AbsoluteFill
      style={{
        background: "radial-gradient(80% 60% at 50% 50%, rgba(231,200,132,0.06), transparent)",
      }}
    />
  </AbsoluteFill>
);
