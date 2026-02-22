const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {

    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {

        if (err || !config) {
            return res.render('message', { msg: "يرجى ضبط إعدادات الخربشة أولاً" });
        }

        const now = new Date();

        // Extract start time
        const [startHour, startMin] = config.scratch_start_time.split(':');
        const startTime = new Date();
        startTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

        // Extract end time
        const [endHour, endMin] = config.scratch_end_time.split(':');
        const endTime = new Date();
        endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

        // If current time is before start
        if (now < startTime) {
            return res.render('message', { 
                msg: `نظام الخربشة يبدأ الساعة ${config.scratch_start_time}` 
            });
        }

        // If current time is after end
        if (now > endTime) {
            return res.render('message', { 
                msg: `انتهى وقت الخربشة اليوم 🌙` 
            });
        }

        // If within allowed time
        res.render('scratch');

    });
});


// فحص الجهاز للكارت
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toLocaleDateString('en-CA');

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
   const today = new Date().toLocaleDateString('en-CA');
 // نضمن صيغة YYYY-MM-DD

    // 1. حساب عدد الكروت الممسوحة اليوم فقط للبدء من 1 كل يوم جديد
    db.get("SELECT COUNT(*) as count FROM scratch_logs WHERE scratch_date = ?", [today], (err, result) => {
        if (err) return res.json({ success: false });

        const baseNumber = 100; // الرقم اللي يبدأ منه كل يوم
const currentOrder = baseNumber + (result ? result.count : 0);


        // 2. التحقق هل هذا الترتيب (رقم الكارت اليومي) فائز؟
        db.get("SELECT * FROM prize_config WHERE target_index = ? AND prize_date = ?", [currentOrder, today], (err, prize) => {
            let isWinner = false;
            let claimCode = null;
            let prizeName = "حظ أوفر غداً";

            if (prize) {
                isWinner = true;
                prizeName = prize.prize_name;
                claimCode = "MARJAN-" + Math.floor(1000 + Math.random() * 9000);
            }

            // 3. حفظ البيانات مع رقم الكارت المحسوب لليوم
            db.run("INSERT INTO scratch_logs (device_id, scratch_date, claim_code, prize_won) VALUES (?,?,?,?)",
                [device_id, today, claimCode, prizeName], (err) => {
                res.json({ 
                    isWinner, 
                    amount: prizeName, 
                    claimCode, 
                    order: currentOrder // هذا الرقم سيبدأ من 1 كل يوم جديد
                });
            });
        });
    });
});

module.exports = router;