const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const pool = require('./db'); // Import the database connection

const app = express();
const port = process.env.PORT || 6000;
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




// Driver reservation endpoint for driver_reservations table
app.post('/api/reserve-driver', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('street').notEmpty().withMessage('Street is required'),
    body('postcode').notEmpty().withMessage('Postcode is required'),
    body('terminal').notEmpty().withMessage('Terminal is required'),
    body('pickup_time').notEmpty().withMessage('Pickup time is required'),
    body('driver').notEmpty().withMessage('Driver name is required'),
], async (req, res) => {

    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, city, street, postcode, terminal, pickup_time, driver } = req.body;

    try {
        // Insert reservation data into the database
        const [reservationResult] = await pool.query(
            'INSERT INTO driver_reservations (email, city, street, postcode, terminal, pickup_time, driver) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, city, street, postcode, terminal, pickup_time, driver]
        );

        // Respond with success
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








// Parking reservation endpoint for parking_reservations table
app.post('/api/reserve-parking', [
    body('user_name').notEmpty().withMessage('User name is required'),
    body('phone').notEmpty().withMessage('phone is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('vehicle_number').notEmpty().withMessage('Vehicle number is required'),
    body('reservation_date').isISO8601().withMessage('Valid reservation date is required'),
    body('start_time').notEmpty().withMessage('Start time is required'),
    body('parking_slot').notEmpty().withMessage('Parking slot is required'),
    body('time_period').notEmpty().withMessage('Time period is required'),
    

], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { user_name, vehicle_number, reservation_date, start_time, parking_slot, email, time_period, phone } = req.body;

    try {
        // Insert reservation into parking_reservations table
        const [reservationResult] = await pool.query(
            `INSERT INTO parking_reservations (
                 user_name, vehicle_number, reservation_date, start_time, parking_slot, email, time_period, phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_name, vehicle_number, reservation_date, start_time, parking_slot, email, time_period, phone]
        );

        res.status(201).json({ id: reservationResult.insertId, message: 'Parking reservation created' });
    } catch (error) {
        print(e);
        console.error("Error during parking reservation:", error.message || error);
        res.status(500).json({ error: 'An unexpected error occurred while processing the parking reservation' });
    }
});






// Personal Companion reservation endpoint for personal_companion_reservation table
app.post('/api/reserve-personal-companion', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('date').isISO8601().withMessage('Valid reservation date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('staff').notEmpty().withMessage('Staff name is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, date, time, staff } = req.body;

    try {
        const [reservationResult] = await pool.query(
            'INSERT INTO personal_companion_reservation (name, email, phone, date, time, staff) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, date, time, staff]
        );

        res.status(201).json({ id: reservationResult.insertId, message: 'Personal companion reservation created' });
    } catch (error) {
        console.error("Error during personal companion reservation:", error.message || error);
        res.status(500).json({ error: 'An unexpected error occurred while processing the personal companion reservation' });
    }
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});