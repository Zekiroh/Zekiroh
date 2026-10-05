import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const assets = [
  ["assets/snake.svg", "f3a68e24c445a8dfadf2e95c78671326c9022367d185bc858602645b3ec4ad37"],
  ["assets/snake-dark.svg", "ad52a3f61f265daf430e29d3f320d8e059383062441adc97f8539e601cfc30f7"],
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
  const lines = source.trimEnd().split("\n");
  const longestLine = Math.max(...lines.map((line) => line.length));

  assert(hash(source) === expectedHash, `${path}: output changed.`);
  assert(count(source, /@keyframes /g) === 81, `${path}: keyframe count changed.`);
  assert(count(source, /@keyframes c[0-9a-z]+\s*\{/g) === 68, `${path}: contribution animation changed.`);
  assert(count(source, /@keyframes s[0-9]+\s*\{/g) === 4, `${path}: centipede animation changed.`);
  assert(count(source, /@keyframes u[0-9]+\s*\{/g) === 8, `${path}: progress animation changed.`);
  assert(count(source, /@keyframes bikeProgress\s*\{/g) === 1, `${path}: bike animation changed.`);
  assert(count(source, /class="progress-bike"/g) === 1, `${path}: expected one bike.`);
  assert(count(source, /49930ms/g) === 4, `${path}: cycle timing changed.`);
  assert(!source.includes("animation-delay:3000ms"), `${path}: one-time delay returned.`);
  assert(longestLine <= 400, `${path}: generated output contains an oversized line.`);

  console.log(`✓ ${path}`);
}

console.log("✓ Animation matches the approved baseline.");
