const express = require('express');
const router = express.Router();
const db = require('../config/db');

// فحص الجهاز قبل الدخول
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    db.get("SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?", [device_id, today], (err, row) => {
        if (row) return res.json({ allowed: false, msg: "لقد شاركت في مسابقة اليوم بالفعل! حاول غداً 🌙" });
        res.json({ allowed: true });
    });
});

// تسليم المسابقة وحساب النتيجة
router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // جلب الأسئلة الصحيحة من قاعدة البيانات للمقارنة
    db.all("SELECT id, correct_answer FROM questions WHERE quiz_date = ?", [today], (err, rows) => {
        if (err || !rows.length) return res.json({ success: false, message: "خطأ في جلب الأسئلة" });

        let score = 0;
        rows.forEach(q => {
            if (answers[q.id] == q.correct_answer) score++;
        });

        // حفظ النتيجة المحسوبة وليس 0
        db.run("INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
        [name, age, phone, device_id, score, today], (err) => {
            if (err) return res.json({ success: false, message: "لقد شاركت اليوم بالفعل" });
            res.json({ success: true, score: score, total: rows.length });
        });
    });
});

module.exports = router;