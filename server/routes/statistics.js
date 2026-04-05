const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/", isAuthenticated, isAdmin, (_, res) => {
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

        db.query(`
          SELECT CASE WHEN isClosed = 1 THEN 'completed' ELSE 'pending' END as status,
                 COUNT(*) as count
          FROM grades
          GROUP BY isClosed
        `, (err, assessmentStatusResults) => {
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
              SELECT c.courseCode,
                IFNULL(ROUND((SUM(CASE WHEN g.isClosed = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(e.userId), 0)) * 100, 2), 0) as completionRate
              FROM courses c
              JOIN assessments a ON c.id = a.courseId
              JOIN enrollments e ON e.courseId = c.id
              LEFT JOIN grades g ON g.assessmentId = a.id AND g.studentId = e.userId
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
