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
  },

  // Género / estante (opcional, para catálogo local)
  category: {
    type: String,
    enum: [
      "narrativa",
      "ensayo",
      "ciencia",
      "historia",
      "biografias",
      "infantil",
    ],
    default: "narrativa",
  },

});

// Exportamos el modelo
module.exports = mongoose.model("Book", bookSchema);