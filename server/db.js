const mysql = require('mysql2');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log("DB_USER:", process.env.DB_USER);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL database!');

  db.query(`
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
    )
  `, (err) => {
    if (err) console.error('Error creating grades table:', err.message);
    else console.log('Grades table ready.');
  });
});

module.exports = db;