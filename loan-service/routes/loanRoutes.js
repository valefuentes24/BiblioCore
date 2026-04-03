const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loanController");

// Obtener todos los préstamos
router.get("/", loanController.getLoans);

// Crear préstamo
router.post("/", loanController.createLoan);

// Devolver libro
router.put("/:id/return", loanController.returnLoan);

// Préstamos por usuario
router.get("/user/:userId", loanController.getLoansByUser);

module.exports = router;