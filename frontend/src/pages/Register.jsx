import { useState } from "react";
import { registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await registerUser(form);
      setMensaje("Usuario registrado ✅");
      setTimeout(() => navigate("/"), 1500);
    } catch (_err) {
      setMensaje("Error al registrar usuario");
    }
  };

  return (
    <div style={styles.background}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <span style={{ fontSize: "28px" }}>📖</span>
        </div>
        <h1 style={styles.title}>Bibliocore</h1>
        <p style={styles.subtitle}>Crea tu cuenta</p>

        {mensaje && (
          <p style={{ color: mensaje.includes("Error") ? "#e74c3c" : "#2ecc71", fontSize: "13px" }}>
            {mensaje}
          </p>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Nombres</label>
          <input
            style={styles.input}
            type="text"
            name="name"
            placeholder="Nombres"
            onChange={handleChange}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Correo Electrónico</label>
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Correo Electrónico"
            onChange={handleChange}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Contraseña</label>
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="••••••••"
            onChange={handleChange}
          />
        </div>

        <button style={styles.button} onClick={handleSubmit}>
          Registrarse
        </button>

        <p style={styles.loginText}>
          ¿Ya tienes cuenta?{" "}
          <span style={styles.link} onClick={() => navigate("/")}>
            Inicia sesión
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  background: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#1a1f2e"
  },
  card: {
    backgroundColor: "#242938",
    padding: "48px 40px",
    borderRadius: "16px",
    width: "420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
  },
  iconContainer: {
    backgroundColor: "#f5c518",
    borderRadius: "16px",
    width: "64px",
    height: "64px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    color: "white",
    fontSize: "26px",
    fontWeight: "bold"
  },
  subtitle: {
    color: "#8b93a7",
    fontSize: "14px"
  },
  inputGroup: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    color: "white",
    fontSize: "14px",
    fontWeight: "500"
  },
  input: {
    padding: "14px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2f3548",
    color: "white",
    fontSize: "15px",
    outline: "none",
    width: "100%"
  },
  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#f5c518",
    color: "#1a1f2e",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px"
  },
  loginText: {
    color: "#8b93a7",
    fontSize: "13px"
  },
  link: {
    color: "#f5c518",
    fontWeight: "bold",
    cursor: "pointer"
  }
};

export default Register;