const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// ===============================
// RUTAS
// ===============================
const loanRoutes = require("./routes/loanRoutes");
app.use("/loans", loanRoutes);

// ===============================
// MONGODB
// ===============================
mongoose.connect("mongodb://karenvaleriacastanedafuentes_db_user:12345@ac-7cdt0qh-shard-00-00.j5ijvty.mongodb.net:27017,ac-7cdt0qh-shard-00-01.j5ijvty.mongodb.net:27017,ac-7cdt0qh-shard-00-02.j5ijvty.mongodb.net:27017/library?ssl=true&replicaSet=atlas-gr3t5a-shard-0&authSource=admin&retryWrites=true&w=majority")
  .then(() => console.log("MongoDB conectado en Loan Service 📚"))
  .catch(err => console.log(err));

// ===============================
app.listen(3003, () => {
  console.log("Loan Service en http://localhost:3003");
});