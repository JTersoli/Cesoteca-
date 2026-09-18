import { Fragment, type ReactNode } from "react";

/**
 * Formato inline tipo markdown para el contenido editorial.
 *
 * Sintaxis (la inserta el panel admin al seleccionar texto, pero también
 * se puede escribir a mano):
 *   **texto**  -> negrita   (<strong>)
 *   __texto__  -> subrayado (<u>)
 *   *texto*    -> cursiva    (<em>)
 *
 * El parser es tolerante: un marcador sin cierre, o con espacios pegados a los
 * delimitadores (p. ej. la separación poética "* * *"), se deja tal cual como
 * texto plano en lugar de romper el render. Se preservan los saltos de línea y
 * los espacios, que las hojas de estilo del lector muestran con
 * `white-space: break-spaces`.
 */

type Rule = {
  open: string;
  close: string;
  tag: "strong" | "em" | "u";
};

// El orden importa: la negrita (`**`) se evalúa antes que la cursiva (`*`)
// para que `**` no sea consumido por la regla de un solo asterisco.
const RULES: Rule[] = [
  { open: "**", close: "**", tag: "strong" },
  { open: "__", close: "__", tag: "u" },
  { open: "*", close: "*", tag: "em" },
];

type RuleMatch = {
  rule: Rule;
  start: number;
  end: number;
  inner: string;
};

function hasTightBoundaries(inner: string) {
  // Exigimos contenido real y sin espacios pegados a los delimitadores, al
  // estilo de markdown. Así "* * *" o "** **" no se interpretan como formato.
  return inner.length > 0 && !/^\s/.test(inner) && !/\s$/.test(inner);
}

function findFirstRule(text: string): RuleMatch | null {
  let best: RuleMatch | null = null;

  for (const rule of RULES) {
    const start = text.indexOf(rule.open);
    if (start < 0) continue;

    const afterOpen = start + rule.open.length;
    let from = afterOpen;
    let closeAt = -1;

    while (from <= text.length) {
      const idx = text.indexOf(rule.close, from);
      if (idx < 0) break;
      const inner = text.slice(afterOpen, idx);
      if (hasTightBoundaries(inner)) {
        closeAt = idx;
        break;
      }
      from = idx + 1;
    }

    if (closeAt < 0) continue;

    // Gana el marcador que abre antes. En caso de empate (misma posición de
    // inicio) prevalece el primero de RULES, que ya quedó fijado como `best`.
    if (!best || start < best.start) {
      best = {
        rule,
        start,
        end: closeAt + rule.close.length,
        inner: text.slice(afterOpen, closeAt),
      };
    }
  }

  return best;
}

function walk(text: string, out: ReactNode[], keyRef: { value: number }) {
  let rest = text;

  while (rest) {
    const match = findFirstRule(rest);

    if (!match) {
      out.push(<Fragment key={keyRef.value++}>{rest}</Fragment>);
      break;
    }

    if (match.start > 0) {
      out.push(<Fragment key={keyRef.value++}>{rest.slice(0, match.start)}</Fragment>);
    }

    const Tag = match.rule.tag;
    const inner: ReactNode[] = [];
    walk(match.inner, inner, keyRef);
    out.push(<Tag key={keyRef.value++}>{inner}</Tag>);

    rest = rest.slice(match.end);
  }
}

/**
 * Convierte texto con marcadores en nodos React. Si no hay marcadores devuelve
 * el string tal cual (camino rápido, sin trabajo extra ni claves).
 */
export function renderRichText(text: string): ReactNode {
  if (!text) return text;
  if (!/[*_]/.test(text)) return text;

  const out: ReactNode[] = [];
  walk(text, out, { value: 0 });
  return out;
}
