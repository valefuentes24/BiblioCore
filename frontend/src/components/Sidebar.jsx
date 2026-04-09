import { useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: "🏠", path: "/dashboard", label: "Inicio" },
    { icon: "📖", path: "/books", label: "Libros" },
    { icon: "📚", path: "/mis-libros", label: "Mis libros" },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo} onClick={() => navigate("/dashboard")}>
        <div style={styles.logoBox}>
          <span style={{ fontSize: "22px" }}>📗</span>
        </div>
      </div>

      <div style={styles.items}>
        {items.map((item) => (
          <div
            key={item.path}
            title={item.label}
            style={{
              ...styles.item,
              ...(location.pathname === item.path ? styles.itemActive : {})
            }}
            onClick={() => navigate(item.path)}
          >
            <span style={styles.icon}>{item.icon}</span>
          </div>
        ))}
      </div>

      <div style={styles.bottom}>
        <div
          style={{
            ...styles.item,
            ...(location.pathname === "/perfil" ? styles.itemActive : {})
          }}
          onClick={() => navigate("/perfil")}
        >
          <span style={styles.icon}>👤</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "60px",
    backgroundColor: "#151a27",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "20px",
    paddingBottom: "20px",
    minHeight: "100vh",
    position: "sticky",
    top: 0
  },
  logo: {
    marginBottom: "32px",
    cursor: "pointer"
  },
  logoBox: {
    backgroundColor: "#f5c518",
    borderRadius: "10px",
    width: "40px",
    height: "40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  items: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1
  },
  item: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  itemActive: {
    backgroundColor: "#f5c51833",
    borderLeft: "3px solid #f5c518"
  },
  icon: {
    fontSize: "20px"
  },
  bottom: {
    marginTop: "auto"
  }
};

export default Sidebar;