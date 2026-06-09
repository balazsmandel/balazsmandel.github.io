// Mindhárom composition renderelése H264 mp4-be, hangsáv nélkül.
// (A VP9 webm kimenet a Chrome-ban PIPELINE_ERROR_DECODE hibát adott, ezért
//  csak a megbízhatóan dekódolódó H264 mp4-et használjuk.)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const OUT = "public/assets/video";
mkdirSync(OUT, { recursive: true });

const JOBS = [
  { id: "HeroLoop", name: "hero-loop", crf: 21 },
];

for (const j of JOBS) {
  const out = `${OUT}/${j.name}.mp4`;
  console.log(`Rendering ${j.id} -> ${out}`);
  execFileSync(
    "npx",
    ["remotion", "render", j.id, out, "--codec=h264", `--crf=${j.crf}`, "--muted"],
    { stdio: "inherit", shell: true }
  );
}
console.log("Done.");
