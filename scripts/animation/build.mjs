import { readFile, writeFile } from "node:fs/promises";
import { generateSnakeAnimation } from "generate-snake-animation";
import { startCalendarServer } from "./calendar.mjs";
import { PORT, STEP_MS, THEMES } from "./config.mjs";
import { addBike, addCentipede, bakeLoopHold } from "./decorate.mjs";
import { formatSvg } from "./format.mjs";

async function loadBike() {
  const source = await readFile(new URL("./bike.svg", import.meta.url), "utf8");
  const body = source.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)?.[1];
  if (!body) throw new Error("bike.svg has no SVG body.");
  return body.replace(/>\s+</g, "><").trim();
}

const bike = await loadBike();
const server = await startCalendarServer();

try {
  const outputs = THEMES.map((theme) => ({
    format: "svg",
    drawOptions: {
      colorDots: { 1: theme.dots, 2: theme.dots, 3: theme.dots, 4: theme.dots },
      colorEmpty: theme.empty,
      colorSnake: theme.snake,
      colorDotBorder: theme.empty,
      colorBackground: "transparent",
      sizeCell: 16,
      sizeDot: 12,
      sizeDotBorderRadius: 2,
    },
    animationOptions: { frameByStep: 1, stepDurationMs: STEP_MS },
  }));

  const generated = await generateSnakeAnimation(
    {
      platform: "github",
      username: "Zekiroh",
      githubToken: "",
      baseUrl: `http://127.0.0.1:${PORT}`,
    },
    outputs,
  );

  if (generated.length !== THEMES.length) {
    throw new Error("Unexpected animation output count.");
  }

  for (let i = 0; i < THEMES.length; i += 1) {
    let svg = generated[i];
    if (typeof svg !== "string") throw new Error("Expected SVG output.");

    svg = addCentipede(svg, THEMES[i]);
    svg = addBike(svg, bike);
    svg = bakeLoopHold(svg);
    svg = formatSvg(svg);

    await writeFile(THEMES[i].output, svg, "utf8");
    console.log(`✓ ${THEMES[i].output}`);
  }
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
