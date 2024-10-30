const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const pool = require('./db'); // Import the database connection

const app = express();
const port = process.env.PORT || 4000;
const saltRounds = 10; // for bcrypt

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
            return res.status(409).json({ message: 'User already exists with this email.' });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, saltRounds);

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
        const [rows] = await pool.query('SELECT * FROM users_old WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Email does not exist. Please sign up.' });
        }

        const user = rows[0];

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        res.status(200).json({ message: 'Login successful', userId: user.id });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

const { body, validationResult } = require('express-validator');
const pool = require('./database'); // assuming database pool is imported from another file

// Driver reservation endpoint for driver_reservations table
app.post('/api/reserve', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('street').notEmpty().withMessage('Street is required'),
    body('postcode').notEmpty().withMessage('Postcode is required'),
], async (req, res) => {
    console.log('Driver reservation request received:', req.body); // Log request

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, city, street, postcode } = req.body;

    try {
        const [reservationResult] = await pool.query(
            'INSERT INTO f_driver (email, city, street, postcode) VALUES (?, ?, ?, ?)',
            [email, city, street, postcode]
        );

        res.status(201).json({ id: reservationResult.insertId, message: 'Driver reservation created' });
    } catch (error) {
        console.error("Error during driver reservation:", error.message || error);
        res.status(500).json({ error: 'An unexpected error occurred while processing the driver reservation' });
    }
});

// Lounge reservation endpoint for lounge_reservations table
app.post('/api/reserve-lounge', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('lounge_name').notEmpty().withMessage('Lounge name is required'),
    body('departure_time').isISO8601().withMessage('Valid ISO8601 departure time is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, lounge_name, departure_time } = req.body;

    try {
        // Insert reservation into f_lounge
        const [reservationResult] = await pool.query(
            'INSERT INTO f_lounge (email, lounge_name, departure_date_time) VALUES (?, ?, ?)',
            [email, lounge_name, departure_time]
        );

        res.status(201).json({ id: reservationResult.insertId, message: 'Lounge reservation created' });
    } catch (error) {
        console.error("Error during lounge reservation:", error.message || error);
        res.status(500).json({ error: 'An unexpected error occurred while processing the lounge reservation' });
    }
});



// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
