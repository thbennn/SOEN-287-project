const express = require('express');
const session = require('express-session');
require('dotenv').config();
const db = require('./server/db');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('Html'));
app.use('/Css', express.static('Css'));
app.use('/Js', express.static('Js'));
app.use('/Photos', express.static('Photos'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
  })
);

// ----------- COURSES CRUD ------------

// Get all courses for a user + average/completion
app.get('/api/courses', (req, res) => {
  const userId = 1;

  const query = `
    SELECT
      c.id,
      c.courseCode,
      c.courseName,
      c.instructor,
      c.term,
      c.status,
      IFNULL(ROUND((SUM(a.earnedMarks) / NULLIF(SUM(a.totalMarks), 0)) * 100), 0) AS average,
      IFNULL(ROUND((SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100), 0) AS completion
    FROM courses c
    LEFT JOIN assessments a ON c.id = a.courseId
    WHERE c.userId = ?
    GROUP BY c.id, c.courseCode, c.courseName, c.instructor, c.term, c.status
    ORDER BY c.courseCode
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Courses fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch courses' });
    }
    res.json(results);
  });
});

// Add course
app.post('/api/courses', (req, res) => {
  const { courseCode, courseName, instructor, term, status } = req.body;
  const userId = 1;

  const query = `
    INSERT INTO courses (userId, courseCode, courseName, instructor, term, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [userId, courseCode, courseName, instructor, term, status], (err, results) => {
    if (err) {
      console.error('Course insert error:', err);
      return res.status(500).json({ error: 'Failed to add course' });
    }
    res.status(201).json({ message: 'Course added successfully!', id: results.insertId });
  });
});

// Update course
app.put('/api/courses/:id', (req, res) => {
  const courseId = req.params.id;
  const { courseCode, courseName, instructor, term, status } = req.body;
  const userId = 1;

  const query = `
    UPDATE courses
    SET courseCode = ?, courseName = ?, instructor = ?, term = ?, status = ?
    WHERE id = ? AND userId = ?
  `;

  db.query(query, [courseCode, courseName, instructor, term, status, courseId, userId], (err, results) => {
    if (err) {
      console.error('Course update error:', err);
      return res.status(500).json({ error: 'Failed to update course' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course updated successfully!' });
  });
});

// Delete course from DB
app.delete('/api/courses/:id', (req, res) => {
  const courseId = req.params.id;
  const userId = 1;

  const query = `
    DELETE FROM courses
    WHERE id = ? AND userId = ?
  `;

  db.query(query, [courseId, userId], (err, results) => {
    if (err) {
      console.error('Course delete error:', err);
      return res.status(500).json({ error: 'Failed to delete course' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully!' });
  });
});

// ----------- ASSESSMENTS CRUD ------------

// Get all assessments for a course
app.get('/api/assessments/:courseId', (req, res) => {
  const courseId = req.params.courseId;

  const query = `
    SELECT id, courseId, title, type, dueDate, earnedMarks, totalMarks, weight, status
    FROM assessments
    WHERE courseId = ?
    ORDER BY dueDate
  `;

  db.query(query, [courseId], (err, results) => {
    if (err) {
      console.error('Assessment fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch assessments' });
    }
    res.json(results);
  });
});

// Get one assessment
app.get('/api/assessment/:id', (req, res) => {
  const assessmentId = req.params.id;

  const query = `
    SELECT id, courseId, title, type, dueDate, earnedMarks, totalMarks, weight, status
    FROM assessments
    WHERE id = ?
  `;

  db.query(query, [assessmentId], (err, results) => {
    if (err) {
      console.error('Single assessment fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch assessment' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(results[0]);
  });
});

// Add assessment
app.post('/api/assessments', (req, res) => {
  const { courseId, title, type, dueDate, weight, earnedMarks, totalMarks, status } = req.body;

  const query = `
    INSERT INTO assessments
    (courseId, title, type, dueDate, weight, earnedMarks, totalMarks, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      courseId,
      title,
      type,
      dueDate,
      weight || 0,
      earnedMarks || 0,
      totalMarks || 0,
      status || 'pending'
    ],
    (err, results) => {
      if (err) {
        console.error('Assessment insert error:', err);
        return res.status(500).json({ error: 'Failed to add assessment' });
      }
      res.status(201).json({ message: 'Assessment added successfully!', id: results.insertId });
    }
  );
});

// Update assessment
app.put('/api/assessments/:id', (req, res) => {
  const assessmentId = req.params.id;
  const { title, type, dueDate, weight, earnedMarks, totalMarks, status } = req.body;

  const query = `
    UPDATE assessments
    SET title = ?, type = ?, dueDate = ?, weight = ?, earnedMarks = ?, totalMarks = ?, status = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [title, type, dueDate, weight || 0, earnedMarks || 0, totalMarks || 0, status || 'pending', assessmentId],
    (err, results) => {
      if (err) {
        console.error('Assessment update error:', err);
        return res.status(500).json({ error: 'Failed to update assessment' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.json({ message: 'Assessment updated successfully!' });
    }
  );
});

// Delete assessment
app.delete('/api/assessments/:id', (req, res) => {
  const assessmentId = req.params.id;

  const query = `
    DELETE FROM assessments
    WHERE id = ?
  `;

  db.query(query, [assessmentId], (err, results) => {
    if (err) {
      console.error('Assessment delete error:', err);
      return res.status(500).json({ error: 'Failed to delete assessment' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json({ message: 'Assessment deleted successfully!' });
  });
});

// ----------- UPCOMING (OVERDUE + DUE SOON ONLY) ------------

app.get('/api/upcoming-assessments', (req, res) => {
  const userId = 1;

  const query = `
    SELECT
      a.id,
      a.title,
      a.dueDate,
      a.status,
      c.courseCode
    FROM assessments a
    JOIN courses c ON a.courseId = c.id
    WHERE c.userId = ?
      AND a.status != 'completed'
      AND (
        a.dueDate < CURDATE()
        OR a.dueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      )
    ORDER BY a.dueDate ASC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Upcoming fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch upcoming assessments' });
    }

    const mapped = results.map(item => {
      const due = new Date(item.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueDateOnly = new Date(due);
      dueDateOnly.setHours(0, 0, 0, 0);

      return {
        ...item,
        label: dueDateOnly < today ? 'Overdue' : 'Due Soon'
      };
    });

    res.json(mapped);
  });
});

// ----------- START SERVER ------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});