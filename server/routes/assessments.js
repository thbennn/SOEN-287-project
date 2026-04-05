const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/", isAuthenticated, (req, res) => {
  const courseId = req.query.courseId;
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

router.post("/", isAuthenticated, isAdmin, (req, res) => {
  const { courseId, title, type, dueDate, totalMarks, earnedMarks, weight, status } =
    req.body;

  if (!courseId || !title || !type) {
    return res
      .status(400)
      .json({ message: "Course ID, Title, and Type are required." });
  }

  const incomingWeight = parseFloat(weight) || 0;

  const checkWeightQuery =
    "SELECT SUM(weight) as totalWeight FROM assessments WHERE courseId = ?";

  db.query(checkWeightQuery, [courseId], (err, sumResults) => {
    if (err) {
      console.error("Error checking total weight:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const currentTotalWeight = parseFloat(sumResults[0].totalWeight) || 0;

    if (currentTotalWeight + incomingWeight > 100) {
      return res.status(400).json({
        message: `Cannot add assessment. Current total weight is ${currentTotalWeight}%, adding ${incomingWeight}% exceeds 100%.`,
      });
    }

    const insertQuery = `
      INSERT INTO assessments (courseId, title, type, dueDate, totalMarks, earnedMarks, weight, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        courseId,
        title,
        type,
        dueDate || null,
        totalMarks || null,
        earnedMarks || 0,
        incomingWeight || null,
        status || "pending",
      ],
      (err, results) => {
        if (err) {
          console.error("Error inserting assessment:", err);
          return res.status(500).json({ error: "Failed to add assessment" });
        }
        res.status(201).json({ message: "Assessment added successfully!" });
      },
    );
  });
});

router.delete("/:id", isAuthenticated, isAdmin, (req, res) => {
  const assessmentId = req.params.id;
  const query = "DELETE FROM assessments WHERE id = ?";

  db.query(query, [assessmentId], (err, results) => {
    if (err) {
      console.error("Error deleting assessment:", err);
      return res.status(500).json({ message: "Failed to delete assessment" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.status(200).json({ message: "Assessment deleted successfully" });
  });
});

router.put("/:id", isAuthenticated, isAdmin, (req, res) => {
  const assessmentId = req.params.id;
  const { title, type, dueDate, totalMarks, earnedMarks, weight, status } = req.body;
  const incomingWeight = parseFloat(weight) || 0;

  const getCourseIdQuery = "SELECT courseId FROM assessments WHERE id = ?";

  db.query(getCourseIdQuery, [assessmentId], (err, courseResults) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (courseResults.length === 0)
      return res.status(404).json({ message: "Assessment not found" });

    const courseId = courseResults[0].courseId;

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
        [
          title,
          type,
          dueDate || null,
          totalMarks || null,
          earnedMarks || 0,
          incomingWeight || null,
          status || "pending",
          assessmentId,
        ],
        (err, results) => {
          if (err) {
            console.error("Error updating assessment:", err);
            return res
              .status(500)
              .json({ message: "Failed to update assessment" });
          }
          res.status(200).json({ message: "Assessment updated successfully!" });
        },
      );
    });
  });
});

module.exports = router;
