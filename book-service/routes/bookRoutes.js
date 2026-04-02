const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookController");

// Obtener libros
router.get("/", controller.getBooks);

// Crear libro
router.post("/", controller.createBook);

// 📕 Prestar libro
router.put("/loan/:id", controller.loanBook);

// 📗 Devolver libro
router.put("/return/:id", controller.returnBook);

module.exports = router;