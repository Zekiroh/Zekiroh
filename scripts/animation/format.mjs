const MAX_CSS_LINE_LENGTH = 180;

function matchingBrace(source, openIndex) {
  let depth = 0;

  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;

    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Unclosed CSS block.");
}

function collapseWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseKeyframeSteps(body) {
  const steps = [];
  let position = 0;

  while (position < body.length) {
    while (position < body.length && /\s/.test(body[position])) {
      position += 1;
    }

    if (position >= body.length) break;

    const opening = body.indexOf("{", position);
    if (opening === -1) throw new Error("Malformed keyframes.");

    const closing = matchingBrace(body, opening);

    steps.push({
      selector: collapseWhitespace(body.slice(position, opening)),
      body: collapseWhitespace(body.slice(opening + 1, closing)),
    });

    position = closing + 1;
  }

  return steps;
}

function formatKeyframes(header, body) {
  const steps = parseKeyframeSteps(body).map(
    ({ selector, body: declarations }) =>
      `${selector} { ${declarations} }`,
  );

  const oneLine = `${header} { ${steps.join(" ")} }`;

  if (oneLine.length <= MAX_CSS_LINE_LENGTH) {
    return [oneLine];
  }

  const lines = [`${header} {`];
  let current = "";

  for (const step of steps) {
    const candidate = current ? `${current} ${step}` : step;

    if (current && candidate.length + 2 > MAX_CSS_LINE_LENGTH) {
      lines.push(`  ${current}`);
      current = step;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(`  ${current}`);
  lines.push("}");

  return lines;
}

function formatCss(css) {
  const lines = [];
  let position = 0;

  while (position < css.length) {
    while (position < css.length && /\s/.test(css[position])) {
      position += 1;
    }

    if (position >= css.length) break;

    const opening = css.indexOf("{", position);
    if (opening === -1) throw new Error("Malformed CSS.");

    const closing = matchingBrace(css, opening);
    const header = collapseWhitespace(css.slice(position, opening));
    const body = css.slice(opening + 1, closing);

    if (header.startsWith("@keyframes ")) {
      lines.push(...formatKeyframes(header, body));
    } else {
      lines.push(`${header} { ${collapseWhitespace(body)} }`);
    }

    position = closing + 1;
  }

  return lines;
}

function opensContainer(line) {
  if (!/^<[^!?/][^>]*>$/.test(line)) return false;
  if (/\/>$/.test(line)) return false;

  const tag = line.match(/^<([A-Za-z][\w:.-]*)\b/)?.[1];
  if (!tag) return false;

  return !line.includes(`</${tag}>`);
}

export function formatSvg(svg) {
  const styleMatch = svg.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) throw new Error("SVG has no style block.");

  const placeholder = "__ZEKIROH_STYLE__";
  const withoutStyle = svg.replace(
    styleMatch[0],
    `<style>${placeholder}</style>`,
  );

  const tokens = withoutStyle
    .replace(/>\s*</g, ">\n<")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const output = [];
  let depth = 0;

  for (const token of tokens) {
    if (token === `<style>${placeholder}</style>`) {
      const indent = "  ".repeat(depth);

      output.push(`${indent}<style>`);

      for (const line of formatCss(styleMatch[1])) {
        output.push(`${indent}  ${line}`);
      }

      output.push(`${indent}</style>`);
      continue;
    }

    if (/^<\//.test(token)) {
      depth = Math.max(0, depth - 1);
    }

    output.push(`${"  ".repeat(depth)}${token}`);

    if (opensContainer(token)) {
      depth += 1;
    }
  }

  return `${output.join("\n")}\n`;
}
