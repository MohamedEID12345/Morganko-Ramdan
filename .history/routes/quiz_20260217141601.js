const express = require('express');
const router = express.Router();
const db = require('../config/db');

// هذا المسار سيعمل على http://localhost:3000/quiz
router.get('/', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {
        if (!config) return res.send("يرجى ضبط الإعدادات من لوحة التحكم أولاً");

        // فحص وقت المسابقة
        if (currentTime < config.quiz_start_time) {
            return res.render('coming-soon', { targetTime: config.quiz_start_time });
        }
        if (currentTime > config.quiz_end_time) {
            return res.render('message', { msg: "عفواً، انتهى وقت المسابقة لليوم!" });
        }

        // جلب الأسئلة
        db.all("SELECT * FROM questions WHERE quiz_date = ?", [today], (err, questions) => {
            if (!questions || questions.length === 0) {
                return res.render('message', { msg: "لا توجد أسئلة مضافة لليوم، يرجى مراجعة الإدارة" });
            }
            res.render('quiz', { questions });
        });
    });
});

// فحص الجهاز (POST /quiz/check-device)
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    db.get("SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?", [device_id, today], (err, row) => {
        if (row) return res.json({ allowed: false, msg: "لقد شاركت في مسابقة اليوم بالفعل!" });
        res.json({ allowed: true });
    });
});

// إرسال الإجابات (POST /quiz/submit)
router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.all("SELECT id, correct_answer FROM questions WHERE quiz_date = ?", [today], (err, questions) => {
        let score = 0;
        if (questions) {
            questions.forEach(q => {
                if (answers[q.id] == q.correct_answer) score++;
            });
        }

        db.run("INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
        [name, age, phone, device_id, score, today], function(err) {
            if (err) return res.json({ success: false, message: "لقد شاركت اليوم بالفعل" });
            res.json({ success: true, score: score, total: questions.length });
        });
    });
});

module.exports = router; // تأكد من وجود هذا السطر