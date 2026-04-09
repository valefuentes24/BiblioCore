// ===============================
// IMPORTAR DEPENDENCIAS
// ===============================
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();


app.use(express.json());
app.use(cors());

// =====================================
// RUTAS BOOKS (book-service puerto 3001)
// =====================================
app.get("/books", async (req, res) => {
  try {
    const response = await axios.get("http://book-service:3001/books");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error conectando book-service" });
  }
});

app.post("/books", async (req, res) => {
  try {
    const response = await axios.post("http://book-service:3001/books", req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error creando libro" });
  }
});

// =====================================
// RUTAS USERS (user-service puerto 3002)
// =====================================
app.get("/users", async (req, res) => {
  try {
    const response = await axios.get("http://user-service:3002/users");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error conectando user-service" });
  }
});

app.post("/users/register", async (req, res) => {
  try {
    const response = await axios.post("http://user-service:3002/users/register", req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error registrando usuario" });
  }
});

app.post("/users/login", async (req, res) => {
  try {
    const response = await axios.post("http://user-service:3002/users/login", req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error en login" });
  }
});

// =====================================
// RUTAS LOANS (loan-service puerto 3003)
// =====================================
app.get("/loans", async (req, res) => {
  try {
    const response = await axios.get("http://loan-service:3003/loans");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error conectando loan-service" });
  }
});

app.post("/loans", async (req, res) => {
  try {
    const response = await axios.post("http://loan-service:3003/loans", req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error creando préstamo" });
  }
});

app.put("/loans/:id/return", async (req, res) => {
  try {
    const response = await axios.put(`http://loan-service:3003/loans/${req.params.id}/return`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error devolviendo libro" });
  }
});

app.get("/loans/user/:userId", async (req, res) => {
  try {
    const response = await axios.get(`http://loan-service:3003/loans/user/${req.params.userId}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo préstamos del usuario" });
  }
});

// ===============================
// LEVANTAR GATEWAY
// ===============================
app.listen(3000, () => {
  console.log("API Gateway corriendo en http://localhost:3000");
});