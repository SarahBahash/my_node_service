const mysql = require('mysql2');
const mysql = require('mysql');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'Aa1234', // Replace with your MySQL password
    database: 'jetsetgo', // Your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Aa1234',
    database: 'jetsetgo'
    });
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

module.exports = pool.promise(); // Use promise-based API