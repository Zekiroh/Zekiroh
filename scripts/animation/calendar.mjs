import http from "node:http";
import { GLYPHS, PORT } from "./config.mjs";

const WORD = "Zekiroh";
const HEIGHT = 7;
const LEVEL_NAMES = {
  0: "NONE",
  1: "FIRST_QUARTILE",
  2: "SECOND_QUARTILE",
  3: "THIRD_QUARTILE",
  4: "FOURTH_QUARTILE",
};
const LEVEL_PATTERN = [
  [1, 3, 2, 4],
  [2, 4, 1, 3],
  [3, 1, 4, 2],
  [4, 2, 3, 1],
];

function levelFor(x, y, letterIndex) {
  return LEVEL_PATTERN[(x + letterIndex) % LEVEL_PATTERN.length][
    (y + letterIndex) % LEVEL_PATTERN[0].length
  ];
}

function buildWeeks() {
  const columns = [];

  for (const [letterIndex, letter] of [...WORD].entries()) {
    const glyph = GLYPHS[letter];

    for (let x = 0; x < glyph[0].length; x += 1) {
      columns.push(
        Array.from({ length: HEIGHT }, (_, y) => {
          const filled = y >= 1 && y <= 5 && glyph[y - 1][x] === "1";
          return { level: filled ? levelFor(x, y, letterIndex) : 0 };
        }),
      );
    }

    if (letterIndex < WORD.length - 1) {
      columns.push(Array.from({ length: HEIGHT }, () => ({ level: 0 })));
    }
  }

  const start = new Date("2026-01-04T00:00:00Z");

  return columns.map((column, x) => ({
    contributionDays: column.map((cell, weekday) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + x * 7 + weekday);

      return {
        contributionCount: cell.level,
        contributionLevel: LEVEL_NAMES[cell.level],
        weekday,
        date: date.toISOString().slice(0, 10),
      };
    }),
  }));
}

export function startCalendarServer() {
  const response = JSON.stringify({
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: { weeks: buildWeeks() },
        },
      },
    },
  });

  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/api/graphql") {
      res.writeHead(404);
      res.end();
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(response);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}
