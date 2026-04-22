const Loan = require("../models/loanModel");
const axios = require("axios");

exports.createLoan = async (req, res) => {
  try {
    const { userId, bookId, bookTitle, bookAuthor, coverUrl } = req.body;

    const existingLoan = await Loan.findOne({ userId, bookId, status: "active" });
    if (existingLoan) {
      return res.status(400).json({ message: "Este usuario ya tiene ese libro prestado" });
    }

    await axios.put(`http://book-service:3001/books/loan/${bookId}`);

    const newLoan = new Loan({
      userId,
      bookId,
      bookTitle: typeof bookTitle === "string" ? bookTitle : "",
      bookAuthor: typeof bookAuthor === "string" ? bookAuthor : "",
      coverUrl: typeof coverUrl === "string" ? coverUrl : "",
    });
    await newLoan.save();

    res.status(201).json({ message: "Préstamo creado ✅", loan: newLoan });

  } catch (error) {
    if (error.response) {
      return res.status(400).json({ message: error.response.data.message });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.returnLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByIdAndUpdate(
      id,
      { status: "returned", returnDate: Date.now() },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }

    await axios.put(`http://book-service:3001/books/return/${loan.bookId}`);

    res.json({ message: "Libro devuelto ✅", loan });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ← AGREGAR ESTAS DOS
exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find();
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLoansByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const loans = await Loan.find({ userId });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};