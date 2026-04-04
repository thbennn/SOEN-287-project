const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/", isAuthenticated, isAdmin, (req, res) => {
  const stats = {};

  db.query(
    "SELECT role, COUNT(*) as count FROM users GROUP BY role",
    (err, userResults) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.users = userResults;

      db.query(
        "SELECT status, COUNT(*) as count FROM courses GROUP BY status",
        (err, courseResults) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.courses = courseResults;

          db.query(
            "SELECT type, COUNT(*) as count FROM assessments GROUP BY type",
            (err, assessmentTypeResults) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.assessmentTypes = assessmentTypeResults;

              db.query(
                "SELECT status, COUNT(*) as count FROM assessments GROUP BY status",
                (err, assessmentStatusResults) => {
                  if (err) return res.status(500).json({ error: err.message });
                  stats.assessmentStatus = assessmentStatusResults;

                  res.json(stats);
                },
              );
            },
          );
        },
      );
    },
  );
});

module.exports = router;
