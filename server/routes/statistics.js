const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/", isAuthenticated, isAdmin, (req, res) => {
  const stats = {};

  db.query("SELECT role, COUNT(*) as count FROM users GROUP BY role", (err, userResults) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.users = userResults;

    db.query("SELECT status, COUNT(*) as count FROM courses GROUP BY status", (err, courseResults) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.courses = courseResults;

      db.query("SELECT type, COUNT(*) as count FROM assessments GROUP BY type", (err, assessmentTypeResults) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.assessmentTypes = assessmentTypeResults;

        db.query("SELECT status, COUNT(*) as count FROM assessments GROUP BY status", (err, assessmentStatusResults) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.assessmentStatus = assessmentStatusResults;

          const avgGradeQuery = `
            SELECT c.courseCode, IFNULL(ROUND(AVG((g.earnedMarks / a.totalMarks) * 100), 2), 0) as avgGrade
            FROM courses c
            JOIN assessments a ON c.id = a.courseId
            JOIN grades g ON a.id = g.assessmentId
            GROUP BY c.id, c.courseCode
          `;
          db.query(avgGradeQuery, (err, avgGradeResults) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.courseAverages = avgGradeResults;

            const completionQuery = `
              SELECT c.courseCode, IFNULL(ROUND((SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2), 0) as completionRate
              FROM courses c
              JOIN assessments a ON c.id = a.courseId
              GROUP BY c.id, c.courseCode
            `;
            db.query(completionQuery, (err, completionResults) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.courseCompletion = completionResults;


              res.json(stats);
            });
          });
        });
      });
    });
  });
});

module.exports = router;
