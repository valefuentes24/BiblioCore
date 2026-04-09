import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000"
});

export const registerUser = (data) => API.post("/users/register", data);
export const loginUser = (data) => API.post("/users/login", data);
export const getUsers = () => API.get("/users");
export const getBooks = () => API.get("/books");
export const createBook = (data) => API.post("/books", data);
export const getLoans = () => API.get("/loans");
export const createLoan = (data) => API.post("/loans", data);
export const returnLoan = (id) => API.put(`/loans/${id}/return`);
export const getLoansByUser = (userId) => API.get(`/loans/user/${userId}`);