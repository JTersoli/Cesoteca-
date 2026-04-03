export type TextAlign = "left" | "center" | "justify";
export const DEFAULT_BOOK_IMAGE_URL = "/open-book.jpeg";
const DEFAULT_FONT_SIZE = 16;

export type TextBoxLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BookTextLayout = {
  left: TextBoxLayout;
  right: TextBoxLayout;
};

const DEFAULT_BOX_WIDTH = 27.2;
const DEFAULT_BOX_HEIGHT = 70;
const DEFAULT_TOP = 16.2;
const DEFAULT_LEFT_X = 18.4;
const DEFAULT_RIGHT_X = 57;

export const DEFAULT_BOOK_TEXT_LAYOUT: BookTextLayout = {
  left: {
    x: DEFAULT_LEFT_X,
    y: DEFAULT_TOP,
    width: DEFAULT_BOX_WIDTH,
    height: DEFAULT_BOX_HEIGHT,
  },
  right: {
    x: DEFAULT_RIGHT_X,
    y: DEFAULT_TOP,
    width: DEFAULT_BOX_WIDTH,
    height: DEFAULT_BOX_HEIGHT,
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getBookFontSize(containerWidth: number) {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
    return DEFAULT_FONT_SIZE;
  }

  return clamp(containerWidth * 0.0205, 10, 20);
}

function toFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeBoxLayout(
  input: unknown,
  fallback: TextBoxLayout
): TextBoxLayout {
  const value = typeof input === "object" && input ? input : {};
  const width = clamp(
    toFiniteNumber((value as Partial<TextBoxLayout>).width, fallback.width),
    8,
    45
  );
  const height = clamp(
    toFiniteNumber((value as Partial<TextBoxLayout>).height, fallback.height),
    12,
    78
  );
  const x = clamp(
    toFiniteNumber((value as Partial<TextBoxLayout>).x, fallback.x),
    0,
    100 - width
  );
  const y = clamp(
    toFiniteNumber((value as Partial<TextBoxLayout>).y, fallback.y),
    0,
    100 - height
  );

  return { x, y, width, height };
}

export function normalizeBookTextLayout(input: unknown): BookTextLayout {
  const value = typeof input === "object" && input ? input : {};

  return {
    left: normalizeBoxLayout(
      (value as Partial<BookTextLayout>).left,
      DEFAULT_BOOK_TEXT_LAYOUT.left
    ),
    right: normalizeBoxLayout(
      (value as Partial<BookTextLayout>).right,
      DEFAULT_BOOK_TEXT_LAYOUT.right
    ),
  };
}

function getTokenWidth(token: string) {
  return token.replace(/\t/g, "    ").length;
}

export function chunkBookText(
  text: string,
  maxCharsPerLine = 34,
  maxLinesPerPage = 18
) {
  const source = text.replace(/\r\n/g, "\n");
  if (!source) return [""];

  const tokens = source.split(/(\n|[^\S\n]+|\S+)/).filter(Boolean);
  const pages: string[] = [];
  let current = "";
  let lineLength = 0;
  let lineCount = 1;

  const pushCurrent = () => {
    const cleaned = current.replace(/[^\S\n]+$/g, "");
    pages.push(cleaned);
    current = "";
    lineLength = 0;
    lineCount = 1;
  };

  for (const token of tokens) {
    if (token === "\n") {
      if (lineCount >= maxLinesPerPage && current) {
        pushCurrent();
      }
      if (!current) {
        continue;
      }
      current += token;
      lineCount += 1;
      lineLength = 0;
      continue;
    }

    if (!current && !token.trim()) {
      continue;
    }

    const tokenWidth = getTokenWidth(token);
    const nextLineLength = lineLength + tokenWidth;

    if (lineLength > 0 && nextLineLength > maxCharsPerLine) {
      if (lineCount >= maxLinesPerPage && current) {
        pushCurrent();
      } else {
        lineCount += 1;
        lineLength = 0;
      }
    }

    if (lineCount > maxLinesPerPage && current) {
      pushCurrent();
    }

    current += token;
    lineLength += tokenWidth;
  }

  if (current || pages.length === 0) pages.push(current);
  return pages;
}
