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

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on http://localhost:3000');
});
