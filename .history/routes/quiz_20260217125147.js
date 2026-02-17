const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get today's quiz
router.get('/', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {
        res.render('quiz', { settings });
    });
});

// Submit Quiz
router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if already participated
    db.get("SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?", [device_id, today], (err, row) => {
        if (row) return res.json({ success: false, message: "لقد شاركت اليوم بالفعل!" });

        db.all("SELECT id, correct_answer FROM questions WHERE quiz_date = ?", [today], (err, questions) => {
            let score = 0;
            questions.forEach(q => {
                if (answers[q.id] == q.correct_answer) score++;
            });

            db.run("INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
                [name, age, phone, device_id, score, today], function(err) {
                    res.json({ success: true, score, total: questions.length });
                });
        });
    });
});

module.exports = router;