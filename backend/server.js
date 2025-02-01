const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const db = new sqlite3.Database('database.sqlite');
const adminRoutes = require('./admin-routes');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateAdmin } = require('./middleware/auth');

// Define JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use env in production

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.use(express.json());
app.use(cors());

// Use admin routes
app.use('/api/admin', adminRoutes);

// Initialize database with new schema
db.serialize(() => {
  // Create departments table
  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department_id INTEGER,
    university TEXT DEFAULT 'University of South Florida',
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS course_semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    semester_id INTEGER NOT NULL,
    UNIQUE(course_id, semester_id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (semester_id) REFERENCES semesters(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS professor_course_semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER NOT NULL,
    course_semester_id INTEGER NOT NULL,
    UNIQUE(course_semester_id),
    FOREIGN KEY (professor_id) REFERENCES professors(id),
    FOREIGN KEY (course_semester_id) REFERENCES course_semesters(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_course_semester_id INTEGER NOT NULL,
    student_email TEXT NOT NULL,
    UNIQUE(professor_course_semester_id, student_email),
    FOREIGN KEY (professor_course_semester_id) REFERENCES professor_course_semesters(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_course_semester_id INTEGER NOT NULL,
    student_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    course_difficulty INTEGER NOT NULL CHECK (course_difficulty >= 1 AND course_difficulty <= 5),
    course_quality INTEGER NOT NULL CHECK (course_quality >= 1 AND course_quality <= 5),
    course_liking INTEGER NOT NULL CHECK (course_liking >= 1 AND course_liking <= 5),
    review TEXT,
    grade TEXT CHECK (
      grade IN (
        'A+', 'A', 'A-',
        'B+', 'B', 'B-',
        'C+', 'C', 'C-',
        'D+', 'D', 'D-',
        'F', 'E', 'FF', 'I', 'IF', 'IU',
        'M', 'MF', 'MU', 'N', 'R', 'S',
        'U', 'W', 'WC', 'Z'
      )
    ),
    course_type TEXT CHECK (course_type IN ('online', 'offline')),
    date TEXT,
    UNIQUE(professor_course_semester_id, student_email),
    FOREIGN KEY (professor_course_semester_id) REFERENCES professor_course_semesters(id),
    FOREIGN KEY (professor_course_semester_id, student_email) REFERENCES enrollments(professor_course_semester_id, student_email)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rating_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY (rating_id) REFERENCES ratings(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    UNIQUE(rating_id, tag_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS professor_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    count INTEGER DEFAULT 1,
    FOREIGN KEY (professor_id) REFERENCES professors(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id),
    UNIQUE(professor_id, tag_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    university TEXT DEFAULT 'University of South Florida',
    is_admin BOOLEAN DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS professor_views (
    professor_id INTEGER PRIMARY KEY,
    view_count INTEGER DEFAULT 0,
    FOREIGN KEY (professor_id) REFERENCES professors(id)
  )`);
});

// Modified API endpoints to work with new schema while maintaining the same response format

// Get all professors with average rating
app.get('/api/professors', (req, res) => {
  const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
  
  db.all(`
    SELECT DISTINCT
      p.id, 
      p.name, 
      d.name as department,
      p.university, 
      ROUND(COALESCE(AVG(r.rating), 0), 1) as averageRating,
      COUNT(DISTINCT r.id) as numberOfRatings
    FROM professors p
    JOIN departments d ON p.department_id = d.id
    LEFT JOIN professor_course_semesters pcs ON p.id = pcs.professor_id
    LEFT JOIN course_semesters cs ON pcs.course_semester_id = cs.id
    LEFT JOIN courses c ON cs.course_id = c.id
    LEFT JOIN ratings r ON pcs.id = r.professor_course_semester_id
    WHERE LOWER(p.name) LIKE ?
       OR LOWER(d.name) LIKE ?
       OR LOWER(c.name) LIKE ?
    GROUP BY p.id, p.name, d.name, p.university
    ORDER BY 
      CASE 
        WHEN LOWER(p.name) LIKE ? THEN 0
        WHEN LOWER(d.name) LIKE ? THEN 1
        WHEN LOWER(c.name) LIKE ? THEN 2
        ELSE 3
      END,
      p.name ASC
  `, [
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`,
    `%${searchTerm}%`
  ], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get professor details
app.get('/api/professors/:id/details', (req, res) => {
  db.get(`
    SELECT 
      p.*,
      COALESCE(AVG(r.rating), 0) as averageRating,
      COUNT(DISTINCT r.id) as numberOfRatings
    FROM professors p
    LEFT JOIN professor_course_semesters pcs ON p.id = pcs.professor_id
    LEFT JOIN ratings r ON pcs.id = r.professor_course_semester_id
    WHERE p.id = ?
    GROUP BY p.id
  `, [req.params.id], (err, professor) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!professor) {
      res.status(404).json({ error: 'Professor not found' });
      return;
    }

    // Get courses and semesters taught by professor
    db.all(`
      SELECT DISTINCT 
        c.id as course_id,
        c.name as course_name,
        s.id as semester_id,
        s.name as semester_name,
        cs.id as course_semester_id
      FROM courses c
      JOIN course_semesters cs ON c.id = cs.course_id
      JOIN semesters s ON cs.semester_id = s.id
      JOIN professor_course_semesters pcs ON cs.id = pcs.course_semester_id
      WHERE pcs.professor_id = ?
      ORDER BY s.name DESC, c.name ASC
    `, [req.params.id], (err, courseSemesters) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        ...professor, 
        courseSemesters,
        averageRating: Number(professor.averageRating).toFixed(1),
        numberOfRatings: professor.numberOfRatings
      });
    });
  });
});

// Get ratings for a professor (with optional course-semester filter)
app.get('/api/professors/:id/ratings', (req, res) => {
  const { course_id, semester_id } = req.query;
  
  let query = `
    SELECT 
      r.*, 
      c.name as course_name, 
      s.name as semester_name,
      c.id as course_id,
      s.id as semester_id,
      p.name as professor_name,
      p.id as professor_id,
      GROUP_CONCAT(t.name) as tags
    FROM ratings r
    JOIN professor_course_semesters pcs ON r.professor_course_semester_id = pcs.id
    JOIN course_semesters cs ON pcs.course_semester_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    JOIN semesters s ON cs.semester_id = s.id
    JOIN professors p ON pcs.professor_id = p.id
    LEFT JOIN rating_tags rt ON r.id = rt.rating_id
    LEFT JOIN tags t ON rt.tag_id = t.id
    WHERE pcs.professor_id = ?
  `;
  
  const params = [req.params.id];
  
  if (course_id && semester_id) {
    query += ` AND cs.course_id = ? AND cs.semester_id = ?`;
    params.push(course_id, semester_id);
  }
  
  query += ` GROUP BY r.id ORDER by r.date DESC`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Convert tags string to array and format the response
    const ratingsWithTags = rows.map(row => ({
      id: row.id,
      rating: row.rating,
      review: row.review,
      grade: row.grade,
      course_type: row.course_type,
      date: row.date,
      email: row.student_email,
      professor: {
        id: row.professor_id,
        name: row.professor_name
      },
      course: {
        id: row.course_id,
        name: row.course_name
      },
      semester: {
        id: row.semester_id,
        name: row.semester_name
      },
      tags: row.tags ? row.tags.split(',') : []
    }));
    res.json(ratingsWithTags);
  });
});

// Get rating distribution for a professor
app.get('/api/professors/:id/rating-distribution', (req, res) => {
  db.all(`
    SELECT rating, COUNT(*) as count
    FROM ratings r
    JOIN professor_course_semesters pcs ON r.professor_course_semester_id = pcs.id
    WHERE pcs.professor_id = ?
    GROUP BY rating
  `, [req.params.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const distribution = {
      awesome: 0, great: 0, good: 0, ok: 0, awful: 0
    };
    rows.forEach(row => {
      switch(row.rating) {
        case 5: distribution.awesome = row.count; break;
        case 4: distribution.great = row.count; break;
        case 3: distribution.good = row.count; break;
        case 2: distribution.ok = row.count; break;
        case 1: distribution.awful = row.count; break;
      }
    });
    res.json(distribution);
  });
});

// Update the tag distribution endpoint to include both overall and course-specific tags
app.get('/api/professors/:id/tag-distribution', (req, res) => {
  const { course_id, semester_id } = req.query;
  
  if (course_id && semester_id) {
    // Return course-specific tags
    let query = `
      SELECT 
        t.name as tag,
        COUNT(*) as count
      FROM rating_tags rt
      JOIN tags t ON rt.tag_id = t.id
      JOIN ratings r ON rt.rating_id = r.id
      JOIN professor_course_semesters pcs ON r.professor_course_semester_id = pcs.id
      JOIN course_semesters cs ON pcs.course_semester_id = cs.id
      WHERE pcs.professor_id = ?
        AND cs.course_id = ? 
        AND cs.semester_id = ?
      GROUP BY t.id 
      ORDER BY count DESC
    `;
    
    db.all(query, [req.params.id, course_id, semester_id], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } else {
    // Return overall professor tags
    let query = `
      SELECT 
        t.name as tag,
        pt.count
      FROM professor_tags pt
      JOIN tags t ON pt.tag_id = t.id
      WHERE pt.professor_id = ?
      ORDER BY pt.count DESC
    `;
    
    db.all(query, [req.params.id], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  }
});

// Get all available tags
app.get('/api/tags', (req, res) => {
  db.all('SELECT * FROM tags ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Check if email is enrolled in course-semester
app.get('/api/enrollments/verify', (req, res) => {
  const { professor_course_semester_id, email } = req.query;
  
  db.get(`
    SELECT 1 FROM enrollments 
    WHERE professor_course_semester_id = ? AND student_email = ?
  `, [professor_course_semester_id, email], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ isEnrolled: !!row });
  });
});

// Add rating (with authentication and enrollment check)
app.post('/api/ratings', authenticateToken, async (req, res) => {
  const { professor_id, course_id, semester_id, rating, review, grade, course_type, course_difficulty, course_quality, course_liking } = req.body;
  const email = req.user.email;

  if (!review || review.length < 100) {
    return res.status(400).json({ error: 'Review must be at least 100 characters long' });
  }

  if (!course_type || !['online', 'offline'].includes(course_type)) {
    return res.status(400).json({ error: 'Course type must be either online or offline' });
  }

  try {
    // First, find the professor_course_semester_id
    const courseSemester = await new Promise((resolve, reject) => {
      db.get(`
        SELECT pcs.id
        FROM professor_course_semesters pcs
        JOIN course_semesters cs ON pcs.course_semester_id = cs.id
        WHERE pcs.professor_id = ? AND cs.course_id = ? AND cs.semester_id = ?
      `, [professor_id, course_id, semester_id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!courseSemester) {
      return res.status(404).json({ error: 'Course-professor combination not found' });
    }

    const professor_course_semester_id = courseSemester.id;

    // Check if student is enrolled
    const enrollment = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 1 FROM enrollments 
        WHERE professor_course_semester_id = ? AND student_email = ?
      `, [professor_course_semester_id, email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Student not enrolled in this course' });
    }

    // Check if student has already rated this course
    const existingRating = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 1 FROM ratings 
        WHERE professor_course_semester_id = ? AND student_email = ?
      `, [professor_course_semester_id, email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (existingRating) {
      return res.status(400).json({ 
        error: 'You have already submitted a rating for this course. You can only submit one rating per course.'
      });
    }

    // Add the rating
    const date = new Date().toISOString();
    db.run(`
      INSERT INTO ratings (
        professor_course_semester_id, 
        student_email, 
        rating, 
        review, 
        grade, 
        course_type,
        course_difficulty,
        course_quality,
        course_liking,
        date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      professor_course_semester_id, 
      email, 
      rating, 
      review, 
      grade, 
      course_type,
      course_difficulty,
      course_quality,
      course_liking,
      date
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        success: true,
        message: 'Rating submitted successfully',
        id: this.lastID 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all semesters
app.get('/api/semesters', (req, res) => {
  db.all('SELECT * FROM semesters ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get all courses
app.get('/api/courses', (req, res) => {
  db.all('SELECT * FROM courses ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get course-semesters for a professor
app.get('/api/professors/:id/course-semesters', (req, res) => {
  db.all(`
    SELECT 
      pcs.id as professor_course_semester_id,
      c.id as course_id,
      c.name as course_name,
      s.id as semester_id,
      s.name as semester_name
    FROM professor_course_semesters pcs
    JOIN course_semesters cs ON pcs.course_semester_id = cs.id
    JOIN courses c ON cs.course_id = c.id
    JOIN semesters s ON cs.semester_id = s.id
    WHERE pcs.professor_id = ?
    ORDER BY s.name DESC, c.name ASC
  `, [req.params.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  
  // Validate USF email
  if (!email.endsWith('@usf.edu')) {
    return res.status(400).json({ error: 'Only @usf.edu email addresses are allowed' });
  }

  // Check if email exists in enrollments
  try {
    const enrollment = await new Promise((resolve, reject) => {
      db.get('SELECT 1 FROM enrollments WHERE student_email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Email not found in course enrollments. Please enroll in a course first.' });
    }

    // Check if email already registered
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (email, password, display_name) VALUES (?, ?, ?)',
      [email, hashedPassword, displayName],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error creating user' });
        }
        const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET);
        res.json({ 
          token,
          user: {
            id: this.lastID,
            email,
            displayName
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate USF email
  if (!email.endsWith('@usf.edu')) {
    return res.status(400).json({ error: 'Only @usf.edu email addresses are allowed' });
  }

  try {
    // First check if this is an admin user
    const adminUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ? AND is_admin = 1', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    // If not admin, check enrollment
    if (!adminUser) {
      const enrollment = await new Promise((resolve, reject) => {
        db.get('SELECT 1 FROM enrollments WHERE student_email = ?', [email], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Email not found in course enrollments. Please enroll in a course first.' });
      }
    }

    // Proceed with login
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Server error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, email }, JWT_SECRET);
        res.json({ 
          token,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            isAdmin: user.is_admin === 1
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/professors/:id/view', (req, res) => {
  db.run(`
    INSERT INTO professor_views (professor_id, view_count) 
    VALUES (?, 1)
    ON CONFLICT(professor_id) DO UPDATE SET 
    view_count = view_count + 1
  `, [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

app.get('/api/professors/underrated', (req, res) => {
  db.all(`
    SELECT 
      p.id,
      p.name,
      d.name as department,
      p.university,
      ROUND(AVG(r.rating), 1) as averageRating,
      COUNT(DISTINCT r.id) as numberOfRatings,
      COALESCE(pv.view_count, 0) as viewCount
    FROM professors p
    JOIN departments d ON p.department_id = d.id
    LEFT JOIN professor_course_semesters pcs ON p.id = pcs.professor_id
    LEFT JOIN ratings r ON pcs.id = r.professor_course_semester_id
    LEFT JOIN professor_views pv ON p.id = pv.professor_id
    GROUP BY p.id
    HAVING 
      AVG(r.rating) >= 1.0 
    --  AND COUNT(DISTINCT r.id) >= 3
    ORDER BY COALESCE(pv.view_count, 0) ASC
    LIMIT 3
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/courses/top-rated', (req, res) => {
  db.all(`
    SELECT 
      c.id,
      c.name,
      ROUND(AVG(r.course_quality), 1) as averageQuality,
      ROUND(AVG(r.course_difficulty), 1) as averageDifficulty,
      ROUND(AVG(r.course_liking), 1) as averageLiking,
      COUNT(DISTINCT r.id) as numberOfRatings
    FROM courses c
    JOIN course_semesters cs ON c.id = cs.course_id
    JOIN professor_course_semesters pcs ON cs.id = pcs.course_semester_id
    JOIN ratings r ON pcs.id = r.professor_course_semester_id
    GROUP BY c.id
    HAVING numberOfRatings >= 3
    ORDER BY averageQuality DESC
    LIMIT 3
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/ratings/stats', (req, res) => {
  db.get(`
    SELECT COUNT(*) as totalReviews
    FROM ratings
  `, [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

app.listen(3002, () => console.log('Server running on port 3002'));
