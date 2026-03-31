const express = require('express');
const session = require('express-session');
require('dotenv').config();
const db = require('./server/db');
const { isAuthenticated, isAdmin } = require('./server/middleware/auth');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

app.get('/dashboard.html', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/Html/dashboard.html');
});
app.get('/my courses.html', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/Html/my courses.html');
});
app.get('/course-details.html', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/Html/course-details.html');
});
app.get('/assessment-details.html', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/Html/assessment-details.html');
});
app.get('/edit_profile.html', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/Html/edit_profile.html');
});

// Admin only pages
app.get('/adminManageUsers.html', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + '/Html/adminManageUsers.html');
});
app.get('/adminManageCourses.html', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + '/Html/adminManageCourses.html');
});
app.get('/adminStatistics.html', isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + '/Html/adminStatistics.html');
});

app.use(express.static('Html'));
app.use('/Css', express.static('Css'));
app.use('/Js', express.static('Js'));
app.use('/Photos', express.static('Photos'));
const authRoutes = require('./server/routes/auth');
app.use('/api/auth', authRoutes);


app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on http://localhost:3000');
});
