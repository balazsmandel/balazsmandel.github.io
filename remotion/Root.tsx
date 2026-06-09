import { Composition } from "remotion";
import { HeroLoop, HERO_LOOP_DURATION } from "./compositions/HeroLoop";
import { FleetShowcase, FLEET_DURATION } from "./compositions/FleetShowcase";
import { SectionAmbient, SECTION_AMBIENT_DURATION } from "./compositions/SectionAmbient";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroLoop"
        component={HeroLoop}
        durationInFrames={HERO_LOOP_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ plate: "assets/img/hero-night.jpg" }}
      />
      <Composition
        id="FleetShowcase"
        component={FleetShowcase}
        durationInFrames={FLEET_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SectionAmbient"
        component={SectionAmbient}
        durationInFrames={SECTION_AMBIENT_DURATION}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
