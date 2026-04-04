const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.get("/", isAuthenticated, (req, res) => {
  const query =
    "SELECT id, courseCode, courseName, instructor, status FROM courses";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching courses:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

router.post("/", isAuthenticated, isAdmin, (req, res) => {
  const { courseCode, courseName, instructor, status } = req.body;

  if (
    !courseCode ||
    typeof courseCode !== "string" ||
    courseCode.trim() === ""
  ) {
    return res.status(400).json({ message: "Valid Course Code is required." });
  }
  if (
    !courseName ||
    typeof courseName !== "string" ||
    courseName.trim() === ""
  ) {
    return res.status(400).json({ message: "Valid Course Name is required." });
  }
  if (status !== "active" && status !== "inactive") {
    return res.status(400).json({ message: "Invalid status value." });
  }

  const userId = req.session.user.id;

  const query = `
      INSERT INTO courses (userId, courseCode, courseName, instructor, status) 
      VALUES (?, ?, ?, ?, ?)
    `;

  db.query(
    query,
    [userId, courseCode, courseName, instructor, status],
    (err, results) => {
      if (err) {
        console.error("Error inserting course:", err);
        res.status(500).json({ error: "Failed to add course" });
      } else {
        res.status(201).json({ message: "Course added successfully!" });
      }
    },
  );
});

router.delete("/:id", isAuthenticated, isAdmin, (req, res) => {
  const courseId = req.params.id;

  const query = "DELETE FROM courses WHERE id = ?";

  db.query(query, [courseId], (err, results) => {
    if (err) {
      console.error("Error deleting course:", err);
      return res.status(500).json({ message: "Failed to delete course" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted successfully" });
  });
});

router.put("/:id", isAuthenticated, isAdmin, (req, res) => {
  const courseId = req.params.id;
  const { courseCode, courseName, instructor, status } = req.body;

  const query = `
      UPDATE courses 
      SET courseCode = ?, courseName = ?, instructor = ?, status = ? 
      WHERE id = ?
    `;

  db.query(
    query,
    [courseCode, courseName, instructor, status, courseId],
    (err, results) => {
      if (err) {
        console.error("Error updating course:", err);
        return res.status(500).json({ message: "Failed to update course" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.status(200).json({ message: "Course updated successfully!" });
    },
  );
});

module.exports = router;
