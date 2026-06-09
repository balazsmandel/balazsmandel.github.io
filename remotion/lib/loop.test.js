import { test } from "node:test";
import assert from "node:assert/strict";
import { loopProgress, seamlessSine, pingPong } from "./loop.js";

test("loopProgress wraps to [0,1)", () => {
  assert.equal(loopProgress(0, 100), 0);
  assert.equal(loopProgress(50, 100), 0.5);
  assert.equal(loopProgress(100, 100), 0); // seam: end == start
  assert.equal(loopProgress(150, 100), 0.5);
});

test("seamlessSine matches at frame 0 and period (seamless loop)", () => {
  const a = seamlessSine(0, 60, 10);
  const b = seamlessSine(60, 60, 10);
  assert.ok(Math.abs(a - b) < 1e-9);
  assert.ok(Math.abs(seamlessSine(0, 60, 10)) < 1e-9); // sin(0)=0
});

test("pingPong is a 0..1..0 triangle", () => {
  assert.equal(pingPong(0, 100), 0);
  assert.ok(Math.abs(pingPong(50, 100) - 1) < 1e-9);
  assert.ok(Math.abs(pingPong(100, 100)) < 1e-9);
});
