import { useEffect, useMemo, useRef, useState } from "react";
import { getBooks, createBook, deleteBook } from "../services/api";
import {
  fetchGoogleUiPage,
  sortByTitle,
  localMatchesCategory,
  mergeLocalAndExplore,
  MAX_UI_VIEWS,
} from "../utils/googleBooksSearch";
import { useUserLoans } from "../hooks/useUserLoans";
import BookLoanActions from "../components/BookLoanActions";
import { findLocalBookMatch } from "../utils/matchLocalBook";

/** Estantes: consulta a Google Books por categoría (explorar sin buscar) */
const CATEGORIAS = [
  { id: "all", label: "Todo", exploreQuery: "novel" },
  { id: "narrativa", label: "Narrativa", exploreQuery: "subject:fiction" },
  { id: "ensayo", label: "Ensayo y hechos", exploreQuery: "subject:nonfiction" },
  { id: "ciencia", label: "Ciencia y tecnología", exploreQuery: "subject:science" },
  { id: "historia", label: "Historia", exploreQuery: "subject:history" },
  { id: "biografias", label: "Biografías", exploreQuery: "subject:biography" },
  { id: "infantil", label: "Infantil y juvenil", exploreQuery: "subject:juvenile+fiction" },
];

function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("all");
  /** Volumen de Google Books desde el que se abre el alta (solo datos de la API). */
  const [altaDesdeApi, setAltaDesdeApi] = useState(null);
  const [altaCategory, setAltaCategory] = useState("narrativa");
  const [mensaje, setMensaje] = useState("");
  const [altaBusy, setAltaBusy] = useState(false);
  const [externalBooks, setExternalBooks] = useState([]);
  const [exploreBooks, setExploreBooks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [exploreError, setExploreError] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [googlePage, setGooglePage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 80,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    maxPages: MAX_UI_VIEWS,
  });
  const prevDebouncedSearch = useRef("");
  const { activeByBookId, refresh: refreshLoans, userId } = useUserLoans();

  const metaActual = useMemo(
    () => CATEGORIAS.find((c) => c.id === filtro) || CATEGORIAS[0],
    [filtro]
  );

  useEffect(() => {
    cargarLibros();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = search.trim();
      if (prevDebouncedSearch.current !== next) {
        prevDebouncedSearch.current = next;
        setGooglePage(1);
      }
      setDebouncedSearch(next);
    }, 450);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const query = debouncedSearch;

    if (!query) {
      setExternalBooks([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsSearching(true);
        setSearchError("");
        const { items, pagination: pag } = await fetchGoogleUiPage(query, googlePage);
        if (!cancelled) {
          setExternalBooks(items);
          setPagination(pag);
        }
      } catch (err) {
        if (!cancelled) {
          setExternalBooks([]);
          setSearchError(err.response?.data?.error || "No se pudo buscar en Google Books");
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, googlePage]);

  useEffect(() => {
    if (debouncedSearch) return;

    let cancelled = false;

    (async () => {
      try {
        setExploreLoading(true);
        setExploreError("");
        const { items, pagination: pag } = await fetchGoogleUiPage(
          metaActual.exploreQuery,
          googlePage
        );
        if (!cancelled) {
          setExploreBooks(items);
          setPagination(pag);
        }
      } catch (err) {
        if (!cancelled) {
          setExploreBooks([]);
          setExploreError(
            err.response?.data?.error ||
              "No se pudieron cargar sugerencias por categoría"
          );
        }
      } finally {
        if (!cancelled) setExploreLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [metaActual, debouncedSearch, googlePage]);

  useEffect(() => {
    const cap = Math.min(Math.max(1, pagination.totalPages), MAX_UI_VIEWS);
    setGooglePage((p) => (p > cap ? cap : p));
  }, [pagination.totalPages]);

  const cargarLibros = async () => {
    try {
      const res = await getBooks();
      setBooks(Array.isArray(res.data) ? res.data : []);
    } catch (_err) {
      console.log("Error cargando libros");
      setBooks([]);
    }
  };

  const abrirAltaDesdeApi = (apiBook) => {
    setAltaDesdeApi(apiBook);
    setAltaCategory(filtro !== "all" ? filtro : "narrativa");
  };

  const guardarAltaDesdeApi = async () => {
    if (!altaDesdeApi?.title) return;
    try {
      setAltaBusy(true);
      await createBook({
        title: altaDesdeApi.title,
        author: altaDesdeApi.author || "Autor desconocido",
        coverUrl: altaDesdeApi.coverUrl || "",
        category: altaCategory,
      });
      setMensaje("Libro añadido al catálogo desde Google Books ✅");
      setAltaDesdeApi(null);
      await cargarLibros();
      setTimeout(() => setMensaje(""), 2500);
    } catch (_err) {
      setMensaje("No se pudo añadir el libro");
    } finally {
      setAltaBusy(false);
    }
  };

  const localesFiltrados = books.filter((b) => {
    if (!localMatchesCategory(b, filtro)) return false;
    const q = debouncedSearch.toLowerCase();
    if (!q) return true;
    return (
      (b.title || "").toLowerCase().includes(q) ||
      (b.author || "").toLowerCase().includes(q)
    );
  });

  const librosMostrados = debouncedSearch
    ? [...externalBooks].sort(sortByTitle)
    : googlePage === 1
      ? mergeLocalAndExplore(localesFiltrados, exploreBooks)
      : [...exploreBooks].sort(sortByTitle);

  const mostrarEstadoCarga = debouncedSearch
    ? isSearching
    : exploreLoading && !debouncedSearch;

  const totalPagesUi = Math.min(
    Math.max(1, pagination.totalPages),
    MAX_UI_VIEWS
  );

  const goToPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPagesUi);
    setGooglePage(next);
  };

  const pageNumbers = Array.from({ length: totalPagesUi }, (_, i) => i + 1);

  const onLoanChange = async () => {
    await refreshLoans();
    await cargarLibros();
  };

  const quitarDelCatalogo = async (bookId) => {
    if (!bookId) return;
    const prestamo = activeByBookId[String(bookId)];
    if (prestamo?.status === "active") {
      window.alert("Devuelve el libro antes de quitarlo del catálogo (Mis libros).");
      return;
    }
    if (
      !window.confirm(
        "¿Quitar este título del catálogo? Se elimina del inventario de la biblioteca."
      )
    ) {
      return;
    }
    try {
      await deleteBook(bookId);
      setMensaje("Título eliminado del catálogo.");
      await cargarLibros();
      await refreshLoans();
      setTimeout(() => setMensaje(""), 2500);
    } catch (err) {
      setMensaje(err.response?.data?.message || "No se pudo eliminar");
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>Explorar libros</h2>
          <p style={styles.topHint}>
            El catálogo solo se amplía con volúmenes de Google Books: usa <strong>Añadir al catálogo</strong> en la tarjeta.
          </p>
        </div>
      </div>

      {mensaje && (
        <p style={{ color: "var(--success-text)", fontSize: "13px", marginBottom: "12px" }}>{mensaje}</p>
      )}

      <div style={styles.searchBox}>
        <span>🔍</span>
        <input
          style={styles.searchInput}
          placeholder="Buscar en Google Books (título o autor)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {mostrarEstadoCarga && (
        <p style={styles.statusText}>
          {debouncedSearch ? "Buscando en Google Books…" : "Cargando sugerencias para este estante…"}
        </p>
      )}
      {!mostrarEstadoCarga && searchError && debouncedSearch && (
        <p style={styles.statusError}>{searchError}</p>
      )}
      {!mostrarEstadoCarga && exploreError && !debouncedSearch && (
        <p style={styles.statusError}>{exploreError}</p>
      )}
      {!mostrarEstadoCarga && debouncedSearch && !searchError && librosMostrados.length === 0 && (
        <p style={styles.statusText}>Sin resultados para "{debouncedSearch}"</p>
      )}
      {!mostrarEstadoCarga && !debouncedSearch && !exploreError && librosMostrados.length === 0 && (
        <p style={styles.statusText}>No hay libros para mostrar.</p>
      )}

      <div style={styles.categorias}>
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            style={{ ...styles.catBtn, ...(filtro === cat.id ? styles.catBtnActive : {}) }}
            onClick={() => { setFiltro(cat.id); setGooglePage(1); }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={styles.grid}>
        {librosMostrados.map((book) => {
          const localMatch = book._id ? null : findLocalBookMatch(book, books);
          const bookForLoan = localMatch
            ? {
                ...book,
                _id: localMatch._id,
                available: localMatch.available,
                quantity: localMatch.quantity,
              }
            : book;
          const esSoloApi = book.id != null && !book._id && !localMatch;

          return (
            <div key={`${book._id || book.id}-${googlePage}`} style={styles.bookCard}>
              <div style={styles.bookCover}>
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} style={styles.coverImg} />
                ) : (
                  <div style={styles.coverPlaceholder}>
                    <span style={{ fontSize: "48px" }}>📗</span>
                  </div>
                )}
                {(book._id || localMatch) && (
                  <div
                    style={{
                      ...styles.badgeOverlay,
                      backgroundColor:
                        bookForLoan.available !== false
                          ? "var(--overlay-available)"
                          : "var(--overlay-loaned)",
                    }}
                  >
                    {bookForLoan.available !== false ? "En catálogo" : "Sin ejemplares"}
                  </div>
                )}
              </div>
              {(book.categoryLabel || book.category) && (
                <p style={styles.catChip}>
                  {book.categoryLabel || CATEGORIAS.find((c) => c.id === book.category)?.label}
                </p>
              )}
              <p style={styles.bookTitle}>{book.title}</p>
              <p style={styles.bookAuthor}>{book.author}</p>
              {esSoloApi && (
                <button
                  type="button"
                  style={styles.btnAnadirCatalogo}
                  onClick={() => abrirAltaDesdeApi(book)}
                >
                  Añadir al catálogo (API)
                </button>
              )}
              <BookLoanActions
                book={bookForLoan}
                userId={userId}
                loanForBook={
                  bookForLoan._id ? activeByBookId[String(bookForLoan._id)] : null
                }
                onAfterChange={onLoanChange}
                variant="card"
              />
              {bookForLoan._id && (
                <button
                  type="button"
                  style={styles.btnQuitarCatalogo}
                  onClick={() => quitarDelCatalogo(bookForLoan._id)}
                >
                  Quitar del catálogo
                </button>
              )}
            </div>
          );
        })}
      </div>

      {altaDesdeApi && (
        <div style={styles.altaPanel}>
          <p style={styles.altaPanelTitle}>Añadir al catálogo — datos de Google Books</p>
          <p style={styles.altaPanelMeta}>
            <strong>{altaDesdeApi.title}</strong>
            <br />
            {altaDesdeApi.author}
          </p>
          <label style={styles.altaLabel}>
            Estante
            <select
              style={styles.input}
              value={altaCategory}
              onChange={(e) => setAltaCategory(e.target.value)}
            >
              {CATEGORIAS.filter((c) => c.id !== "all").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div style={styles.altaActions}>
            <button
              type="button"
              style={styles.btnGuardar}
              disabled={altaBusy}
              onClick={guardarAltaDesdeApi}
            >
              {altaBusy ? "Guardando…" : "Guardar en catálogo"}
            </button>
            <button
              type="button"
              style={styles.btnCancelarAlta}
              disabled={altaBusy}
              onClick={() => setAltaDesdeApi(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {totalPagesUi > 1 && (
        <div style={styles.pagination}>
          <button
            type="button"
            style={{ ...styles.pageNavBtn, ...(googlePage <= 1 ? styles.pageNavBtnDisabled : {}) }}
            disabled={googlePage <= 1}
            onClick={() => goToPage(googlePage - 1)}
          >
            Anterior
          </button>
          <div style={styles.pageNumbers}>
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                style={{ ...styles.pageNumBtn, ...(p === googlePage ? styles.pageNumBtnActive : {}) }}
                onClick={() => goToPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            style={{ ...styles.pageNavBtn, ...(googlePage >= totalPagesUi ? styles.pageNavBtnDisabled : {}) }}
            disabled={googlePage >= totalPagesUi}
            onClick={() => goToPage(googlePage + 1)}
          >
            Siguiente
          </button>
          <span style={styles.pageCap}>{totalPagesUi} vistas</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "24px 32px", color: "var(--text-primary)", minHeight: "100vh", backgroundColor: "var(--bg-page)" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  title: { fontSize: "22px", fontWeight: "bold", margin: 0 },
  topHint: { margin: "8px 0 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.45, maxWidth: "520px" },
  btnAnadirCatalogo: {
    margin: "0 12px 8px 12px",
    width: "calc(100% - 24px)",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--warning-soft)",
    color: "var(--warning-text)",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
  },
  btnQuitarCatalogo: {
    margin: "0 12px 12px 12px",
    width: "calc(100% - 24px)",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "transparent",
    color: "var(--error-soft)",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
  },
  altaPanel: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    left: "24px",
    maxWidth: "400px",
    marginLeft: "auto",
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "var(--shadow-card)",
    zIndex: 50,
  },
  altaPanelTitle: { margin: "0 0 8px 0", fontSize: "14px", fontWeight: "bold" },
  altaPanelMeta: { margin: "0 0 14px 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.4 },
  altaLabel: { display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", marginBottom: "12px", color: "var(--text-muted)" },
  altaActions: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" },
  btnCancelarAlta: {
    padding: "12px 16px",
    backgroundColor: "transparent",
    color: "var(--text-muted)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)", color: "var(--text-primary)", fontSize: "14px", outline: "none" },
  btnGuardar: { padding: "12px", backgroundColor: "var(--accent)", color: "var(--on-accent)", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "14px" },
  searchBox: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "var(--bg-surface)", padding: "12px 16px", borderRadius: "10px", marginBottom: "8px", border: "1px solid var(--border-subtle)" },
  searchInput: { background: "none", border: "none", color: "var(--text-primary)", fontSize: "15px", outline: "none", flex: 1 },
  hint: { color: "var(--text-muted)", fontSize: "12px", marginBottom: "8px", lineHeight: 1.4 },
  metaLine: { color: "var(--text-subtle)", fontSize: "12px", marginBottom: "12px" },
  pagination: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" },
  pageNavBtn: { backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  pageNavBtnDisabled: { opacity: 0.35, cursor: "not-allowed" },
  pageNumbers: { display: "flex", flexWrap: "wrap", gap: "6px" },
  pageNumBtn: { minWidth: "40px", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  pageNumBtnActive: { backgroundColor: "var(--accent)", color: "var(--on-accent)", borderColor: "transparent" },
  pageCap: { color: "var(--text-muted)", fontSize: "12px", marginLeft: "auto" },
  statusText: { marginBottom: "14px", color: "var(--text-subtle)", fontSize: "13px" },
  statusError: { marginBottom: "14px", color: "var(--error-soft)", fontSize: "13px" },
  categorias: { display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" },
  catBtn: { backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)", borderRadius: "20px", padding: "8px 16px", cursor: "pointer", fontSize: "13px" },
  catBtnActive: { backgroundColor: "var(--accent)", color: "var(--on-accent)", fontWeight: "bold", borderColor: "transparent" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" },
  bookCard: { backgroundColor: "var(--bg-surface)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" },
  bookCover: { position: "relative", height: "220px", backgroundColor: "var(--bg-input)", display: "flex", justifyContent: "center", alignItems: "center" },
  coverImg: { width: "100%", height: "100%", objectFit: "cover" },
  coverPlaceholder: { display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%" },
  badgeOverlay: { position: "absolute", bottom: "10px", left: "10px", color: "var(--on-accent)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "bold" },
  catChip: { margin: "8px 12px 0", fontSize: "11px", color: "var(--chip-accent)", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  bookTitle: { color: "var(--text-primary)", fontSize: "14px", fontWeight: "bold", margin: "10px 12px 4px 12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  bookAuthor: { color: "var(--text-muted)", fontSize: "12px", margin: "0 12px 12px 12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
};

export default Books;