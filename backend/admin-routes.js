const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const { authenticateAdmin, JWT_SECRET } = require('./middleware/auth');

router.use(authenticateAdmin);

// Get all departments
router.get('/departments', (req, res) => {
  db.all('SELECT * FROM departments ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create a new department
router.post('/departments', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO departments (name) VALUES (?)', 
    [name], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Create a new professor (updated to use department_id)
router.post('/professors', (req, res) => {
  const { name, department_id } = req.body;
  db.run('INSERT INTO professors (name, department_id) VALUES (?, ?)', 
    [name, department_id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Create a new course
router.post('/courses', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO courses (name) VALUES (?)', 
    [name], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Create a new semester
router.post('/semesters', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO semesters (name) VALUES (?)', 
    [name], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Assign course to semester
router.post('/course-semesters', (req, res) => {
  const { course_id, semester_id } = req.body;
  db.run('INSERT INTO course_semesters (course_id, semester_id) VALUES (?, ?)', 
    [course_id, semester_id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Assign professor to course-semester
router.post('/professor-course-semesters', (req, res) => {
  const { professor_id, course_semester_id } = req.body;
  db.run('INSERT INTO professor_course_semesters (professor_id, course_semester_id) VALUES (?, ?)', 
    [professor_id, course_semester_id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Get all course-semesters with details
router.get('/course-semesters', (req, res) => {
  db.all(`
    SELECT 
      cs.id,
      c.name as course_name,
      s.name as semester_name,
      c.id as course_id,
      s.id as semester_id,
      COALESCE(p.name, 'Unassigned') as professor_name,
      p.id as professor_id
    FROM course_semesters cs
    JOIN courses c ON cs.course_id = c.id
    JOIN semesters s ON cs.semester_id = s.id
    LEFT JOIN professor_course_semesters pcs ON cs.id = pcs.course_semester_id
    LEFT JOIN professors p ON pcs.professor_id = p.id
    ORDER BY s.name, c.name
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get available courses for a semester
router.get('/available-courses/:semester_id', (req, res) => {
  db.all(`
    SELECT c.* 
    FROM courses c
    WHERE NOT EXISTS (
      SELECT 1 
      FROM course_semesters cs 
      WHERE cs.course_id = c.id 
      AND cs.semester_id = ?
    )
    ORDER BY c.name
  `, [req.params.semester_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get available professors for a course-semester
router.get('/available-professors/:course_semester_id', (req, res) => {
  db.all(`
    SELECT p.* 
    FROM professors p
    WHERE NOT EXISTS (
      SELECT 1 
      FROM professor_course_semesters pcs 
      WHERE pcs.professor_id = p.id 
      AND pcs.course_semester_id = ?
    )
    ORDER BY p.name
  `, [req.params.course_semester_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Delete a professor
router.delete('/professors/:id', (req, res) => {
  db.run('DELETE FROM professors WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
});

// Delete a course
router.delete('/courses/:id', (req, res) => {
  db.run('DELETE FROM courses WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
});

// Delete a semester
router.delete('/semesters/:id', (req, res) => {
  db.run('DELETE FROM semesters WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
});

// Delete a course-semester
router.delete('/course-semesters/:id', (req, res) => {
  db.run('DELETE FROM course_semesters WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
});

// Remove professor from course-semester
router.delete('/professor-course-semesters/:course_semester_id', (req, res) => {
  db.run('DELETE FROM professor_course_semesters WHERE course_semester_id = ?', 
    [req.params.course_semester_id], 
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Removed' });
    }
  );
});

// Update professor (updated to use department_id)
router.put('/professors/:id', (req, res) => {
  const { name, department_id } = req.body;
  db.run('UPDATE professors SET name = ?, department_id = ? WHERE id = ?', 
    [name, department_id, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated' });
    }
  );
});

// Update course
router.put('/courses/:id', (req, res) => {
  const { name } = req.body;
  db.run('UPDATE courses SET name = ? WHERE id = ?', 
    [name, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated' });
    }
  );
});

// Update semester
router.put('/semesters/:id', (req, res) => {
  const { name } = req.body;
  db.run('UPDATE semesters SET name = ? WHERE id = ?', 
    [name, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Updated' });
    }
  );
});

// Add enrollment
router.post('/enrollments', (req, res) => {
  const { professor_course_semester_id, student_email } = req.body;
  db.run('INSERT INTO enrollments (professor_course_semester_id, student_email) VALUES (?, ?)', 
    [professor_course_semester_id, student_email], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Remove enrollment
router.delete('/enrollments/:professor_course_semester_id/:student_email', (req, res) => {
  const { professor_course_semester_id, student_email } = req.params;
  db.run('DELETE FROM enrollments WHERE professor_course_semester_id = ? AND student_email = ?', 
    [professor_course_semester_id, student_email], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Deleted' });
    }
  );
});

// Get enrollments for a course-semester
router.get('/enrollments/:professor_course_semester_id', (req, res) => {
  db.all(`
    SELECT e.*, 
      c.name as course_name, 
      s.name as semester_name,
      p.name as professor_name
    FROM enrollments e
    JOIN professor_course_semesters pcs ON e.professor_course_semester_id = pcs.id
    JOIN course_semesters cs ON pcs.course_semester_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    JOIN semesters s ON cs.semester_id = s.id
    JOIN professors p ON pcs.professor_id = p.id
    WHERE e.professor_course_semester_id = ?
  `, [req.params.professor_course_semester_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router; 