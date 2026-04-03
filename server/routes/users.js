const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, (req, res) => {
    const query = "SELECT id, firstName, lastName, email, role, status FROM Users";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching users:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results); 
        }
    });
});

router.post('/', isAuthenticated, isAdmin, (req, res) => {
    const { firstName, lastName, email, password, role, status } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });

        const query = `
          INSERT INTO users (firstName, lastName, email, passwordHash, role, status) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [firstName, lastName, email, hash, role, status], (err, results) => {
            if (err) {
                console.error("Error inserting user:", err);
                // Catch duplicate emails
                if(err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: "Email already exists" });
                }
                res.status(500).json({ message: "Failed to add user" });
            } else {
                res.status(201).json({ message: "User added successfully!" });
            }
        });
    });
});

module.exports = router;