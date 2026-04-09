import { useEffect, useState } from "react";
import { getLoansByUser, returnLoan, getBooks } from "../services/api";

function MisLibros() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
      cargarDatos(userData.id);
    }
  }, []);

  const cargarDatos = async (userId) => {
    try {
      const [loansRes, booksRes] = await Promise.all([
        getLoansByUser(userId),
        import("../services/api").then((api) => api.getBooks())
      ]);

      // Crear mapa de libros por id para acceso rápido
      const booksMap = {};
      booksRes.data.forEach((b) => {
        booksMap[b._id] = b;
      });

      setBooks(booksMap);
      setLoans(loansRes.data);
    } catch (_err) {
      console.log("Error cargando datos");
    }
  };

  const handleDevolver = async (loanId) => {
    try {
      await returnLoan(loanId);
      setMensaje("Libro devuelto ✅");
      const userData = JSON.parse(localStorage.getItem("user"));
      cargarDatos(userData.id);
      setTimeout(() => setMensaje(""), 2000);
    } catch (_err) {
      setMensaje("Error devolviendo libro");
    }
  };

  const calcularDiasRestantes = (loanDate) => {
    const prestamo = new Date(loanDate);
    const devolucion = new Date(prestamo);
    devolucion.setDate(devolucion.getDate() + 14); // 14 días para devolver
    const hoy = new Date();
    const diff = Math.ceil((devolucion - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const loansActivos = loans.filter((l) => l.status === "active");
  const loansDevueltos = loans.filter((l) => l.status === "returned");

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mis libros</h2>
      <p style={styles.subtitle}>Libros que tienes actualmente prestados</p>

      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}

      {/* Préstamos activos */}
      {loansActivos.length === 0 && (
        <p style={styles.empty}>No tienes libros prestados actualmente</p>
      )}

      <div style={styles.lista}>
        {loansActivos.map((loan) => {
          const book = books[loan.bookId];
          const diasRestantes = calcularDiasRestantes(loan.loanDate);

          return (
            <div key={loan._id} style={styles.card}>
              {/* Portada */}
              <div style={styles.coverBox}>
                {book?.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} style={styles.coverImg} />
                ) : (
                  <span style={{ fontSize: "36px" }}>📗</span>
                )}
              </div>

              {/* Info */}
              <div style={styles.info}>
                <p style={styles.bookTitle}>{book?.title || loan.bookId}</p>
                <p style={styles.bookAuthor}>{book?.author || ""}</p>
                <div style={styles.badge}>Prestado</div>
                <div style={styles.fechas}>
                  <span>📅 Prestado: {new Date(loan.loanDate).toLocaleDateString()}</span>
                  <span style={{ color: diasRestantes < 3 ? "#e74c3c" : "#8b93a7" }}>
                    📅 Devolver en {diasRestantes} días
                  </span>
                </div>
              </div>

              {/* Botón devolver */}
              <button
                style={styles.btnDevolver}
                onClick={() => handleDevolver(loan._id)}
              >
                Devolver
              </button>
            </div>
          );
        })}
      </div>

      {/* Historial */}
      {loansDevueltos.length > 0 && (
        <>
          <h3 style={{ ...styles.title, fontSize: "16px", marginTop: "32px" }}>
            Historial de devoluciones
          </h3>
          <div style={styles.lista}>
            {loansDevueltos.map((loan) => {
              const book = books[loan.bookId];
              return (
                <div key={loan._id} style={{ ...styles.card, opacity: 0.6 }}>
                  <div style={styles.coverBox}>
                    {book?.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} style={styles.coverImg} />
                    ) : (
                      <span style={{ fontSize: "36px" }}>📗</span>
                    )}
                  </div>
                  <div style={styles.info}>
                    <p style={styles.bookTitle}>{book?.title || loan.bookId}</p>
                    <p style={styles.bookAuthor}>{book?.author || ""}</p>
                    <div style={{ ...styles.badge, backgroundColor: "#3a4156" }}>
                      Devuelto
                    </div>
                    <span style={{ color: "#8b93a7", fontSize: "12px" }}>
                      📅 Prestado: {new Date(loan.loanDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px 32px",
    color: "white",
    minHeight: "100vh",
    backgroundColor: "#1a1f2e"
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    margin: "0 0 4px 0"
  },
  subtitle: {
    color: "#8b93a7",
    fontSize: "13px",
    marginBottom: "24px"
  },
  empty: {
    color: "#8b93a7",
    fontSize: "14px"
  },
  mensaje: {
    color: "#2ecc71",
    fontSize: "13px",
    marginBottom: "12px"
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  card: {
    backgroundColor: "#242938",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  coverBox: {
    width: "80px",
    height: "80px",
    backgroundColor: "#2f3548",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0
  },
  coverImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  bookTitle: {
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    margin: 0
  },
  bookAuthor: {
    color: "#8b93a7",
    fontSize: "12px",
    margin: 0
  },
  badge: {
    backgroundColor: "#f5c518",
    color: "#1a1f2e",
    borderRadius: "6px",
    padding: "3px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    display: "inline-block",
    width: "fit-content"
  },
  fechas: {
    display: "flex",
    gap: "16px",
    color: "#8b93a7",
    fontSize: "12px",
    marginTop: "4px"
  },
  btnDevolver: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
    flexShrink: 0
  }
};

export default MisLibros;