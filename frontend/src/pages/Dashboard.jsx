import { useEffect, useState } from "react";
import { getBooks } from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) setUser(userData);
    cargarLibros();
  }, []);

  const cargarLibros = async () => {
    try {
      const res = await getBooks();
      setBooks(res.data);
    } catch (_err) {
      console.log("Error cargando libros");
    }
  };

  const librosFiltrados = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.brand}>bibliocore</h1>
          <p style={styles.brandSub}>tu biblioteca virtual</p>
        </div>
        <div style={styles.searchBox}>
          <span>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Utiliza nuestro buscador académico"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name || "Usuario"}</span>
          <div style={styles.avatar}>
            <span>{user?.name?.[0]?.toUpperCase() || "U"}</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <p style={styles.breadcrumb}>
        Estás en: <span style={styles.breadcrumbLink}>Inicio</span> &gt; Portada
      </p>

      {/* Grid de libros */}
      <div style={styles.grid}>
        {librosFiltrados.length === 0 && (
          <p style={{ color: "#8b93a7" }}>No se encontraron libros</p>
        )}
        {librosFiltrados.map((book) => (
          <div key={book._id} style={styles.bookCard}>
            <div style={styles.bookCover}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} style={styles.coverImg} />
              ) : (
                <span style={styles.bookEmoji}>📗</span>
              )}
            </div>
            <p style={styles.bookTitle}>{book.title}</p>
            <p style={styles.bookAuthor}>{book.author}</p>
            <div style={{
              ...styles.badge,
              backgroundColor: book.available ? "#2ecc71" : "#f5c518"
            }}>
              {book.available ? "Disponible" : "Prestado"}
            </div>
          </div>
        ))}
      </div>

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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#151a27",
    padding: "20px 24px",
    borderRadius: "12px",
    marginBottom: "16px",
    gap: "24px"
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column"
  },
  brand: {
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0
  },
  brandSub: {
    color: "#8b93a7",
    fontSize: "13px",
    margin: 0
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#242938",
    padding: "12px 16px",
    borderRadius: "10px",
    flex: 1,
    maxWidth: "500px"
  },
  searchInput: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "15px",
    outline: "none",
    width: "100%"
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  userName: {
    color: "#8b93a7",
    fontSize: "14px"
  },
  avatar: {
    backgroundColor: "#f5c518",
    borderRadius: "50%",
    width: "38px",
    height: "38px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    color: "#1a1f2e",
    cursor: "pointer"
  },
  breadcrumb: {
    color: "#8b93a7",
    fontSize: "13px",
    marginBottom: "24px"
  },
  breadcrumbLink: {
    color: "#f5c518",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "20px"
  },
  bookCard: {
    backgroundColor: "#242938",
    borderRadius: "12px",
    padding: "12px",
    cursor: "pointer",
    transition: "transform 0.2s"
  },
  bookCover: {
    backgroundColor: "#2f3548",
    borderRadius: "8px",
    height: "160px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "10px",
    overflow: "hidden"
  },
  coverImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "8px"
  },
  bookEmoji: {
    fontSize: "52px"
  },
  bookTitle: {
    color: "white",
    fontSize: "13px",
    fontWeight: "bold",
    margin: "0 0 4px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  bookAuthor: {
    color: "#8b93a7",
    fontSize: "11px",
    margin: "0 0 8px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  badge: {
    color: "#1a1f2e",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    display: "inline-block"
  }
};

export default Dashboard;