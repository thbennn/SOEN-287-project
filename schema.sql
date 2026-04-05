-- Smart Course Companion - Database Schema
-- Run this file in phpMyAdmin to set up the database.

CREATE DATABASE IF NOT EXISTS smart_course_companion;
USE smart_course_companion;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  dob DATE DEFAULT NULL,
  studentId VARCHAR(20) DEFAULT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  status VARCHAR(20) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  courseCode VARCHAR(20) NOT NULL,
  courseName VARCHAR(150) NOT NULL,
  instructor VARCHAR(100) DEFAULT NULL,
  term VARCHAR(50) DEFAULT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  courseId INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  type ENUM('assignment', 'lab', 'quiz', 'exam') NOT NULL,
  dueDate DATE DEFAULT NULL,
  earnedMarks DECIMAL(5,2) DEFAULT NULL,
  totalMarks DECIMAL(5,2) DEFAULT NULL,
  weight DECIMAL(5,2) DEFAULT NULL,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  courseId INT NOT NULL,
  UNIQUE KEY unique_enrollment (userId, courseId)
);

-- Grades (per-student, per-assessment)
CREATE TABLE IF NOT EXISTS grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  assessmentId INT NOT NULL,
  earnedMarks DECIMAL(5,2) DEFAULT 0,
  isClosed TINYINT(1) DEFAULT 0,
  gradedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_assessment (studentId, assessmentId),
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assessmentId) REFERENCES assessments(id) ON DELETE CASCADE
);

-- Default admin account (password: admin123)
INSERT IGNORE INTO users (firstName, lastName, email, passwordHash, role, status)
VALUES ('Admin', 'User', 'admin@gmail.com', '$2b$10$XuuNUt8Tk9N7DNf60YxaS..IfbCwKtMYRrXFcLTgsCVIUSPnGzoE2', 'admin', 'active');
