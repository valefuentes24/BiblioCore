// ===============================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ===============================
// MIDDLEWARES
// ===============================
app.use(express.json());
app.use(cors());

// ===============================
// IMPORTAR RUTAS (MUY IMPORTANTE)
// ===============================
const userRoutes = require("./routes/userRoutes");

console.log(require("./routes/userRoutes"));

app.use("/users", userRoutes);

// ===============================
// MONGODB
// ===============================
mongoose.connect("mongodb://karenvaleriacastanedafuentes_db_user:12345@ac-7cdt0qh-shard-00-00.j5ijvty.mongodb.net:27017,ac-7cdt0qh-shard-00-01.j5ijvty.mongodb.net:27017,ac-7cdt0qh-shard-00-02.j5ijvty.mongodb.net:27017/library?ssl=true&replicaSet=atlas-gr3t5a-shard-0&authSource=admin&retryWrites=true&w=majority")
.then(() => console.log("MongoDB conectado en User Service 🚀"))
.catch(err => console.log(err));

// ===============================
app.listen(3002, () => {
  console.log("User Service en http://localhost:3002");
});