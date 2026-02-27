const express = require('express');
const router = express.Router();
const db = require('../config/db');

const MASTER_CODE = "eid2026"; 

function getCurrentCycleDate() {
    const now = new Date();
    const currentHour = now.getHours();
    let cycleDate = new Date();
    if (currentHour < 20) { cycleDate.setDate(now.getDate() - 1); }
    return cycleDate.toLocaleDateString('en-CA');
}

// 🟢 هذا الجزء هو الناقص (لفتح صفحة الخربشة)
router.get('/', (req, res) => {
    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {
        if (err || !config) return res.render('message', { msg: "يرجى ضبط الإعدادات أولاً" });
        
        // عرض الصفحة وإرسال الإعدادات
        res.render('scratch', { settings: config });
    });
});

// مسار فحص الجهاز (POST)
router.post('/check-device', (req, res) => {
    const { device_id, master_key } = req.body;
    const cycleDate = getCurrentCycleDate();
    if (master_key === MASTER_CODE) return res.json({ allowed: true, isMaster: true });

    db.get("SELECT id FROM scratch_logs WHERE device_id = ? AND scratch_date = ?", [device_id, cycleDate], (err, row) => {
        if (row) return res.json({ allowed: false, msg: "لقد خربشت اليوم بالفعل 🎁" });
        res.json({ allowed: true });
    });
});

// مسار كشف الجائزة (POST)
router.post('/reveal', (req, res) => {
    const { device_id, master_key } = req.body;
    const cycleDate = getCurrentCycleDate();
    const isMaster = (master_key === MASTER_CODE);

    db.get("SELECT COUNT(*) as count FROM scratch_logs WHERE scratch_date = ?", [cycleDate], (err, result) => {
        const count = result?.count || 0;
        const internalOrder = count + 1;

        db.get("SELECT * FROM prize_config WHERE target_index = ? AND prize_date = ?", [internalOrder, cycleDate], (err, prize) => {
            let isWinner = false;
            let claimCode = null;
            let prizeName = "حظ أوفر غداً";

            if (prize) {
                isWinner = true;
                prizeName = prize.prize_name;
                claimCode = "MARJAN-" + Math.floor(1000 + Math.random() * 9000);
            }

            if (!isMaster) {
                db.run("INSERT INTO scratch_logs (device_id, scratch_date, claim_code, prize_won) VALUES (?,?,?,?)",
                [device_id, cycleDate, claimCode, prizeName], () => {
                    res.json({ isWinner, amount: prizeName, claimCode, order: internalOrder });
                });
            } else {
                res.json({ isWinner, amount: prizeName, claimCode, order: internalOrder, note: "Master Mode" });
            }
        });
    });
});

module.exports = router;