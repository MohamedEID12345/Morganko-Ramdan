const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {
        // 1. فحص الوقت
        if (currentTime < config.quiz_start_time) {
            return res.render('coming-soon', { 
                targetTime: config.quiz_start_time,
                msg: "المسابقة لم تبدأ بعد، انتظرنا في تمام الساعة" 
            });
        }
        if (currentTime > config.quiz_end_time) {
            return res.render('message', { msg: "عفواً، انتهى وقت مسابقة اليوم. ننتظرك غداً!" });
        }

        res.render('quiz_intro', { config });
    });
});

// فحص الجهاز قبل بدء الأسئلة (AJAX)
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.get("SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?", [device_id, today], (err, row) => {
        if (row) {
            return res.json({ allowed: false, msg: "لقد شاركت اليوم بالفعل من هذا الجهاز! حاول مرة أخرى غداً 🌙" });
        }
        res.json({ allowed: true });
    });
});