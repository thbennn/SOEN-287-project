const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated } = require("../middleware/auth");

// GET /api/grades/by-assessment?assessmentId=X&courseId=Y — admin view: all enrolled students with their grade
router.get("/by-assessment", isAuthenticated, (req, res) => {
  const { assessmentId, courseId } = req.query;

  if (!assessmentId || !courseId) {
    return res.status(400).json({ error: "assessmentId and courseId are required" });
  }

  const query = `
    SELECT u.id AS userId, u.studentId AS schoolId, u.firstName, u.lastName,
           COALESCE(g.earnedMarks, 0) AS earnedMarks,
           COALESCE(g.isClosed, 0) AS isClosed
    FROM enrollments e
    JOIN users u ON u.id = e.userId
    LEFT JOIN grades g ON g.assessmentId = ? AND g.studentId = e.userId
    WHERE e.courseId = ?
    ORDER BY u.lastName, u.firstName
  `;

  db.query(query, [assessmentId, courseId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// PUT /api/grades/admin — admin updates any student's grade
router.put("/admin", isAuthenticated, (req, res) => {
  const { studentId, assessmentId, earnedMarks, isClosed } = req.body;

  if (!studentId || !assessmentId) {
    return res.status(400).json({ error: "studentId and assessmentId are required" });
  }

  db.query(
    `INSERT INTO grades (studentId, assessmentId, earnedMarks, isClosed)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE earnedMarks = VALUES(earnedMarks), isClosed = VALUES(isClosed)`,
    [studentId, assessmentId, earnedMarks ?? 0, isClosed ? 1 : 0],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Grade updated successfully!" });
    }
  );
});

// GET /api/grades/by-course?courseId=X — returns all assessments for a course with the user's grades merged in
router.get("/by-course", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { courseId } = req.query;

  if (!courseId) {
    return res.status(400).json({ error: "courseId is required" });
  }

  const query = `
    SELECT a.id, a.title, a.type, a.dueDate, a.totalMarks, a.weight,
           COALESCE(g.earnedMarks, 0) AS earnedMarks,
           COALESCE(g.isClosed, 0) AS isClosed
    FROM assessments a
    LEFT JOIN grades g ON g.assessmentId = a.id AND g.studentId = ?
    WHERE a.courseId = ?
  `;

  db.query(query, [userId, courseId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    let weightedSum = 0;
    let totalWeight = 0;
    let completedCount = 0;

    results.forEach(a => {
      const earned = parseFloat(a.earnedMarks) || 0;
      const total = parseFloat(a.totalMarks) || 0;
      const weight = parseFloat(a.weight) || 0;
      if (total > 0 && weight > 0) {
        weightedSum += (earned / total) * 100 * weight;
        totalWeight += weight;
      }
      if (a.isClosed === 1) completedCount++;
    });

    res.json({
      assessments: results,
      average: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0,
      completion: results.length > 0 ? Math.round((completedCount / results.length) * 100) : 0,
      completedCount,
      totalCount: results.length
    });
  });
});

// GET /api/grades?assessmentId=X — returns the logged-in user's grade
router.get("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { assessmentId } = req.query;

  if (!assessmentId) {
    return res.status(400).json({ error: "assessmentId is required" });
  }

  db.query(
    "SELECT earnedMarks, isClosed FROM grades WHERE studentId = ? AND assessmentId = ?",
    [userId, assessmentId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) {
        return res.json({ earnedMarks: 0, isClosed: 0 });
      }
      res.json(results[0]);
    }
  );
});

// PUT /api/grades — upsert the logged-in user's grade
router.put("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { assessmentId, earnedMarks, isClosed } = req.body;

  if (!assessmentId) {
    return res.status(400).json({ error: "assessmentId is required" });
  }

  db.query(
    `INSERT INTO grades (studentId, assessmentId, earnedMarks, isClosed)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE earnedMarks = VALUES(earnedMarks), isClosed = VALUES(isClosed)`,
    [userId, assessmentId, earnedMarks ?? 0, isClosed ? 1 : 0],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Grade saved successfully!" });
    }
  );
});

module.exports = router;
