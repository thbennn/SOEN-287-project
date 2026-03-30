const express = require('express');
const session = require('express-session');
require('dotenv').config();
const db = require('./server/db');



const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('Html'));
app.use('/Css', express.static('Css'));
app.use('/Js', express.static('Js'));
app.use('/Photos', express.static('Photos'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

app.get('/api/courses', (req, res) => {
    const query = "SELECT courseCode, courseName, instructor, status FROM courses";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching courses:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(results); 
        }
    });
});

app.post('/api/courses', (req, res) => {
    const { courseCode, courseName, instructor, status } = req.body;
    
    //TEMPORARY: Hardcode a userId
    const userId = 1; 

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

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on http://localhost:3000');
});
