import axios from "axios";

const API = axios.create({
  baseURL: "http://54.226.234.215:3000"
});

export const registerUser = (data) => API.post("/users/register", data);
export const loginUser = (data) => API.post("/users/login", data);
export const getUsers = () => API.get("/users");
export const getBooks = () => API.get("/books");
export const searchBooks = (query, extra = {}) =>
  API.get("/books/search", { params: { q: query, ...extra } });
export const createBook = (data) => API.post("/books", data);
export const deleteBook = (id) => API.delete(`/books/${id}`);
export const getLoans = () => API.get("/loans");
export const createLoan = (data) => API.post("/loans", data);
export const returnLoan = (id) => API.put(`/loans/${id}/return`);
export const getLoansByUser = (userId) => API.get(`/loans/user/${userId}`);