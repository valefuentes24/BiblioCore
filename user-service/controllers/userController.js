// ===============================
// IMPORTAR MODELO 
// ===============================
const User = require("../models/userModel");

// ===============================
// REGISTRAR USUARIO
// ===============================
// ===============================
exports.registerUser = async (req, res) => {

    
    console.log("🔥 Entró al register");


    try {

        const { name, email, password, role } = req.body;

        // verificar si existe
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "El email ya está registrado"
            });
        }

        // guardar password normal (SIN seguridad)
        const newUser = new User({
            name,
            email,
            password,
            role
        });

        await newUser.save();

        res.status(201).json({
            message: "Usuario registrado ✅"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



// ===============================
// LOGIN USUARIO
// ===============================
// ===============================
exports.loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "Usuario no existe"
            });
        }

        // comparar normal
        if (user.password !== password) {
            return res.status(401).json({
                message: "Contraseña incorrecta"
            });
        }

        res.json({
            message: "Login exitoso 🚀",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ===============================
// LISTAR
// ===============================
exports.getUsers = async (req, res) => {

    const users = await User.find();
    res.json(users);
};


