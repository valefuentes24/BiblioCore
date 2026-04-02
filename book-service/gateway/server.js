// Importamos express
const express = require("express");

// Axios sirve para comunicarse con otros microservicios
const axios = require("axios");

// Creamos la app
const app = express();

app.use(express.json());

/*
=====================================
RUTA GET LIBROS
El gateway llama al book-service
=====================================
*/
app.get("/books", async (req, res) => {
  try {

    // Llamamos al microservicio de libros
    const response = await axios.get(
      "http://localhost:3001/books"
    );

    // Devolvemos la respuesta al cliente
    res.json(response.data);

  } catch (error) {
    res.status(500).json({ error: "Error conectando book-service" });
  }
});

/*
=====================================
RUTA POST LIBROS
=====================================
*/
app.post("/books", async (req, res) => {
  try {

    const response = await axios.post(
      "http://localhost:3001/books",
      req.body
    );

    res.json(response.data);

  } catch (error) {
    res.status(500).json({ error: "Error creando libro" });
  }
});


// Levantar gateway
app.listen(3000, () => {
  console.log("API Gateway corriendo en http://localhost:3000");
});