const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated } = require("../middleware/auth");

router.get("/", isAuthenticated, (req, res) => {
  const courseId = req.query.courseId;
  const isAdmin = req.session.user.role === "admin";
  const userId = req.session.user.id;

  if (courseId && !isAdmin) {
    db.query(
      "SELECT id FROM enrollments WHERE userId = ? AND courseId = ?",
      [userId, courseId],
      (err, rows) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        if (rows.length === 0) return res.status(403).json({ error: "Access denied" });

        db.query("SELECT * FROM assessments WHERE courseId = ?", [courseId], (err, results) => {
          if (err) return res.status(500).json({ error: "Internal Server Error" });
          res.json(results);
        });
      }
    );
    return;
  }

  let query = "SELECT * FROM assessments";
  let params = [];
  if (courseId) {
    query += " WHERE courseId = ?";
    params.push(courseId);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching assessments:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

router.post("/", isAuthenticated, (req, res) => {
  const { courseId, title, type, dueDate, totalMarks, earnedMarks, weight, status } = req.body;

  if (!courseId || !title || !type) {
    return res.status(400).json({ message: "Course ID, Title, and Type are required." });
  }

  const isAdmin = req.session.user.role === "admin";
  const userId = req.session.user.id;
  const incomingWeight = parseFloat(weight) || 0;

  function doInsert() {
    db.query(
      "SELECT SUM(weight) as totalWeight FROM assessments WHERE courseId = ?",
      [courseId],
      (err, sumResults) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });

        const currentTotalWeight = parseFloat(sumResults[0].totalWeight) || 0;
        if (currentTotalWeight + incomingWeight > 100) {
          return res.status(400).json({
            message: `Cannot add assessment. Current total weight is ${currentTotalWeight}%, adding ${incomingWeight}% exceeds 100%.`,
          });
        }

        db.query(
          `INSERT INTO assessments (courseId, title, type, dueDate, totalMarks, earnedMarks, weight, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [courseId, title, type, dueDate || null, totalMarks || null, earnedMarks || 0, incomingWeight || null, status || "pending"],
          (err) => {
            if (err) return res.status(500).json({ error: "Failed to add assessment" });
            res.status(201).json({ message: "Assessment added successfully!" });
          }
        );
      }
    );
  }

  if (isAdmin) return doInsert();

  db.query(
    "SELECT id FROM enrollments WHERE userId = ? AND courseId = ?",
    [userId, courseId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (rows.length === 0) return res.status(403).json({ message: "Access denied" });
      doInsert();
    }
  );
});

router.delete("/:id", isAuthenticated, (req, res) => {
  const assessmentId = req.params.id;
  const isAdmin = req.session.user.role === "admin";
  const userId = req.session.user.id;

  db.query("SELECT courseId FROM assessments WHERE id = ?", [assessmentId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (rows.length === 0) return res.status(404).json({ message: "Assessment not found" });

    const courseId = rows[0].courseId;

    const doDelete = () => {
      db.query("DELETE FROM assessments WHERE id = ?", [assessmentId], (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to delete assessment" });
        if (results.affectedRows === 0) return res.status(404).json({ message: "Assessment not found" });
        res.status(200).json({ message: "Assessment deleted successfully" });
      });
    };

    if (isAdmin) return doDelete();

    db.query("SELECT id FROM enrollments WHERE userId = ? AND courseId = ?", [userId, courseId], (err, enrollment) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (enrollment.length === 0) return res.status(403).json({ message: "Access denied" });
      doDelete();
    });
  });
});

router.put("/:id", isAuthenticated, (req, res) => {
  const assessmentId = req.params.id;
  const isAdmin = req.session.user.role === "admin";
  const userId = req.session.user.id;
  const { title, type, dueDate, totalMarks, earnedMarks, weight, status } = req.body;
  const incomingWeight = parseFloat(weight) || 0;

  function doUpdate(courseId) {
    const checkWeightQuery =
      "SELECT SUM(weight) as totalWeight FROM assessments WHERE courseId = ? AND id != ?";

    db.query(checkWeightQuery, [courseId, assessmentId], (err, sumResults) => {
      if (err) return res.status(500).json({ message: "Database error" });

      const otherAssessmentsWeight = parseFloat(sumResults[0].totalWeight) || 0;

      if (otherAssessmentsWeight + incomingWeight > 100) {
        return res.status(400).json({
          message: `Cannot update. Other assessments total ${otherAssessmentsWeight}%, updating this to ${incomingWeight}% exceeds 100%.`,
        });
      }

      const updateQuery = `
        UPDATE assessments
        SET title = ?, type = ?, dueDate = ?, totalMarks = ?, earnedMarks = ?, weight = ?, status = ?
        WHERE id = ?
      `;

      db.query(
        updateQuery,
        [title, type, dueDate || null, totalMarks || null, earnedMarks || 0, incomingWeight || null, status || "pending", assessmentId],
        (err) => {
          if (err) {
            console.error("Error updating assessment:", err);
            return res.status(500).json({ message: "Failed to update assessment" });
          }
          res.status(200).json({ message: "Assessment updated successfully!" });
        }
      );
    });
  }

  db.query("SELECT courseId FROM assessments WHERE id = ?", [assessmentId], (err, courseResults) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (courseResults.length === 0) return res.status(404).json({ message: "Assessment not found" });

    const courseId = courseResults[0].courseId;

    if (isAdmin) return doUpdate(courseId);

    db.query("SELECT id FROM enrollments WHERE userId = ? AND courseId = ?", [userId, courseId], (err, enrollment) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (enrollment.length === 0) return res.status(403).json({ message: "Access denied" });
      doUpdate(courseId);
    });
  });
});

module.exports = router;
