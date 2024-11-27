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


// Middleware to store the email after successful login or sign-up
const storeEmailInRequest = (req, res, next) => {
    if (req.body.email) {
      req.userEmail = req.body.email; // Store the email in the request object
    }
    next();
  };
  

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

         // Store email in the request object
    req.userEmail = email;

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
         // Store email in the request object
    req.userEmail = email;

        res.status(200).json({message: 'Login successful',
            userId: user.id,
            name: user.name,
            age: user.age,
            email: user.email,
            phone: user.phone,
        });
        
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
app.use(express.json());  // This is necessary to parse JSON in the request body

app.post('/api/reserve-lounge', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('lounge_name').notEmpty().withMessage('Lounge name is required'),
  body('departure_time').isISO8601().withMessage('Valid ISO8601 departure time is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, lounge_name, departure_time } = req.body;

  try {
    // Insert reservation into lounge_reservations table
    const [reservationResult] = await pool.query(
      'INSERT INTO lounge_reservations (name, email, phone, lounge_name, departure_time) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, lounge_name, departure_time]
    );

    res.status(201).json({
      id: reservationResult.insertId,
      message: 'Lounge reservation created successfully'
    });
  } catch (error) {
    console.error("Error during lounge reservation:", error.message || error);
    res.status(500).json({ error: 'email alredy exit ' });
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
        // Check for existing reservation
        const [existingReservation] = await pool.query(
            `SELECT * FROM parking_reservations WHERE parking_slot = ? AND reservation_date = ?`,
            [parking_slot, reservation_date]
        );

        if (existingReservation.length > 0) {
            return res.status(400).json({ error: 'The selected parking slot is already reserved for the specified time' });
        }

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
    body('passenger_type').notEmpty().withMessage('passenger type name is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, date, time, staff, passenger_type } = req.body;

    try {
        const [reservationResult] = await pool.query(
            'INSERT INTO personal_companion_reservation (name, email, phone, date, time, staff, passenger_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone, date, time, staff, passenger_type]
        );

        res.status(201).json({ id: reservationResult.insertId, message: 'Personal companion reservation created' });
    } catch (error) {
        console.error("Error during personal companion reservation:", error.message || error);
        res.status(500).json({ error: 'An unexpected error occurred while processing the personal companion reservation' });
    }
});






app.post('/api/get-reservations', async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      console.error('Email is missing in the request body.');
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
  
    console.log(`Fetching reservations for email: ${email}`);
  
    try {
      const reservations = {
        driver_reservations: [],
        lounge_reservations: [],
        parking_reservations: [],
        personal_companion_reservations: [],
      };
  
      console.log('Fetching driver reservations...');
      const driverReservations = await pool.query(
        'SELECT * FROM driver_reservations WHERE email = ?',
        [email]
      );
      reservations.driver_reservations = driverReservations[0];
      console.log('Driver reservations fetched:', driverReservations[0]);
  
      console.log('Fetching lounge reservations...');
      const loungeReservations = await pool.query(
        'SELECT * FROM lounge_reservations WHERE email = ?',
        [email]
      );
      reservations.lounge_reservations = loungeReservations[0];
      console.log('Lounge reservations fetched:', loungeReservations[0]);
  
      console.log('Fetching parking reservations...');
      const parkingReservations = await pool.query(
        'SELECT * FROM parking_reservations WHERE email = ?',
        [email]
      );
      reservations.parking_reservations = parkingReservations[0];
      console.log('Parking reservations fetched:', parkingReservations[0]);
  
      console.log('Fetching personal companion reservations...');
      const personalCompanionReservations = await pool.query(
        'SELECT * FROM personal_companion_reservation WHERE email = ?',
        [email]
      );
      reservations.personal_companion_reservations =
        personalCompanionReservations[0];
      console.log(
        'Personal companion reservations fetched:',
        personalCompanionReservations[0]
      );
  
      console.log('All reservations fetched successfully.');
      res.status(200).json({ success: true, data: reservations });
    } catch (error) {
      console.error('Error fetching reservations:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });



  // Endpoint to fetch user information based on email
app.get('/api/user-info', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Query to fetch user info from the users_old table
        const [rows] = await pool.query('SELECT * FROM users_old WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];

        // Send the user information as the response
        res.status(200).json({
            name: user.name,
            age: user.age,
            email: user.email,
            phone: user.phone
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ message: 'An error occurred while fetching user info' });
    }
});

  
  








// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});