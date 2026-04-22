function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Encuentra un ejemplar del catálogo local con el mismo título y autor (para vitrinas de Google). */
export function findLocalBookMatch(googleLikeBook, locals) {
  if (!googleLikeBook || !Array.isArray(locals) || locals.length === 0) return null;
  const t = norm(googleLikeBook.title);
  const a = norm(googleLikeBook.author);
  if (!t) return null;
  return locals.find((b) => norm(b.title) === t && norm(b.author) === a) || null;
}
