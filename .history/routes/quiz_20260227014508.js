const express = require('express');
const router = express.Router();
const db = require('../config/db');

const MASTER_CODE = "EID2026"; // الكود السري الخاص بك

function getCurrentCycleDate() {
    const now = new Date();
    const currentHour = now.getHours();
    let cycleDate = new Date();
    if (currentHour < 20) { cycleDate.setDate(now.getDate() - 1); }
    return cycleDate.toLocaleDateString('en-CA');
}

// 2️⃣ فحص الجهاز 
router.post('/check-device', (req, res) => {
    const { device_id, master_key } = req.body; // استلام الكود من الفرونت إند
    const cycleDate = getCurrentCycleDate();

    // استثناء باستخدام كود الماستر
    if (master_key === MASTER_CODE) {
        return res.json({ allowed: true, isMaster: true });
    }

    db.get(
        "SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?",
        [device_id, cycleDate],
        (err, row) => {
            if (row) {
                return res.json({
                    allowed: false,
                    msg: "نعتذر منك! مسموح بمشاركة واحدة فقط لكل جهاز يومياً. تبدأ الدورة الجديدة يومياً الساعة 8 مساءً 🌙"
                });
            }
            res.json({ allowed: true });
        }
    );
});

// 3️⃣ إرسال الإجابات
router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers, master_key } = req.body;
    const cycleDate = getCurrentCycleDate();
    const isMaster = (master_key === MASTER_CODE);

    db.all("SELECT id, correct_answer FROM questions WHERE quiz_date = ?", [cycleDate], (err, questions) => {
        if (!questions || questions.length === 0) return res.json({ success: false, message: "لا توجد أسئلة" });

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] == q.correct_answer) score++;
        });

        if (!isMaster) {
            db.run(
                "INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
                [name, age, phone, device_id, score, cycleDate],
                function(err) {
                    if (err) return res.json({ success: false, message: "لقد شاركت اليوم بالفعل" });
                    res.json({ success: true, score, total: questions.length });
                }
            );
        } else {
            // نمط الماستر: يظهر النتيجة فقط
            res.json({ success: true, score, total: questions.length, note: "Master Mode" });
        }
    });
});

module.exports = router;