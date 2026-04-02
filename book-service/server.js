// Importamos express (para crear el servidor)
const express = require("express");

// Importamos mongoose (para conectar con MongoDB)
const mongoose = require("mongoose");

// Importamos cors (para permitir conexiones externas)
const cors = require("cors");

// Creamos la app
const app = express();

// Middleware para permitir JSON
app.use(express.json());

// Middleware para evitar errores de conexión (CORS)
app.use(cors());


// 🔗 Conexión a MongoDB Atlas (nube)
mongoose.connect("mongodb://karenvaleriacastanedafuentes_db_user:12345@ac-7cdt0qh-shard-00-00.j5ijvty.mongodb.net:27017,ac-7cdt0qh-shard-00-01.j5ijvty.mongodb.net:27017,ac-7cdt0qh-shard-00-02.j5ijvty.mongodb.net:27017/library?ssl=true&replicaSet=atlas-gr3t5a-shard-0&authSource=admin&retryWrites=true&w=majority")
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch(err => console.log("Error MongoDB:", err));

// 📚 Rutas del microservicio
app.use("/books", require("./routes/bookRoutes"));


// 🚀 Levantar servidor
app.listen(3001, () => {
  console.log("Book Service en http://localhost:3001");
});