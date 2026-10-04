import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const assets = [
  ["assets/snake.svg", "f5c588c51a6521e8787f404fc01d52ff4ad41bbd3971fad4eb4d58d6599549c9"],
  ["assets/snake-dark.svg", "ee6ef7267c6e18fbf5818c4df33099e92eb58a5a30f43814c14af39eccc65341"],
];

function hash(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function count(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const [path, expectedHash] of assets) {
  const source = (await readFile(path, "utf8")).replace(/\r\n/g, "\n");

  assert(hash(source) === expectedHash, `${path}: output changed.`);
  assert(count(source, /@keyframes /g) === 81, `${path}: keyframe count changed.`);
  assert(count(source, /@keyframes c[0-9a-z]+\{/g) === 68, `${path}: contribution animation changed.`);
  assert(count(source, /@keyframes s[0-9]+\{/g) === 4, `${path}: centipede animation changed.`);
  assert(count(source, /@keyframes u[0-9]+\{/g) === 8, `${path}: progress animation changed.`);
  assert(count(source, /@keyframes bikeProgress\{/g) === 1, `${path}: bike animation changed.`);
  assert(count(source, /class="progress-bike"/g) === 1, `${path}: expected one bike.`);
  assert(count(source, /49930ms/g) === 4, `${path}: cycle timing changed.`);
  assert(!source.includes("animation-delay:3000ms"), `${path}: one-time delay returned.`);

  console.log(`✓ ${path}`);
}

console.log("✓ Animation matches the approved baseline.");
