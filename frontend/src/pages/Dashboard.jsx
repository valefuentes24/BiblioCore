import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteBook, getBooks, searchBooks } from "../services/api";
import { useUserLoans } from "../hooks/useUserLoans";
import BookLoanActions from "../components/BookLoanActions";
import { findLocalBookMatch } from "../utils/matchLocalBook";
import { fetchGoogleUiPage, MAX_UI_VIEWS } from "../utils/googleBooksSearch";

/**
 * Cuatro “páginas” de inicio: consultas distintas a los estantes de Libros.jsx
 * (all→novel, fiction, nonfiction, science, history, biography, juvenile+fiction).
 */
const PAGINAS_DESTACADAS = [
  {
    id: "p1",
    num: "01",
    title: "Literatura premiada",
    blurb: "Títulos ligados al Nobel y otros reconocimientos internacionales.",
    query: "Nobel Prize Literature",
  },
  {
    id: "p2",
    num: "02",
    title: "Novela gráfica",
    blurb: "Narrativa visual y cómic de autor.",
    query: "graphic novel award",
  },
  {
    id: "p3",
    num: "03",
    title: "Filosofía accesible",
    blurb: "Ideas grandes explicadas para empezar.",
    query: "philosophy introduction popular",
  },
  {
    id: "p4",
    num: "04",
    title: "Ciencia y voces diversas",
    blurb: "Divulgación con enfoque en trayectorias menos habituales.",
    query: "women in science popular",
  },
];

const MAX_POR_PAGINA = 12;

function StripBookCard({
  book,
  catalogoLocal,
  activeByBookId,
  userId,
  onLoanChange,
  quitarDelCatalogo,
}) {
  const match = findLocalBookMatch(book, catalogoLocal);
  const bookForLoan = match
    ? {
        ...book,
        _id: match._id,
        available: match.available,
        quantity: match.quantity,
      }
    : book;
  return (
    <article style={styles.stripCard} role="listitem">
      <div style={styles.stripCover}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt="" style={styles.stripImg} />
        ) : (
          <span style={{ fontSize: "36px" }}>📗</span>
        )}
      </div>
      <p style={styles.stripTitle}>{book.title}</p>
      <p style={styles.stripAuthor}>{book.author}</p>
      <BookLoanActions
        book={bookForLoan}
        userId={userId}
        loanForBook={bookForLoan._id ? activeByBookId[String(bookForLoan._id)] : null}
        onAfterChange={onLoanChange}
        variant="strip"
      />
      {match?._id && (
        <button
          type="button"
          style={styles.btnQuitarStrip}
          onClick={() => quitarDelCatalogo(match._id)}
        >
          Quitar cat.
        </button>
      )}
    </article>
  );
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [catalogoLocal, setCatalogoLocal] = useState([]);
  const [paginas, setPaginas] = useState(() =>
    PAGINAS_DESTACADAS.map((p) => ({ ...p, items: [], loading: true, error: null }))
  );
  const [busqueda, setBusqueda] = useState("");
  const [debouncedBusqueda, setDebouncedBusqueda] = useState("");
  const prevDebouncedBusqueda = useRef("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [busquedaPagination, setBusquedaPagination] = useState({
    page: 1,
    totalPages: 1,
  });
  const [busquedaLoading, setBusquedaLoading] = useState(false);
  const [busquedaError, setBusquedaError] = useState("");
  const [busquedaPage, setBusquedaPage] = useState(1);
  const navigate = useNavigate();
  const { activeByBookId, refresh: refreshLoans, userId } = useUserLoans();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "null");
    if (userData) setUser(userData);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getBooks();
        const raw = res?.data;
        setCatalogoLocal(Array.isArray(raw) ? raw : Array.isArray(raw?.books) ? raw.books : []);
      } catch (_e) {
        setCatalogoLocal([]);
      }
    })();
  }, []);

  const onLoanChange = async () => {
    await refreshLoans();
    try {
      const res = await getBooks();
      const raw = res?.data;
      setCatalogoLocal(Array.isArray(raw) ? raw : Array.isArray(raw?.books) ? raw.books : []);
    } catch (_e) {
      /* ignore */
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      const next = busqueda.trim();
      if (prevDebouncedBusqueda.current !== next) {
        prevDebouncedBusqueda.current = next;
        setBusquedaPage(1);
      }
      setDebouncedBusqueda(next);
    }, 450);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    if (!debouncedBusqueda) {
      setResultadosBusqueda([]);
      setBusquedaError("");
      setBusquedaLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setBusquedaLoading(true);
        setBusquedaError("");
        const { items, pagination: pag } = await fetchGoogleUiPage(debouncedBusqueda, busquedaPage);
        if (!cancelled) {
          setResultadosBusqueda(items);
          setBusquedaPagination({
            page: pag.page,
            totalPages: pag.totalPages,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setResultadosBusqueda([]);
          setBusquedaError(err.response?.data?.error || "No se pudo buscar");
        }
      } finally {
        if (!cancelled) setBusquedaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedBusqueda, busquedaPage]);

  useEffect(() => {
    const cap = Math.min(Math.max(1, busquedaPagination.totalPages || 1), MAX_UI_VIEWS);
    setBusquedaPage((p) => (p > cap ? cap : p));
  }, [busquedaPagination.totalPages]);

  const totalPagesBusquedaUi = Math.min(
    Math.max(1, busquedaPagination.totalPages || 1),
    MAX_UI_VIEWS
  );

  const goBusquedaPage = (p) => {
    setBusquedaPage(Math.min(Math.max(1, p), totalPagesBusquedaUi));
  };

  const pageNumbersBusqueda = Array.from({ length: totalPagesBusquedaUi }, (_, i) => i + 1);

  const quitarDelCatalogo = async (bookId) => {
    if (!bookId) return;
    const prestamo = activeByBookId[String(bookId)];
    if (prestamo?.status === "active") {
      window.alert("Devuelve el libro antes de quitarlo del catálogo.");
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
      await onLoanChange();
    } catch (err) {
      window.alert(err.response?.data?.message || "No se pudo eliminar");
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const resultados = await Promise.all(
        PAGINAS_DESTACADAS.map(async (p) => {
          try {
            const res = await searchBooks(p.query, { maxResults: MAX_POR_PAGINA, page: 1 });
            const items = Array.isArray(res.data?.items) ? res.data.items : [];
            return { ...p, items, loading: false, error: null };
          } catch (err) {
            return {
              ...p,
              items: [],
              loading: false,
              error: err.response?.data?.error || "No se pudo cargar esta selección.",
            };
          }
        })
      );
      if (!cancelled) setPaginas(resultados);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={styles.shell}>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.brand}>bibliocore</h1>
          <p style={styles.brandSub}>Cuatro vitrinas de lectura · datos de Google Books</p>
        </div>
        <div style={styles.topRight}>
          <span style={styles.userName}>{user?.name || "Usuario"}</span>
          <button type="button" style={styles.btnLibros} onClick={() => navigate("/books")}>
            Ir a Libros
          </button>
          <div style={styles.avatar} onClick={() => navigate("/perfil")} title="Perfil">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      </div>

      <p style={styles.intro}>
        Busca un título o autor abajo: si ya está en el catálogo, podrás{" "}
        <strong>pedir préstamo</strong> desde el resultado. Las vitrinas siguen siendo selecciones distintas a{" "}
        <strong>Libros</strong>; desliza cada fila para ver más.
      </p>

      <div style={styles.searchBox}>
        <span aria-hidden>🔍</span>
        <input
          type="search"
          style={styles.searchInput}
          placeholder="Buscar libro (título o autor)…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar libro"
        />
      </div>

      {debouncedBusqueda && busquedaLoading && (
        <p style={styles.status}>Buscando…</p>
      )}
      {debouncedBusqueda && !busquedaLoading && busquedaError && (
        <p style={styles.statusError}>{busquedaError}</p>
      )}
      {debouncedBusqueda && !busquedaLoading && !busquedaError && resultadosBusqueda.length === 0 && (
        <p style={styles.status}>Sin resultados para «{debouncedBusqueda}»</p>
      )}

      {debouncedBusqueda && !busquedaLoading && !busquedaError && resultadosBusqueda.length > 0 && (
        <section style={styles.searchBlock} aria-labelledby="titulo-busqueda-inicio">
          <h2 id="titulo-busqueda-inicio" style={styles.searchHeading}>
            Resultados de búsqueda
          </h2>
          <p style={styles.searchHint}>
            <strong>Pedir préstamo</strong> solo está disponible cuando el título coincide con una ficha del catálogo
            local (mismo título y autor). Si no aparece el botón, añádelo primero en <strong>Libros</strong>.
          </p>
          <div style={styles.strip} role="list">
            {resultadosBusqueda.map((book) => (
              <StripBookCard
                key={`busq-${book.id}-${busquedaPage}`}
                book={book}
                catalogoLocal={catalogoLocal}
                activeByBookId={activeByBookId}
                userId={userId}
                onLoanChange={onLoanChange}
                quitarDelCatalogo={quitarDelCatalogo}
              />
            ))}
          </div>
          {totalPagesBusquedaUi > 1 && (
            <div style={styles.searchPagination}>
              <button
                type="button"
                style={{
                  ...styles.pageNavBtn,
                  ...(busquedaPage <= 1 ? styles.pageNavBtnDisabled : {}),
                }}
                disabled={busquedaPage <= 1}
                onClick={() => goBusquedaPage(busquedaPage - 1)}
              >
                Anterior
              </button>
              <div style={styles.pageNumbers}>
                {pageNumbersBusqueda.map((p) => (
                  <button
                    key={p}
                    type="button"
                    style={{
                      ...styles.pageNumBtn,
                      ...(p === busquedaPage ? styles.pageNumBtnActive : {}),
                    }}
                    onClick={() => goBusquedaPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                style={{
                  ...styles.pageNavBtn,
                  ...(busquedaPage >= totalPagesBusquedaUi ? styles.pageNavBtnDisabled : {}),
                }}
                disabled={busquedaPage >= totalPagesBusquedaUi}
                onClick={() => goBusquedaPage(busquedaPage + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      )}

      <div style={styles.pagesStack}>
        {paginas.map((pag) => (
          <section key={pag.id} style={styles.pageBlock} aria-labelledby={`titulo-${pag.id}`}>
            <div style={styles.pageHeader}>
              <span style={styles.pageNum}>{pag.num}</span>
              <div>
                <h2 id={`titulo-${pag.id}`} style={styles.pageTitle}>
                  {pag.title}
                </h2>
                <p style={styles.pageBlurb}>{pag.blurb}</p>
              </div>
            </div>

            {pag.loading && <p style={styles.status}>Cargando…</p>}
            {!pag.loading && pag.error && <p style={styles.statusError}>{pag.error}</p>}
            {!pag.loading && !pag.error && pag.items.length === 0 && (
              <p style={styles.status}>Sin resultados para esta vitrina.</p>
            )}

            {!pag.loading && pag.items.length > 0 && (
              <div style={styles.strip} role="list">
                {pag.items.map((book) => (
                  <StripBookCard
                    key={`${pag.id}-${book.id}`}
                    book={book}
                    catalogoLocal={catalogoLocal}
                    activeByBookId={activeByBookId}
                    userId={userId}
                    onLoanChange={onLoanChange}
                    quitarDelCatalogo={quitarDelCatalogo}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

const styles = {
  shell: {
    padding: "24px 32px 48px",
    color: "var(--text-primary)",
    minHeight: "100vh",
    backgroundColor: "var(--bg-page)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  brand: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "bold",
  },
  brandSub: {
    margin: "6px 0 0 0",
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userName: {
    fontSize: "14px",
    color: "var(--text-muted)",
  },
  btnLibros: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--accent)",
    color: "var(--on-accent)",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--accent)",
    color: "var(--on-accent)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },
  intro: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    maxWidth: "720px",
    marginBottom: "16px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "var(--bg-surface)",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
    maxWidth: "560px",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-card)",
  },
  searchInput: {
    background: "none",
    border: "none",
    color: "var(--text-primary)",
    fontSize: "15px",
    outline: "none",
    flex: 1,
    minWidth: 0,
  },
  searchBlock: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "16px",
    padding: "20px 24px 24px",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-card)",
    marginBottom: "32px",
  },
  searchHeading: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: "bold",
  },
  searchHint: {
    margin: "0 0 16px 0",
    fontSize: "12px",
    color: "var(--text-muted)",
    lineHeight: 1.45,
    maxWidth: "640px",
  },
  searchPagination: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid var(--border-subtle)",
  },
  pageNavBtn: {
    backgroundColor: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "8px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  pageNavBtnDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
  pageNumbers: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  pageNumBtn: {
    minWidth: "36px",
    padding: "6px 8px",
    borderRadius: "8px",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-page)",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  pageNumBtnActive: {
    backgroundColor: "var(--accent)",
    color: "var(--on-accent)",
    borderColor: "transparent",
  },
  pagesStack: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  pageBlock: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "16px",
    padding: "24px 24px 20px",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-card)",
    scrollMarginTop: "16px",
  },
  pageHeader: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  pageNum: {
    flexShrink: 0,
    fontSize: "40px",
    fontWeight: "800",
    lineHeight: 1,
    color: "var(--accent-strong)",
    opacity: 0.85,
    fontVariantNumeric: "tabular-nums",
  },
  pageTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold",
  },
  pageBlurb: {
    margin: "8px 0 0 0",
    fontSize: "13px",
    color: "var(--text-muted)",
    lineHeight: 1.45,
    maxWidth: "560px",
  },
  status: {
    fontSize: "13px",
    color: "var(--text-subtle)",
    margin: 0,
  },
  statusError: {
    fontSize: "13px",
    color: "var(--error-soft)",
    margin: 0,
  },
  strip: {
    display: "flex",
    gap: "16px",
    overflowX: "auto",
    paddingBottom: "8px",
    scrollSnapType: "x proximity",
    WebkitOverflowScrolling: "touch",
  },
  stripCard: {
    flex: "0 0 132px",
    width: "132px",
    scrollSnapAlign: "start",
  },
  stripCover: {
    height: "168px",
    borderRadius: "10px",
    backgroundColor: "var(--bg-input)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: "8px",
    border: "1px solid var(--border-subtle)",
  },
  stripImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  stripTitle: {
    fontSize: "12px",
    fontWeight: "700",
    margin: 0,
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  stripAuthor: {
    fontSize: "11px",
    color: "var(--text-muted)",
    margin: "4px 0 0 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  btnQuitarStrip: {
    marginTop: "6px",
    width: "100%",
    padding: "6px 4px",
    fontSize: "10px",
    fontWeight: "600",
    color: "var(--error-soft)",
    background: "transparent",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default Dashboard;
