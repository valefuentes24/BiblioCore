import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import MisLibros from "./pages/MisLibros";
import Perfil from "./pages/Perfil";
import Sidebar from "./components/Sidebar";

function LayoutConSidebar({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#1a1f2e" }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<LayoutConSidebar><Dashboard /></LayoutConSidebar>} />
        <Route path="/books" element={<LayoutConSidebar><Books /></LayoutConSidebar>} />
        <Route path="/mis-libros" element={<LayoutConSidebar><MisLibros /></LayoutConSidebar>} />
        <Route path="/perfil" element={<LayoutConSidebar><Perfil /></LayoutConSidebar>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
