import { useEffect, useState } from "react";
import { getLoansByUser } from "../services/api";
import { useNavigate } from "react-router-dom";

function Perfil() {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [notificaciones, setNotificaciones] = useState(true);
  const [recordatorios, setRecordatorios] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
      cargarLoans(userData.id);
    }
  }, []);

  const cargarLoans = async (userId) => {
    try {
      const res = await getLoansByUser(userId);
      setLoans(res.data);
    } catch (_err) {
      console.log("Error cargando préstamos");
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const activos = loans.filter((l) => l.status === "active").length;
  const total = loans.length;
  const devueltos = loans.filter((l) => l.status === "returned").length;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mi perfil</h2>
      <p style={styles.subtitle}>Información y estadísticas de tu cuenta</p>

      {/* Card de usuario */}
      <div style={styles.card}>
        <div style={styles.avatarBox}>
          <span style={styles.avatarIcon}>👤</span>
        </div>
        <div style={styles.userInfo}>
          <p style={styles.userName}>{user?.name || "Usuario"}</p>
          <p style={styles.userEmail}>{user?.email || ""}</p>
          <button style={styles.btnCerrar} onClick={handleCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <h3 style={styles.sectionTitle}>Estadísticas</h3>
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: "#f5c51833" }}>
            <span style={{ fontSize: "20px" }}>📖</span>
          </div>
          <p style={styles.statNum}>{activos}</p>
          <p style={styles.statLabel}>Libros prestados</p>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: "#2ecc9a33" }}>
            <span style={{ fontSize: "20px" }}>📅</span>
          </div>
          <p style={styles.statNum}>{total}</p>
          <p style={styles.statLabel}>Total prestado</p>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: "#4a90e233" }}>
            <span style={{ fontSize: "20px" }}>📚</span>
          </div>
          <p style={styles.statNum}>{devueltos}</p>
          <p style={styles.statLabel}>Libros leídos</p>
        </div>
      </div>

      {/* Preferencias */}
      <h3 style={styles.sectionTitle}>Preferencias</h3>
      <div style={styles.prefsCard}>
        <div style={styles.prefRow}>
          <span style={styles.prefLabel}>Notificaciones por correo electrónico</span>
          <div
            style={{
              ...styles.toggle,
              backgroundColor: notificaciones ? "#f5c518" : "#3a4156"
            }}
            onClick={() => setNotificaciones(!notificaciones)}
          >
            <div style={{
              ...styles.toggleCircle,
              transform: notificaciones ? "translateX(20px)" : "translateX(2px)"
            }} />
          </div>
        </div>

        <div style={styles.prefRow}>
          <span style={styles.prefLabel}>Recordatorios de devolución</span>
          <div
            style={{
              ...styles.toggle,
              backgroundColor: recordatorios ? "#f5c518" : "#3a4156"
            }}
            onClick={() => setRecordatorios(!recordatorios)}
          >
            <div style={{
              ...styles.toggleCircle,
              transform: recordatorios ? "translateX(20px)" : "translateX(2px)"
            }} />
          </div>
        </div>
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
  card: {
    backgroundColor: "#242938",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    maxWidth: "600px"
  },
  avatarBox: {
    backgroundColor: "#f5c518",
    borderRadius: "12px",
    width: "60px",
    height: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0
  },
  avatarIcon: {
    fontSize: "28px"
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  userName: {
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
    margin: 0
  },
  userEmail: {
    color: "#8b93a7",
    fontSize: "13px",
    margin: 0
  },
  btnCerrar: {
    backgroundColor: "transparent",
    color: "#8b93a7",
    border: "none",
    padding: "0",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "left",
    marginTop: "4px"
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "16px"
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "28px",
    flexWrap: "wrap",
    maxWidth: "600px"
  },
  statCard: {
    backgroundColor: "#242938",
    borderRadius: "12px",
    padding: "20px",
    flex: 1,
    minWidth: "140px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  statIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  statNum: {
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0
  },
  statLabel: {
    color: "#8b93a7",
    fontSize: "12px",
    margin: 0
  },
  prefsCard: {
    backgroundColor: "#242938",
    borderRadius: "12px",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "600px"
  },
  prefRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  prefLabel: {
    color: "white",
    fontSize: "14px"
  },
  toggle: {
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.3s"
  },
  toggleCircle: {
    position: "absolute",
    top: "2px",
    width: "20px",
    height: "20px",
    backgroundColor: "white",
    borderRadius: "50%",
    transition: "transform 0.3s"
  }
};

export default Perfil;