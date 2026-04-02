const express = require('express');
const router = express.Router();
const db = require('../db');

app.get('/', (req, res) => {
    const query = "SELECT id, courseCode, courseName, instructor, status FROM courses";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching courses:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results); 
        }
    });
});

app.post('/', (req, res) => {
    const { courseCode, courseName, instructor, status } = req.body;
    
    const userId = req.session.user.id; 

    const query = `
      INSERT INTO courses (userId, courseCode, courseName, instructor, status) 
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(query, [userId, courseCode, courseName, instructor, status], (err, results) => {
        if (err) {
            console.error("Error inserting course:", err);
            res.status(500).json({ error: "Failed to add course" });
        } else {
            res.status(201).json({ message: "Course added successfully!" });
        }
    });
});

module.exports = router;