const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const bcrypt = require('bcrypt');

db.serialize(() => {
  // Insert departments
  db.run(`INSERT OR IGNORE INTO departments (name) VALUES 
    ('Computer Science'),
    ('Physics'),
    ('Mathematics'),
    ('Biology'),
    ('Chemistry'),
    ('Engineering'),
    ('Business'),
    ('Psychology'),
    ('English'),
    ('History')`
  );

  // Insert professors
  db.run(`INSERT OR IGNORE INTO professors (name, department_id) VALUES 
    ('John Doe', (SELECT id FROM departments WHERE name = 'Computer Science')),
    ('Jane Smith', (SELECT id FROM departments WHERE name = 'Physics')),
    ('Bob Johnson', (SELECT id FROM departments WHERE name = 'Mathematics')),
    ('Alice Brown', (SELECT id FROM departments WHERE name = 'Biology')),
    ('Charlie Davis', (SELECT id FROM departments WHERE name = 'Chemistry')),
    ('Eva Wilson', (SELECT id FROM departments WHERE name = 'Computer Science')),
    ('Frank Miller', (SELECT id FROM departments WHERE name = 'Physics')),
    ('Grace Lee', (SELECT id FROM departments WHERE name = 'Mathematics'))`
  );

  // Insert courses
  db.run(`INSERT OR IGNORE INTO courses (name) VALUES 
    ('Data Structures'),
    ('Algorithms'),
    ('Calculus I'),
    ('Organic Chemistry'),
    ('Introduction to Psychology'),
    ('World History'),
    ('Business Ethics'),
    ('Quantum Physics'),
    ('Cell Biology'),
    ('Software Engineering'),
    ('Database Systems'),
    ('Machine Learning'),
    ('Web Development'),
    ('Operating Systems')`
  );

  // Insert semesters
  db.run(`INSERT OR IGNORE INTO semesters (name) VALUES 
    ('2024 Spring'),
    ('2024 Fall'),
    ('2024 Summer'),
    ('2025 Spring')`
  );

  // Insert course-semesters
  db.run(`INSERT OR IGNORE INTO course_semesters (course_id, semester_id) VALUES 
    ((SELECT id FROM courses WHERE name = 'Data Structures'), (SELECT id FROM semesters WHERE name = '2024 Spring')),
    ((SELECT id FROM courses WHERE name = 'Algorithms'), (SELECT id FROM semesters WHERE name = '2024 Fall')),
    ((SELECT id FROM courses WHERE name = 'Calculus I'), (SELECT id FROM semesters WHERE name = '2024 Spring')),
    ((SELECT id FROM courses WHERE name = 'Database Systems'), (SELECT id FROM semesters WHERE name = '2024 Spring')),
    ((SELECT id FROM courses WHERE name = 'Machine Learning'), (SELECT id FROM semesters WHERE name = '2024 Fall')),
    ((SELECT id FROM courses WHERE name = 'Web Development'), (SELECT id FROM semesters WHERE name = '2024 Spring'))`
  );

  // Insert professor-course-semesters
  db.run(`INSERT OR IGNORE INTO professor_course_semesters (professor_id, course_semester_id) 
    SELECT p.id, cs.id
    FROM professors p
    CROSS JOIN course_semesters cs
    WHERE p.name IN ('John Doe', 'Eva Wilson', 'Grace Lee')
    LIMIT 6`
  );

  // Insert sample enrollments
  db.run(`INSERT OR IGNORE INTO enrollments (professor_course_semester_id, student_email) 
    SELECT pcs.id, email
    FROM professor_course_semesters pcs
    CROSS JOIN (
      SELECT 'student1@usf.edu' as email
      UNION SELECT 'student2@usf.edu'
      UNION SELECT 'student3@usf.edu'
      UNION SELECT 'student4@usf.edu'
      UNION SELECT 'navya@usf.edu'
    ) emails
    WHERE EXISTS (
      SELECT 1 
      FROM course_semesters cs 
      JOIN courses c ON cs.course_id = c.id 
      WHERE cs.id = pcs.course_semester_id 
      AND c.name = 'Data Structures'
    )`
  );

  // Insert sample ratings with new fields
  const insertRating = db.prepare(`
    INSERT OR IGNORE INTO ratings (
      professor_course_semester_id, 
      student_email, 
      rating,
      course_difficulty,
      course_quality,
      course_liking,
      review, 
      grade,
      course_type,
      date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Get all enrollments and add ratings
  db.all(`SELECT * FROM enrollments`, [], (err, enrollments) => {
    if (err) {
      console.error('Error fetching enrollments:', err);
      return;
    }

    const reviews = [
      "The professor was excellent at explaining complex concepts. The course material was challenging but well-structured.",
      "Great teaching style and very approachable. The assignments were helpful for understanding the material.",
      "One of the best professors I've had. Clear explanations and fair grading.",
      "Very knowledgeable and passionate about the subject. Makes difficult concepts easy to understand."
    ];

    const grades = ['A', 'A-', 'B+', 'B', 'A+'];
    const types = ['online', 'offline'];

    enrollments.forEach(enrollment => {
      const randomReview = reviews[Math.floor(Math.random() * reviews.length)];
      const randomGrade = grades[Math.floor(Math.random() * grades.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      insertRating.run(
        enrollment.professor_course_semester_id,
        enrollment.student_email,
        Math.floor(Math.random() * 3) + 3,  // rating 3-5
        Math.floor(Math.random() * 3) + 2,  // difficulty 2-4
        Math.floor(Math.random() * 3) + 3,  // quality 3-5
        Math.floor(Math.random() * 3) + 3,  // liking 3-5
        randomReview,
        randomGrade,
        randomType,
        new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
      );
    });

    insertRating.finalize();
  });

  // Insert sample professor views
  db.run(`INSERT OR IGNORE INTO professor_views (professor_id, view_count)
    SELECT id, ABS(RANDOM() % 100) + 1
    FROM professors`
  );

  // Insert sample tags
  db.run(`INSERT OR IGNORE INTO tags (name) VALUES 
    ('Gives Pop Quizzes'),
    ('Lots of Homework'),
    ('Group Projects'),
    ('Clear Grading'),
    ('Test Heavy'),
    ('Participation Matters'),
    ('Skip Class? You Won''t Pass.'),
    ('Extra Credit'),
    ('Accessible Outside Class'),
    ('Tough Grader'),
    ('Amazing Lectures'),
    ('Lecture Heavy'),
    ('Hilarious'),
    ('Beware of Surprise Quizzes'),
    ('Inspirational'),
    ('So Many Papers'),
    ('Graded by Few Things'),
    ('Would Take Again')`
  );

  // Insert sample rating tags
  db.run(`INSERT OR IGNORE INTO rating_tags (rating_id, tag_id)
    SELECT r.id, t.id
    FROM ratings r
    CROSS JOIN tags t
    WHERE t.name IN ('Amazing Lectures', 'Would Take Again', 'Clear Grading')
    LIMIT 20`
  );

  // Insert sample professor tags with varying counts
  db.run(`INSERT OR IGNORE INTO professor_tags (professor_id, tag_id, count)
    SELECT 
      p.id,
      t.id,
      ABS(RANDOM() % 10) + 1 as count
    FROM professors p
    CROSS JOIN tags t
    WHERE p.name IN ('John Doe', 'Eva Wilson', 'Grace Lee')
    LIMIT 15`
  );

  // Create admin user
  bcrypt.hash('profguide', 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error creating admin user:', err);
      return;
    }

    db.run(`
      INSERT OR IGNORE INTO users (
        email,
        password,
        display_name,
        is_admin
      ) VALUES (?, ?, ?, ?)
    `, [
      'profguide_admin@usf.edu',
      hashedPassword,
      'ProfGuide Admin',
      1
    ], (err) => {
      if (err) {
        console.error('Error inserting admin user:', err);
      } else {
        console.log('Admin user created successfully');
      }
    });
  });

  console.log('Database seeded successfully!');
}); 