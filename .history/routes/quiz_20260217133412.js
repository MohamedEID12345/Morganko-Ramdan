const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {
        if (!config) return res.send("يرجى ضبط الإعدادات من لوحة التحكم");

        if (currentTime < config.quiz_start_time) {
            return res.render('coming-soon', { targetTime: config.quiz_start_time });
        }
        if (currentTime > config.quiz_end_time) {
            return res.render('message', { msg: "انتهى وقت المسابقة اليوم!" });
        }

        db.all("SELECT * FROM questions WHERE quiz_date = ?", [today], (err, questions) => {
            res.render('quiz', { questions });
        });
    });
});

router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.run("INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
    [name, age, phone, device_id, 0, today], (err) => {
        res.json({ success: true, score: 0, total: 5 }); // يمكنك تكملة حساب النتيجة هنا
    });
});

module.exports = router;