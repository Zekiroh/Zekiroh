import { CYCLE_MS, HOLD_MS, MOVE_MS } from "./config.mjs";

export function addCentipede(svg, theme) {
  const styles = `
    .s,.c,.u{
      animation-delay:${HOLD_MS}ms;
    }

    .s{
      overflow:visible;
    }

    .s0{
      fill:${theme.head};
      stroke:${theme.neck};
      stroke-width:1.2px;
    }

    .s1{
      fill:${theme.neck};
    }

    .centipede-leg{
      fill:none;
      stroke:${theme.legs};
      stroke-width:1.6px;
      stroke-linecap:round;
      pointer-events:none;
    }

    .centipede-eye{
      fill:#b91c1c;
      pointer-events:none;
    }
  `;

  let output = svg.replace("</style>", `${styles}</style>`);
  const segmentPattern = /<rect class="s s(\d+)"([^>]*)\/>/g;

  output = output.replace(segmentPattern, (match, index, attributes) => {
    const segmentIndex = Number(index);
    const x = Number(attributes.match(/\bx="([^"]+)"/)?.[1]);
    const y = Number(attributes.match(/\by="([^"]+)"/)?.[1]);
    const width = Number(attributes.match(/\bwidth="([^"]+)"/)?.[1]);
    const height = Number(attributes.match(/\bheight="([^"]+)"/)?.[1]);

    if (![x, y, width, height].every(Number.isFinite)) return match;

    const left = x;
    const right = x + width;
    const upperY = y + height * 0.35;
    const lowerY = y + height * 0.65;
    const extras = [];

    if (segmentIndex > 0) {
      const leg = 3.4;
      extras.push(
        `<path class="centipede-leg s s${segmentIndex}" d="M ${left + 1} ${upperY} l -${leg} -${leg * 0.65}"/>`,
        `<path class="centipede-leg s s${segmentIndex}" d="M ${left + 1} ${lowerY} l -${leg} ${leg * 0.65}"/>`,
        `<path class="centipede-leg s s${segmentIndex}" d="M ${right - 1} ${upperY} l ${leg} -${leg * 0.65}"/>`,
        `<path class="centipede-leg s s${segmentIndex}" d="M ${right - 1} ${lowerY} l ${leg} ${leg * 0.65}"/>`,
      );
    }

    if (segmentIndex === 0) {
      extras.push(
        `<circle class="centipede-eye s s0" cx="${x + width * 0.34}" cy="${y + height * 0.38}" r="1.15"/>`,
        `<circle class="centipede-eye s s0" cx="${x + width * 0.66}" cy="${y + height * 0.38}" r="1.15"/>`,
      );
    }

    return [match, ...extras].join("");
  });

  return output;
}

function keyframes(svg, name) {
  const marker = `@keyframes ${name}{`;
  const start = svg.indexOf(marker);
  if (start === -1) throw new Error(`Missing ${name} keyframes.`);

  const contentStart = start + marker.length;
  let depth = 1;

  for (let i = contentStart; i < svg.length; i += 1) {
    if (svg[i] === "{") depth += 1;
    if (svg[i] === "}") depth -= 1;
    if (depth === 0) return svg.slice(contentStart, i);
  }

  throw new Error(`Unclosed ${name} keyframes.`);
}

function bikeTimeline(svg) {
  const rectPattern =
    /<rect class="u (u\d+)" height="12" width="([^"]+)" x="([^"]+)" y="144"\/>/g;
  const segments = [...svg.matchAll(rectPattern)].map((match) => ({
    name: match[1],
    width: Number(match[2]),
    x: Number(match[3]),
  }));

  if (segments.length !== 8) {
    throw new Error(`Expected 8 progress segments, found ${segments.length}.`);
  }

  const positions = new Map([[0, 0]]);
  let previousEnd = 0;

  for (const segment of segments) {
    const rule = /([\d.,%]+)\{transform:scale\(([\d.]+),1\)\}/g;

    for (const match of keyframes(svg, segment.name).matchAll(rule)) {
      const scale = Number(match[2]);
      const endpoint = Math.max(
        previousEnd,
        segment.x + segment.width * scale,
      );

      for (const value of match[1].split(",")) {
        const percentage = Number(value.replace("%", ""));
        positions.set(
          percentage,
          Math.max(positions.get(percentage) ?? -Infinity, endpoint),
        );
      }
    }

    previousEnd = segment.x + segment.width;
  }

  positions.set(100, previousEnd);

  return [...positions.entries()]
    .sort(([a], [b]) => a - b)
    .map(
      ([percentage, x]) =>
        `${percentage}%{transform:translate(${x.toFixed(3)}px,0)}`,
    )
    .join("");
}

export function addBike(svg, bike) {
  const styles = `.progress-bike{pointer-events:none;image-rendering:pixelated;animation:bikeProgress ${MOVE_MS}ms linear infinite;}@keyframes bikeProgress{${bikeTimeline(svg)}}`;
  const markup = `<g class="progress-bike"><g transform="translate(-35 136)">${bike}</g></g>`;

  return svg
    .replace("</style>", `${styles}</style>`)
    .replace("</svg>", `${markup}</svg>`);
}

function formatPercentage(value) {
  const mapped = ((HOLD_MS + (value / 100) * MOVE_MS) / CYCLE_MS) * 100;
  return mapped.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export function bakeLoopHold(svg) {
  let output = svg.replaceAll(`${MOVE_MS}ms`, `${CYCLE_MS}ms`);
  output = output.replace(
    /\n?\s*\.s,.c,.u\{\s*animation-delay:3000ms;\s*\}\s*/,
    "\n",
  );

  let result = "";
  let position = 0;

  while (true) {
    const start = output.indexOf("@keyframes ", position);
    if (start === -1) {
      result += output.slice(position);
      break;
    }

    result += output.slice(position, start);
    const opening = output.indexOf("{", start);
    let depth = 0;
    let end = opening;

    for (; end < output.length; end += 1) {
      if (output[end] === "{") depth += 1;
      if (output[end] === "}") {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
    }

    let block = output.slice(start, end);
    block = block.replace(/(\d+(?:\.\d+)?)%/g, (_, value) => {
      return `${formatPercentage(Number(value))}%`;
    });

    result += block;
    position = end;
  }

  return result;
}
