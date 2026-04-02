// Importamos mongoose
const mongoose = require("mongoose");

// Creamos la estructura del libro
const bookSchema = new mongoose.Schema({

  // Título del libro
  title: String,

  // Autor
  author: String,

  // Cantidad disponible en inventario
  quantity: {
    type: Number,
    default: 1
  },

  // Estado de disponibilidad
  available: {
    type: Boolean,
    default: true
  }

});

// Exportamos el modelo
module.exports = mongoose.model("Book", bookSchema);