# Smart Course Companion

A full-stack web application that helps Concordia University students organize their courses, track assessments and grades, and visualize their academic progress in one place.

Built as the term project for **SOEN 287 – Web Programming** at Concordia University (Winter 2026).

## Overview

Students often juggle course outlines, deadlines, and grade tracking across spreadsheets, notebooks, and Moodle. Smart Course Companion brings these into a single interface where a student can:

- View all their enrolled courses on one dashboard
- Browse details for each course (description, schedule, instructor)
- Track upcoming assessments and deadlines
- Record grades and see weighted progress toward a final mark
- Persist their data across sessions through a backend database

## Tech Stack

**Frontend**
- HTML5 — page structure and semantic markup
- CSS3 — responsive styling and layout
- Vanilla JavaScript — client-side logic and dynamic content

**Backend**
- Node.js — runtime
- Express — HTTP server and routing
- SQL — relational database for persistent user, course, and grade data (schema defined in `schema.sql`)

## Project Structure

```
SOEN-287-project/
├── Html/             # Page templates (dashboard, course detail, login, etc.)
├── Css/              # Stylesheets
├── Js/               # Client-side JavaScript
├── Photos/           # Images and visual assets
├── server/           # Backend route handlers and database logic
├── server.js         # Express application entry point
├── schema.sql        # Database schema definition
├── package.json      # Node.js dependencies and scripts
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (bundled with Node.js)
- A SQL database client compatible with `schema.sql` (e.g., SQLite, MySQL, or PostgreSQL — whichever the project targets)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/thbennn/SOEN-287-project.git
   cd SOEN-287-project
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database using the provided schema:
   ```bash
   # Example for SQLite — adjust for your DB engine
   sqlite3 database.db < schema.sql
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. Open your browser to `http://localhost:3000` (or whichever port the server logs on startup).

## Features

- Multi-page navigation between dashboard, course list, and course detail views
- Persistent storage of users, courses, assessments, and grades through a SQL backend
- REST routes for fetching and updating course data
- Responsive layout that adapts to different screen sizes
- Visual indicators for grade progress and upcoming deadlines
- Clean, student-focused user interface

## Course Context

This project was developed for **SOEN 287 – Web Programming**, a second-year undergraduate course in the Software Engineering program at the Gina Cody School of Engineering and Computer Science, Concordia University.

The project demonstrates fundamentals of full-stack web development, including HTML structure, CSS styling, JavaScript interactivity, server-side routing with Node.js and Express, and relational database design.

## Status

This project is complete and was submitted as the final term deliverable for SOEN 287 (Winter 2026). It runs locally on a developer machine and is intended for academic and demonstration purposes.
