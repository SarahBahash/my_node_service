const mysql = require('mysql2'); // or 'mysql' if you are using that one

// Create a connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'Aa1234', // Replace with your MySQL password
    database: 'jetsetgo', // Your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Export the pool with promise support
module.exports = pool.promise();