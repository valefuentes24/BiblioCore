import { searchBooks } from "../services/api";

/**
 * Cuántos libros intentas mostrar (Google permite máx. 40 por llamada a su API).
 */
const API_PAGE_SIZE = 40;
const API_PAGES_PER_UI = 2;
const MIN_VISIBLE_GOOGLE = 50;
/** Tope de vistas en Libros (evita páginas altas donde falla el encadenamiento con la API). */
export const MAX_UI_VIEWS = 4;
const BACKEND_API_PAGE_CAP_FALLBACK = 40;

function normalizeGooglePayload(data) {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      pageSize: data.length,
      totalItems: data.length,
      totalPages: 1,
      hasNextPage: false,
      maxPages: 1,
    };
  }
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? API_PAGE_SIZE,
    totalItems: data?.totalItems ?? 0,
    totalPages: Math.max(1, data?.totalPages ?? 1),
    hasNextPage: !!data?.hasNextPage,
    maxPages: data?.maxPages ?? BACKEND_API_PAGE_CAP_FALLBACK,
  };
}

export function sortByTitle(a, b) {
  return (a.title || "").localeCompare(b.title || "", "es", { sensitivity: "base" });
}

export function mergeGoogleItems(listA, listB) {
  const seen = new Set();
  const out = [];
  for (const b of [...(listA || []), ...(listB || [])]) {
    const k = b.id || b._id || `${(b.title || "").toLowerCase()}|${(b.author || "").toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(b);
  }
  return out;
}

/**
 * Cada “vista” UI pide varias páginas a la API (40 por llamada) y las une.
 */
export async function fetchGoogleUiPage(query, uiPage, orderBy = "relevance") {
  const startApi = (uiPage - 1) * API_PAGES_PER_UI + 1;
  const base = { maxResults: API_PAGE_SIZE, orderBy };
  let nextStartIndex;
  const norms = [];

  for (let i = 0; i < API_PAGES_PER_UI; i += 1) {
    const params = { ...base, page: startApi + i };
    if (nextStartIndex !== undefined) {
      params.startIndex = nextStartIndex;
    }
    try {
      const res = await searchBooks(query, params);
      const data = res.data || {};
      norms.push(normalizeGooglePayload(data));
      if (typeof data.nextStartIndex === "number" && !Number.isNaN(data.nextStartIndex)) {
        nextStartIndex = data.nextStartIndex;
      }
    } catch (_err) {
      norms.push(normalizeGooglePayload({ items: [], maxPages: 0 }));
    }
  }
  let merged = [];
  for (const n of norms) {
    merged = mergeGoogleItems(merged, n.items);
  }
  merged = merged.sort(sortByTitle);

  const totalItems =
    norms.length > 0
      ? Math.max(...norms.map((n) => n.totalItems || 0))
      : 0;
  const capsReported = norms.map((n) => n.maxPages).filter((x) => typeof x === "number" && x > 0);
  const backendApiPageCap =
    capsReported.length > 0
      ? Math.max(...capsReported)
      : BACKEND_API_PAGE_CAP_FALLBACK;
  const maxUiFromBackend = Math.max(
    1,
    Math.floor(backendApiPageCap / API_PAGES_PER_UI)
  );

  const approxPerUi = API_PAGE_SIZE * API_PAGES_PER_UI;
  let totalPages = 1;
  if (totalItems > 0) {
    totalPages = Math.min(
      MAX_UI_VIEWS,
      maxUiFromBackend,
      Math.max(1, Math.ceil(totalItems / approxPerUi))
    );
  } else if (merged.length >= MIN_VISIBLE_GOOGLE) {
    totalPages = Math.min(MAX_UI_VIEWS, maxUiFromBackend, Math.max(2, uiPage + 1));
  } else if (merged.length > API_PAGE_SIZE) {
    totalPages = Math.min(MAX_UI_VIEWS, maxUiFromBackend, 2);
  } else {
    totalPages = Math.min(MAX_UI_VIEWS, maxUiFromBackend, 1);
  }

  if (merged.length === 0 && uiPage > 1) {
    totalPages = Math.min(totalPages, Math.max(1, uiPage - 1));
  }

  totalPages = Math.max(1, Math.min(totalPages, MAX_UI_VIEWS));

  const hasNextPage = uiPage < totalPages;

  return {
    items: merged,
    pagination: {
      page: uiPage,
      pageSize: merged.length,
      totalItems,
      totalPages,
      hasNextPage,
      maxPages: MAX_UI_VIEWS,
    },
  };
}

export function localMatchesCategory(book, filtroId) {
  if (filtroId === "all") return true;
  const cat = book.category || "narrativa";
  return cat === filtroId;
}

export function mergeLocalAndExplore(locals, explore) {
  const seen = new Set();
  const out = [];
  for (const b of locals) {
    const k = `${(b.title || "").toLowerCase()}|${(b.author || "").toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...b, _source: "local" });
  }
  for (const b of explore) {
    const k = `${(b.title || "").toLowerCase()}|${(b.author || "").toLowerCase()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...b, _source: "google" });
  }
  return out.sort(sortByTitle);
}

