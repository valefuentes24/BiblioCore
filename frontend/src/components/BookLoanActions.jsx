import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createLoan, returnLoan } from "../services/api";

const btnBase = {
  width: "100%",
  marginTop: "8px",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid var(--border-subtle)",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
};

const btnPrimary = {
  ...btnBase,
  backgroundColor: "var(--accent)",
  color: "var(--on-accent)",
};

const btnDanger = {
  ...btnBase,
  backgroundColor: "var(--danger)",
  color: "var(--on-accent)",
};

const btnDisabled = {
  ...btnBase,
  opacity: 0.5,
  cursor: "not-allowed",
};

/**
 * @param {object} props
 * @param {object} props.book — debe tener _id si es del catálogo Mongo; si solo viene de Google, no tendrá _id
 * @param {object|null} props.loanForBook — préstamo activo del usuario para este bookId
 * @param {string|null} props.userId
 * @param {() => Promise<void>} props.onAfterChange — refrescar préstamos y opcionalmente libros
 * @param {"card"|"strip"} props.variant
 */
function BookLoanActions({ book, loanForBook, userId, onAfterChange, variant = "card" }) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");
  const navigate = useNavigate();

  const isLocal = book && book._id != null;
  const small = variant === "strip";

  const showHint = (text) => {
    setHint(text);
    setTimeout(() => setHint(""), 2800);
  };

  const handlePedir = async () => {
    if (!userId || !isLocal) return;
    try {
      setBusy(true);
      await createLoan({
        userId,
        bookId: String(book._id),
        bookTitle: book.title || "",
        bookAuthor: book.author || "",
        coverUrl: book.coverUrl || "",
      });
      showHint("Prestado ✓");
      await onAfterChange?.();
    } catch (err) {
      showHint(err.response?.data?.message || "No se pudo prestar");
    } finally {
      setBusy(false);
    }
  };

  const handleDevolver = async () => {
    if (!loanForBook?._id) return;
    try {
      setBusy(true);
      await returnLoan(loanForBook._id);
      showHint("Devuelto ✓");
      await onAfterChange?.();
    } catch (err) {
      showHint(err.response?.data?.message || "Error al devolver");
    } finally {
      setBusy(false);
    }
  };

  const wrapStyle = {
    marginTop: small ? "6px" : "10px",
  };

  const textStyle = {
    fontSize: small ? "10px" : "11px",
    color: "var(--text-muted)",
    lineHeight: 1.35,
    margin: 0,
  };

  const linkStyle = {
    ...textStyle,
    color: "var(--link)",
    cursor: "pointer",
    textDecoration: "underline",
    border: "none",
    background: "none",
    padding: 0,
    font: "inherit",
    width: "100%",
    textAlign: "left",
  };

  if (!book) return null;

  if (!userId) {
    return (
      <div style={wrapStyle}>
        <p style={textStyle}>Inicia sesión para pedir préstamos.</p>
        <button type="button" style={linkStyle} onClick={() => navigate("/")}>
          Ir al login
        </button>
      </div>
    );
  }

  if (!isLocal) {
    return (
      <div style={wrapStyle}>
        <p style={textStyle}>
          Préstamo solo para ejemplares dados de alta en el catálogo. Añádelo en{" "}
          <strong>Libros</strong> o búscalo allí si ya existe.
        </p>
        <button type="button" style={linkStyle} onClick={() => navigate("/books")}>
          Ir a Libros
        </button>
        {hint ? <p style={{ ...textStyle, color: "var(--success-text)", marginTop: "4px" }}>{hint}</p> : null}
      </div>
    );
  }

  const hasActive = loanForBook && loanForBook.status === "active";
  const disponible = book.available !== false && (book.quantity === undefined || book.quantity > 0);

  if (hasActive) {
    return (
      <div style={wrapStyle}>
        <p style={{ ...textStyle, color: "var(--chip-accent)", fontWeight: "600" }}>Lo tienes prestado</p>
        <button type="button" style={btnDanger} disabled={busy} onClick={handleDevolver}>
          {busy ? "…" : "Devolver"}
        </button>
        {hint ? <p style={{ ...textStyle, marginTop: "4px" }}>{hint}</p> : null}
      </div>
    );
  }

  if (!disponible) {
    return (
      <div style={wrapStyle}>
        <p style={{ ...textStyle, color: "var(--error-soft)", fontWeight: "600" }}>Sin ejemplares</p>
        <button type="button" style={{ ...btnDisabled }} disabled>
          Pedir préstamo
        </button>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <button type="button" style={btnPrimary} disabled={busy} onClick={handlePedir}>
        {busy ? "…" : "Pedir préstamo"}
      </button>
      {hint ? <p style={{ ...textStyle, marginTop: "4px" }}>{hint}</p> : null}
    </div>
  );
}

export default BookLoanActions;
