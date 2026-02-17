const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {
        if (currentTime < config.scratch_start_time || currentTime > config.scratch_end_time) {
            return res.render('message', { msg: `نظام الخربشة متاح من ${config.scratch_start_time} حتى ${config.scratch_end_time}` });
        }
        res.render('scratch');
    });
});

// فحص الجهاز للكارت
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // الفحص هنا يتم في جدول scratch_logs فقط
    db.get("SELECT id FROM scratch_logs WHERE device_id = ? AND scratch_date = ?", [device_id, today], (err, row) => {
        if (row) {
            return res.json({ allowed: false, msg: "لقد قمت بخربشة كارت اليوم بالفعل! يمكنك المحاولة مرة أخرى غداً 🎁" });
        }
        res.json({ allowed: true });
    });
});

router.post('/reveal', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // حساب ترتيب هذا الكارت اليوم
    db.get("SELECT COUNT(*) as count FROM scratch_logs WHERE scratch_date = ?", [today], (err, result) => {
        const currentOrder = result.count + 1;

        // التحقق هل هذا الترتيب فائز؟
        db.get("SELECT * FROM prize_config WHERE target_index = ? AND prize_date = ?", [currentOrder, today], (err, prize) => {
            let isWinner = false;
            let claimCode = null;
            let prizeName = "حظ أوفر غداً";

            if (prize) {
                isWinner = true;
                prizeName = prize.prize_name;
                claimCode = "MARJAN-" + Math.floor(1000 + Math.random() * 9000);
            }

            db.run("INSERT INTO scratch_logs (device_id, scratch_date, claim_code, prize_won) VALUES (?,?,?,?)",
                [device_id, today, claimCode, prizeName], () => {
                res.json({ 
                    isWinner, 
                    amount: prizeName, 
                    claimCode, 
                    order: currentOrder // إرسال ترتيب الكارت ليظهر للمستخدم
                });
            });
        });
    });
});

module.exports = router;