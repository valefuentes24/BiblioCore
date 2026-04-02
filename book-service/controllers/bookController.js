// Importamos el modelo
const Book = require("../models/Book");


// 📚 Obtener todos los libros
exports.getBooks = async (req, res) => {
  const books = await Book.find();
  res.json(books);
};


// ➕ Crear un libro
exports.createBook = async (req, res) => {
  const book = new Book(req.body);

  // Si la cantidad es 0, lo marcamos como no disponible
  if (book.quantity === 0) {
    book.available = false;
  }

  await book.save();
  res.json(book);
};


// 📕 PRESTAR LIBRO
exports.loanBook = async (req, res) => {
  try {
    // Buscamos el libro por ID
    const book = await Book.findById(req.params.id);

    // Si no existe
    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Si no hay cantidad disponible
    if (book.quantity <= 0) {
      return res.status(400).json({ message: "No hay libros disponibles" });
    }

    // Disminuimos la cantidad
    book.quantity -= 1;

    // Si ya no quedan, lo marcamos como no disponible
    if (book.quantity === 0) {
      book.available = false;
    }

    await book.save();

    res.json({
      message: "Libro prestado correctamente",
      book
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 📗 DEVOLVER LIBRO
exports.returnBook = async (req, res) => {
  try {
    // Buscamos el libro
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    // Aumentamos la cantidad
    book.quantity += 1;

    // Al haber al menos uno, está disponible
    book.available = true;

    await book.save();

    res.json({
      message: "Libro devuelto correctamente",
      book
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};