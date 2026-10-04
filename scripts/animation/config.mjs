export const HOLD_MS = 3_000;
export const MOVE_MS = 46_930;
export const CYCLE_MS = HOLD_MS + MOVE_MS;
export const STEP_MS = 130;
export const PORT = 4173;

export const GLYPHS = {
  Z: ["11111", "00010", "00100", "01000", "11111"],
  e: ["00000", "01110", "10001", "11110", "01111"],
  k: ["10000", "10010", "11100", "10010", "10001"],
  i: ["1", "0", "1", "1", "1"],
  r: ["00000", "10110", "11001", "10000", "10000"],
  o: ["00000", "01110", "10001", "10001", "01110"],
  h: ["10000", "10000", "11110", "10001", "10001"],
};

export const THEMES = [
  {
    output: "assets/snake.svg",
    dots: "#b91c1c",
    empty: "#ebedf0",
    snake: "#ef4444",
    head: "#e6e6e6",
    neck: "#24292f",
    legs: "#30363d",
  },
  {
    output: "assets/snake-dark.svg",
    dots: "#ef4444",
    empty: "#161b22",
    snake: "#f87171",
    head: "#f0f0f0",
    neck: "#484f58",
    legs: "#8b949e",
  },
];
