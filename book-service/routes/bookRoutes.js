const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookController");

// Buscar libros en Google Books API
router.get("/search", controller.searchExternalBooks);

// Obtener libros
router.get("/", controller.getBooks);

// Crear libro
router.post("/", controller.createBook);

// Prestar libro
router.put("/loan/:id", controller.loanBook);

// Devolver libro
router.put("/return/:id", controller.returnBook);

// Eliminar libro
router.delete("/:id", controller.deleteBook);

module.exports = router;