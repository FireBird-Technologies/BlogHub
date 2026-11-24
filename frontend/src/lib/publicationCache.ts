import type { Query, QueryClient } from "@tanstack/react-query";
import type { Publication } from "../types/models";
import { publicationShortId } from "./publicationUrl";

/**
 * Query key prefixes that hold lists of publications. Each holds either a single
 * page ({ items, total }) or an infinite query ({ pages: [{ items, total }] }).
 * Keys match by their first element, so "publications-preview" does NOT cover
 * "publications-preview-infinite": every prefix must be listed.
 */
const PUBLICATION_LIST_KEYS = [
  "publications",
  "publications-preview",
  "publications-preview-infinite",
  "sidebar-publications",
  "user-publications",
] as const;

/** Data derived from the set of publications (changes when one is added/removed). */
const PUBLICATION_DERIVED_KEYS = ["categories", "publication-tags"] as const;

type ListPage = { items: Publication[]; total?: number };

const sameId = (a: unknown, b: unknown) => String(a) === String(b);

function isListQuery(query: Query): boolean {
  const head = query.queryKey[0];
  return typeof head === "string" && (PUBLICATION_LIST_KEYS as readonly string[]).includes(head);
}

/** True for a ["publication", <id or short id>, ...] detail query of `id`. */
export function isPublicationDetailKey(queryKey: readonly unknown[], id: string): boolean {
  if (queryKey[0] !== "publication") return false;
  const key = String(queryKey[1]);
  return key === String(id) || key === publicationShortId(id);
}

function isListPage(value: unknown): value is ListPage {
  return !!value && typeof value === "object" && Array.isArray((value as ListPage).items);
}

/** Apply `fn` to every page of a cached list, whichever shape it has. */
function mapListData(data: unknown, fn: (page: ListPage) => ListPage): unknown {
  if (!data || typeof data !== "object") return data;
  const o = data as { pages?: unknown[] };
  if (Array.isArray(o.pages)) {
    let changed = false;
    const pages = o.pages.map((p) => {
      if (!isListPage(p)) return p;
      const next = fn(p);
      if (next !== p) changed = true;
      return next;
    });
    return changed ? { ...o, pages } : data;
  }
  return isListPage(data) ? fn(data) : data;
}

/** Find a publication in one cached query's data (list of either shape, or detail). */
export function findPublicationInData(data: unknown, id: string): Publication | undefined {
  if (!data || typeof data !== "object") return undefined;
  const o = data as { pages?: unknown[]; id?: unknown };
  const pages: unknown[] = Array.isArray(o.pages) ? o.pages : [data];
  for (const p of pages) {
    if (isListPage(p)) {
      const hit = p.items.find((item) => sameId(item.id, id));
      if (hit) return hit;
    }
  }
  return "id" in o && sameId(o.id, id) ? (data as Publication) : undefined;
}

/** Every cached query that may contain publication `id` (lists + its detail). */
export function publicationQueriesFilter(id: string) {
  return {
    predicate: (q: Query) => isListQuery(q) || isPublicationDetailKey(q.queryKey, id),
  };
}

/**
 * Patch one publication in every cached list and its detail record, in place,
 * so every page shows the change immediately with no refetch.
 */
export function patchPublicationInCache(
  queryClient: QueryClient,
  id: string,
  patch: Partial<Publication>,
) {
  queryClient.setQueriesData({ predicate: isListQuery }, (data: unknown) =>
    mapListData(data, (page) =>
      page.items.some((item) => sameId(item.id, id))
        ? { ...page, items: page.items.map((item) => (sameId(item.id, id) ? { ...item, ...patch } : item)) }
        : page,
    ),
  );
  queryClient.setQueriesData(
    { predicate: (q) => isPublicationDetailKey(q.queryKey, id) },
    (data: Publication | undefined) => (data ? { ...data, ...patch } : data),
  );
}

/**
 * Remove a deleted publication from every cached list and drop its detail
 * record. Categories/tags may change too, so those are marked stale.
 * Offset-paged caches will not shift later items up a page until refetched.
 */
export function removePublicationFromCache(queryClient: QueryClient, id: string) {
  queryClient.setQueriesData({ predicate: isListQuery }, (data: unknown) =>
    mapListData(data, (page) => {
      const items = page.items.filter((item) => !sameId(item.id, id));
      if (items.length === page.items.length) return page;
      return { ...page, items, total: Math.max(0, (page.total ?? 0) - 1) };
    }),
  );
  queryClient.removeQueries({ predicate: (q) => isPublicationDetailKey(q.queryKey, id) });
  for (const key of PUBLICATION_DERIVED_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

/**
 * The global QueryClient uses `staleTime: Infinity`, so cached publication data
 * is only refreshed when something calls this. Use it when the server decides
 * the result (a new publication's position in sorted/filtered lists, an edit
 * that may move it between categories, a profile change). For upvotes and
 * deletes prefer the in-place helpers above: they avoid refetches entirely.
 *
 * Active queries refetch immediately; inactive ones are marked stale and
 * refetch the next time a page mounts them.
 */
export function invalidatePublicationData(queryClient: QueryClient, publicationId?: string) {
  for (const key of [...PUBLICATION_LIST_KEYS, ...PUBLICATION_DERIVED_KEYS]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
  if (publicationId) {
    queryClient.invalidateQueries({
      predicate: (q) => isPublicationDetailKey(q.queryKey, publicationId),
    });
  }
}
