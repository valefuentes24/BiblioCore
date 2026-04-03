// ===============================
// IMPORTAR EXPRESS
// ===============================

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

console.log("🔥 userRoutes cargado");
// ===============================
// RUTAS DEL MICROSERVICIO
// ===============================

// ✅ Obtener todos los usuarios
router.get("/", userController.getUsers);

// ✅ Registrar usuario
router.post("/register", userController.registerUser);

// ✅ Login usuario
router.post("/login", userController.loginUser);

router.get("/test", (req, res) => {
  res.send("Ruta funcionando ✅");
});


// ===============================
// EXPORTAR ROUTER
// ===============================
module.exports = router;