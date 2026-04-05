const express = require("express");
const session = require("express-session");
require("dotenv").config();
const db = require("./server/db");
const { isAuthenticated, isAdmin } = require("./server/middleware/auth");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  }),
);

// Protected student pages
app.get("/dashboard.html", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/Html/dashboard.html");
});

app.get("/my courses.html", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/Html/my courses.html");
});

app.get("/course-details.html", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/Html/course-details.html");
});

app.get("/assessment-details.html", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/Html/assessment-details.html");
});

app.get("/edit_profile.html", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/Html/edit_profile.html");
});

// Admin only pages
app.get("/adminManageUsers.html", isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + "/Html/adminManageUsers.html");
});

app.get("/adminManageCourses.html", isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + "/Html/adminManageCourses.html");
});

app.get("/adminStatistics.html", isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + "/Html/adminStatistics.html");
});

app.get("/adminManageAssessments.html", isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(__dirname + "/Html/adminManageAssessments.html");
});

// Static files
app.use(express.static("Html"));
app.use("/Css", express.static("Css"));
app.use("/Js", express.static("Js"));
app.use("/Photos", express.static("Photos"));

// Route files
const authRoutes = require("./server/routes/auth");
app.use("/api/auth", authRoutes);

const courseRoutes = require("./server/routes/courses");
app.use("/api/courses", courseRoutes);

const userRoutes = require("./server/routes/users");
app.use("/api/users", userRoutes);

const assessmentRoutes = require("./server/routes/assessments");
app.use("/api/assessments", assessmentRoutes);

const statisticsRoutes = require("./server/routes/statistics");
app.use("/api/statistics", statisticsRoutes);

const enrollmentRoutes = require("./server/routes/enrollments");
app.use("/api/enrollments", enrollmentRoutes);

const gradeRoutes = require("./server/routes/grades");
app.use("/api/grades", gradeRoutes);

// Single assessment by ID
app.get("/api/assessment/:id", isAuthenticated, (req, res) => {
  const assessmentId = req.params.id;

  const query = `
    SELECT id, courseId, title, type, dueDate, earnedMarks, totalMarks, weight, status
    FROM assessments
    WHERE id = ?
  `;

  db.query(query, [assessmentId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    res.json(results[0]);
  });
});

// Upcoming assessments for logged-in user only
app.get("/api/upcoming-assessments", isAuthenticated, (req, res) => {
  const userId = req.session.user?.id || req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = `
    SELECT a.id, a.title, a.dueDate, c.courseCode
    FROM assessments a
    JOIN courses c ON a.courseId = c.id
    JOIN enrollments e ON e.courseId = c.id AND e.userId = ?
    LEFT JOIN grades g ON g.assessmentId = a.id AND g.studentId = ?
    WHERE COALESCE(g.isClosed, 0) != 1
      AND a.dueDate IS NOT NULL
      AND (
        a.dueDate < CURDATE()
        OR a.dueDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      )
    ORDER BY a.dueDate ASC
  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapped = results.map((item) => {
      const due = new Date(item.dueDate);
      due.setHours(0, 0, 0, 0);

      return {
        ...item,
        label: due < today ? "Overdue" : "Due Soon",
      };
    });

    res.json(mapped);
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on http://localhost:3000");
});