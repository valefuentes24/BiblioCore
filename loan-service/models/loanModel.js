const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  bookId: {
    type: String,
    required: true
  },
  loanDate: {
    type: Date,
    default: Date.now
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["active", "returned"],
    default: "active"
  }
});

module.exports = mongoose.model("Loan", loanSchema);