const express = require('express');
const router = express.Router();
const db = require('../config/db');

// عرض صفحة الخربشة
router.get('/', (req, res) => {
    res.render('scratch');
});

// منطق التحقق من الجهاز
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.get("SELECT id FROM scratch_logs WHERE device_id = ? AND scratch_date = ?", [device_id, today], (err, row) => {
        if (row) {
            return res.json({ allowed: false, msg: "لقد قمت بالخربشة اليوم بالفعل! ننتظرك غداً 🌙" });
        }
        res.json({ allowed: true });
    });
});

// منطق كشف الجائزة
router.post('/reveal', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.get("SELECT id FROM scratch_logs WHERE device_id = ? AND scratch_date = ?", [device_id, today], (err, used) => {
        if (used) return res.json({ status: 'used', msg: 'لقد شاركت اليوم بالفعل!' });

        db.run("INSERT INTO scratch_logs (device_id, scratch_date) VALUES (?,?)", [device_id, today], function(err) {
            const userIndex = this.lastID; 

            db.get("SELECT * FROM prize_config WHERE target_index = ? AND prize_date = ?", [userIndex, today], (err, prize) => {
                if (prize) {
                    const claimCode = "MARJAN-" + Math.random().toString(36).substring(7).toUpperCase();
                    res.json({ 
                        isWinner: true, 
                        msg: `مبروك! كسبت ${prize.prize_name}`, 
                        code: claimCode,
                        index: userIndex 
                    });
                } else {
                    res.json({ isWinner: false, msg: 'حظ أوفر غداً مع هايبر مرجانكوا', index: userIndex });
                }
            });
        });
    });
});

module.exports = router;