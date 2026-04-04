const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, (req, res) => {
    const query = "SELECT id, studentId, firstName, lastName, email, phone, dob, passwordHash, role, status FROM Users";
    
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
    const {firstName, lastName, email, phone, dob, password, role, status } = req.body;
    
    if (!firstName || !lastName || !email || !password || !dob) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    if (role !== 'admin' && role !== 'student') {
        return res.status(400).json({ message: "Invalid role assigned" });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });

        const query = `
          INSERT INTO users (firstName, lastName, email, phone, dob, passwordHash, role, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [firstName, lastName, email, phone, dob, hash, role, status], (err, results) => {
            if (err) {
                console.error("Error inserting user:", err);
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

router.delete('/:id', isAuthenticated, isAdmin, (req, res) => {
    const userId = req.params.id;

    if (userId == req.session.user.id) {
        return res.status(400).json({ message: "You cannot delete your own account!" });
    }

    const query = "DELETE FROM users WHERE id = ?";

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error deleting user:", err);
            return res.status(500).json({ message: "Failed to delete user" });
        } 

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    });
});

module.exports = router;