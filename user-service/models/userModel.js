// ===============================
// IMPORTAMOS MONGOOSE
// ===============================
const mongoose = require("mongoose");

// ===============================
// CREAR ESQUEMA DEL USUARIO
// ===============================
const userSchema = new mongoose.Schema({

    // Nombre del usuario
    name: {
        type: String,
        required: true
    },

    // Email único
    email: {
        type: String,
        required: true,
        unique: true
    },

    // Contraseña
    password: {
        type: String,
        required: true
    },

    role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  }

});

// ===============================
// EXPORTAR MODELO
// ===============================
module.exports = mongoose.model("User", userSchema);