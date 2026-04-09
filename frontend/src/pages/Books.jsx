import { useEffect, useState } from "react";
import { getBooks, createBook } from "../services/api";

function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("Todo");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", quantity: 1, coverUrl: "" });
  const [mensaje, setMensaje] = useState("");

  const categorias = ["Todo", "Ficción", "No ficción", "Ciencia", "Historia", "Arte"];

  useEffect(() => {
    cargarLibros();
  }, []);

const cargarLibros = async () => {
    try {
      const res = await getBooks();
      // Aseguramos que siempre sea un array
      setBooks(Array.isArray(res.data) ? res.data : []);
    } catch (_err) {
      console.log("Error cargando libros");
      setBooks([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCrear = async () => {
    try {
      await createBook(form);
      setMensaje("Libro agregado ✅");
      setForm({ title: "", author: "", quantity: 1, coverUrl: "" });
      setShowForm(false);
      cargarLibros();
      setTimeout(() => setMensaje(""), 2000);
    } catch (_err) {
      setMensaje("Error agregando libro");
    }
  };

  const librosFiltrados = books.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div style={styles.container}>

      {/* Título */}
      <div style={styles.topBar}>
        <h2 style={styles.title}>Explorar libros</h2>
        <button style={styles.btnAgregar} onClick={() => setShowForm(!showForm)}>
          + Agregar libro
        </button>
      </div>

      {/* Formulario agregar */}
      {showForm && (
        <div style={styles.form}>
          {mensaje && <p style={{ color: "green", fontSize: "13px" }}>{mensaje}</p>}
          <input style={styles.input} type="text" name="title" placeholder="Título" value={form.title} onChange={handleChange} />
          <input style={styles.input} type="text" name="author" placeholder="Autor" value={form.author} onChange={handleChange} />
          <input style={styles.input} type="number" name="quantity" placeholder="Cantidad" value={form.quantity} onChange={handleChange} />
          <input style={styles.input} type="text" name="coverUrl" placeholder="URL de portada (opcional)" value={form.coverUrl} onChange={handleChange} />
          <button style={styles.btnGuardar} onClick={handleCrear}>Guardar libro</button>
        </div>
      )}

      {/* Buscador */}
      <div style={styles.searchBox}>
        <span>🔍</span>
        <input
          style={styles.searchInput}
          placeholder="Buscar por título o autor..."
          onChange={(e) => setSearch(e.target.value)}
        />
        <button style={styles.btnFiltro}>⚙ Filtros</button>
      </div>

      {/* Categorías */}
      <div style={styles.categorias}>
        {categorias.map((cat) => (
          <button
            key={cat}
            style={{
              ...styles.catBtn,
              ...(filtro === cat ? styles.catBtnActive : {})
            }}
            onClick={() => setFiltro(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid libros */}
      <div style={styles.grid}>
        {librosFiltrados.map((book) => (
          <div key={book._id} style={styles.bookCard}>
            <div style={styles.bookCover}>
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} style={styles.coverImg} />
              ) : (
                <div style={styles.coverPlaceholder}>
                  <span style={{ fontSize: "48px" }}>📗</span>
                </div>
              )}
              <div style={{
                ...styles.badgeOverlay,
                backgroundColor: book.available ? "#2ecc9a" : "#f5c518"
              }}>
                {book.available ? "Disponible" : "Prestado"}
              </div>
            </div>
            <p style={styles.bookTitle}>{book.title}</p>
            <p style={styles.bookAuthor}>{book.author}</p>
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
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    margin: 0
  },
  btnAgregar: {
    backgroundColor: "#f5c518",
    color: "#1a1f2e",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px"
  },
  form: {
    backgroundColor: "#242938",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "420px",
    marginBottom: "20px"
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2f3548",
    color: "white",
    fontSize: "14px",
    outline: "none"
  },
  btnGuardar: {
    padding: "12px",
    backgroundColor: "#f5c518",
    color: "#1a1f2e",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px"
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#242938",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px"
  },
  searchInput: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "15px",
    outline: "none",
    flex: 1
  },
  btnFiltro: {
    backgroundColor: "#2f3548",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "13px"
  },
  categorias: {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
    flexWrap: "wrap"
  },
  catBtn: {
    backgroundColor: "#242938",
    color: "white",
    border: "none",
    borderRadius: "20px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "13px"
  },
  catBtnActive: {
    backgroundColor: "#f5c518",
    color: "#1a1f2e",
    fontWeight: "bold"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px"
  },
  bookCard: {
    backgroundColor: "#242938",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "pointer"
  },
  bookCover: {
    position: "relative",
    height: "220px",
    backgroundColor: "#2f3548",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  coverImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  coverPlaceholder: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%"
  },
  badgeOverlay: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    color: "#1a1f2e",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "bold"
  },
  bookTitle: {
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
    margin: "10px 12px 4px 12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  bookAuthor: {
    color: "#8b93a7",
    fontSize: "12px",
    margin: "0 12px 12px 12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
};

export default Books;