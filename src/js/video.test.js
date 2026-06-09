import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldAutoplay } from "./video.js";

test("autoplay unless Save-Data is on (reduced-motion no longer blocks decorative bg video)", () => {
  assert.equal(shouldAutoplay({ saveData: false }), true);
  assert.equal(shouldAutoplay({ saveData: true }), false);
});
