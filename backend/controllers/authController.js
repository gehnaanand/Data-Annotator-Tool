const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const databaseController = require("./databaseController");
const User = require('../models/User');

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET is not set in the environment variables.');
}

const register = async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const existingUser = await databaseController.findUserByUsername(username);
        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));

        const userId = require('crypto').randomUUID();

        console.log('Creating new user:', userId, username, hashedPassword, role);
        const newUser = new User({
            id: userId,
            username: username,
            passwordHash: hashedPassword,
            createdDate: new Date(),
            lastLogin: new Date(),
            role: role || 'client',
        });
        
        newUser.validate();
        await databaseController.insertUser(newUser);

        return res.status(201).json({ message: 'User registered successfully', id: userId });
    } catch (err) {
        console.error('Error during registration:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await databaseController.findUserByUsername(username);
        if (user == null) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );

        await databaseController.updateLastLogin(user.id);

        return res.status(200).json({ message: 'Login successful', token, id: user.id });
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token" });
    }
};

module.exports = { register, login, authenticate };