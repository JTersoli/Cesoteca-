import { LIBRARY_POINTS } from "@/lib/library-points";
import type { SectionItem } from "@/lib/section-data";

export type PositionedLibraryItem = {
  item: SectionItem;
  page: number;
  slot: number;
};

export type LibrarySlotKey = `${number}:${number}`;

export function getLibrarySlotKey(page: number, slot: number): LibrarySlotKey {
  return `${page}:${slot}`;
}

const PAGE_SIZE = LIBRARY_POINTS.length;

function normalizePositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : undefined;
}

export function getLibraryPageSize() {
  return PAGE_SIZE;
}

export function buildLibraryPlacements(items: SectionItem[]) {
  const occupied = new Set<string>();
  const positioned: PositionedLibraryItem[] = [];
  const unassigned: SectionItem[] = [];

  for (const item of items) {
    const page = normalizePositiveInteger(item.libraryPage);
    const slot = normalizePositiveInteger(item.librarySlot);

    if (!page || !slot || slot > PAGE_SIZE) {
      unassigned.push(item);
      continue;
    }

    const key = getLibrarySlotKey(page, slot);
    if (occupied.has(key)) {
      unassigned.push(item);
      continue;
    }

    occupied.add(key);
    positioned.push({ item, page, slot });
  }

  let page = 1;
  let slot = 1;

  for (const item of unassigned) {
    while (occupied.has(getLibrarySlotKey(page, slot))) {
      slot += 1;
      if (slot > PAGE_SIZE) {
        page += 1;
        slot = 1;
      }
    }

    occupied.add(getLibrarySlotKey(page, slot));
    positioned.push({ item, page, slot });
  }

  return positioned.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.slot - b.slot;
  });
}

export function getOccupiedLibrarySlotKeys<
  T extends { slug: string; libraryPage?: number; librarySlot?: number }
>(
  items: T[],
  options?: {
    excludeSlug?: string;
  }
) {
  const occupied = new Set<LibrarySlotKey>();

  for (const item of items) {
    if (options?.excludeSlug && item.slug === options.excludeSlug) {
      continue;
    }

    const page = normalizePositiveInteger(item.libraryPage);
    const slot = normalizePositiveInteger(item.librarySlot);
    if (!page || !slot || slot > PAGE_SIZE) continue;
    occupied.add(getLibrarySlotKey(page, slot));
  }

  return occupied;
}
