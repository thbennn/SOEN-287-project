const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated } = require("../middleware/auth");

// GET enrolled courses for current user (with avg + completion)
router.get("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  const query = `
    SELECT
      c.id, c.courseCode, c.courseName, c.instructor, c.term, c.status,
      IFNULL(ROUND(
        SUM(CASE WHEN a.totalMarks > 0 AND a.weight > 0 THEN (g.earnedMarks / a.totalMarks) * 100 * a.weight ELSE 0 END)
        / NULLIF(SUM(CASE WHEN a.totalMarks > 0 AND a.weight > 0 THEN a.weight ELSE 0 END), 0)
      ), 0) AS average,
      IFNULL(ROUND((SUM(CASE WHEN g.isClosed = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100), 0) AS completion
    FROM enrollments e
    JOIN courses c ON e.courseId = c.id
    LEFT JOIN assessments a ON c.id = a.courseId
    LEFT JOIN grades g ON g.assessmentId = a.id AND g.studentId = e.userId
    WHERE e.userId = ? AND c.status = 'active'
    GROUP BY c.id, c.courseCode, c.courseName, c.instructor, c.term, c.status
    ORDER BY c.courseCode
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// POST enroll in a course
router.post("/", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { courseId } = req.body;

  if (!courseId) return res.status(400).json({ message: "Course ID required" });

  db.query(
    "INSERT INTO enrollments (userId, courseId) VALUES (?, ?)",
    [userId, courseId],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ message: "Already enrolled in this course" });
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({ message: "Enrolled successfully!" });
    }
  );
});

// DELETE unenroll from a course
router.delete("/:courseId", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { courseId } = req.params;

  db.query(
    "DELETE FROM enrollments WHERE userId = ? AND courseId = ?",
    [userId, courseId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.affectedRows === 0)
        return res.status(404).json({ message: "Enrollment not found" });
      res.json({ message: "Unenrolled successfully" });
    }
  );
});

module.exports = router;
