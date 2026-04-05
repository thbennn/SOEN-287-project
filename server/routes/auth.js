const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { isAuthenticated } = require('../middleware/auth');

// REGISTER
router.post('/register', (req, res) => {
  const { firstName, lastName, email, password, phone, dob, studentId, role } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  // Check if email already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if studentId already exists (only if provided)
    if (studentId && studentId.trim() !== '') {
      db.query('SELECT id FROM users WHERE studentId = ?', [studentId.trim()], (err, idResults) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (idResults.length > 0) {
          return res.status(400).json({ message: 'Student ID already registered' });
        }
        proceedWithRegistration();
      });
    } else {
      proceedWithRegistration();
    }

    function proceedWithRegistration() {
      let formattedDob = null;
      if (dob) {
        const parts = dob.split('/');
        if (parts.length === 3) {
          formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          formattedDob = dob;
        }
      }

      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ message: 'Error hashing password' });

        db.query(
          'INSERT INTO users (firstName, lastName, email, passwordHash, phone, dob, studentId, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [firstName, lastName, email, hash, phone, formattedDob, studentId, role || 'student'],
          (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ message: 'User registered successfully' });
          }
        );
      });
    }
  });
});
// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' });
  }

  // Check if user exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare password with hashed password
    bcrypt.compare(password, user.passwordHash, (err, match) => {
      if (err) return res.status(500).json({ message: 'Error checking password' });

      if (!match) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Save user info in session
      req.session.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      };

      res.status(200).json({ 
        message: 'Login successful',
        role: user.role
      });
    });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.redirect('/login.html');
  });
});

// GET current user role
router.get('/me', isAuthenticated, (req, res) => {
  res.json({ role: req.session.user.role });
});

// GET PROFILE - load current user data
router.get('/profile', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  
  db.query('SELECT firstName, lastName, email, phone, dob, studentId FROM users WHERE id = ?', 
  [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(results[0]);
  });
});

// UPDATE PROFILE
router.post('/profile', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { email, phone, dob, newPassword } = req.body;

  if (newPassword) {
    // Update with new password
    bcrypt.hash(newPassword, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Error hashing password' });
      
      db.query(
        'UPDATE users SET email = ?, phone = ?, dob = ?, passwordHash = ? WHERE id = ?',
        [email, phone, dob, hash, userId],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });
          req.session.user.email = email;
          res.status(200).json({ message: 'Profile updated successfully' });
        }
      );
    });
  } else {
    // Update without password change
    db.query(
      'UPDATE users SET email = ?, phone = ?, dob = ? WHERE id = ?',
      [email, phone, dob, userId],
      (err) => {
        if (err) return res.status(500).json({ message: err.message });
        req.session.user.email = email;
        res.status(200).json({ message: 'Profile updated successfully' });
      }
    );
  }
});

module.exports = router;