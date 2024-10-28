const express = require('express');
const bcrypt = require('bcrypt');
//const mysql = require('mysql2'); // Remove this line if not used
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const pool = require('./db'); // Import the database connection

const app = express();
const port = process.env.PORT || 4000;


// Middleware
app.use(express.json());
app.use(cors());

// Sample endpoint
app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from Node.js!' });
});

// Sign-up endpoint
app.post('/api/signup', [
    body('name').notEmpty().withMessage('Name is required'),
    body('age').isInt({ min: 0 }).withMessage('Age must be a positive integer'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, age, email, phone, password } = req.body;

    try {
        // Check if the user already exists
        const [existingUser] = await pool.query(
            'SELECT * FROM users_old WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            // User already exists
            return res.status(409).json({ message: 'User already exists with this email.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users_old (name, age, email, phone, password) VALUES (?, ?, ?, ?, ?)',
            [name, age, email, phone, hashedPassword]
        );

        res.status(201).json({ id: result.insertId, message: 'User created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Login endpoint
app.post('/api/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const [user] = await pool.query(
            'SELECT * FROM users_old WHERE email = ?',
            [email]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'Email does not exist. Please sign up.' });
        }

        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        res.status(200).json({ message: 'Login successful', userId: user[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Reservation endpoint
app.post('/api/reserve', [
    body('userId').isInt().withMessage('User ID is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('street').notEmpty().withMessage('Street is required'),
    body('postcode').notEmpty().withMessage('Postcode is required'),
    body('terminal').notEmpty().withMessage('Terminal is required'),
    body('pickupTime').notEmpty().withMessage('Pickup time is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, city, street, postcode, terminal, pickupTime } = req.body;

    try {
        // Insert new reservation
        const [result] = await pool.query(
            'INSERT INTO reservations_old (user_id, city, street, postcode, terminal, pickup_time) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, city, street, postcode, terminal, pickupTime]
        );

        res.status(201).json({ id: result.insertId, message: 'Reservation created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});