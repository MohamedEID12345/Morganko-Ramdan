const express = require('express');
const router = express.Router();
const db = require('../config/db');

const MASTER_CODE = "eid2026"; 

function getCurrentCycleDate() {
    const now = new Date();
    const currentHour = now.getHours();
    let cycleDate = new Date();
    if (currentHour < 20) {
        cycleDate.setDate(now.getDate() - 1);
    }
    return cycleDate.toLocaleDateString('en-CA');
}

/* ===============================
   فتح صفحة المسابقة
=================================*/
router.get('/', (req, res) => {

    const cycleDate = getCurrentCycleDate();

    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {

        if (err || !config)
            return res.render('message', { msg: "يرجى ضبط الإعدادات أولاً" });

        const now = new Date();

        const start = config.quiz_start_time || "20:00";
        const end   = config.quiz_end_time   || "22:00";

        const [startH, startM] = start.split(":").map(Number);
        const [endH, endM]     = end.split(":").map(Number);

        let startDate = new Date();
        startDate.setHours(startH, startM, 0, 0);

        let endDate = new Date();
        endDate.setHours(endH, endM, 0, 0);

        /* ===== قبل وقت البداية ===== */
       if (now < startDate) {
    return res.render('countdown', { 
        targetTime: start 
    });
}

        /* ===== بعد وقت النهاية ===== */
        if (now > endDate) {
            return res.send(`
                <html dir="rtl">
                <head>
                    <style>
                        body{
                            background:#111;
                            color:#fff;
                            text-align:center;
                            font-family:tahoma;
                            padding-top:100px
                        }
                        h2{color:#ff4444}
                    </style>
                </head>
                <body>
                    <h2>انتهى وقت المسابقة اليوم 🌙</h2>
                </body>
                </html>
            `);
        }

        /* ===== داخل الوقت ===== */
        db.all(
            "SELECT * FROM questions WHERE quiz_date = ?",
            [cycleDate],
            (err, questions) => {

                if (!questions || questions.length === 0) {
                    return res.render('message', {
                        msg: `لا توجد أسئلة مضافة لدورة يوم (${cycleDate}).`
                    });
                }

                res.render('quiz', { questions, settings: config });
            }
        );
    });
});


/* ===============================
   فحص الجهاز
=================================*/
router.post('/check-device', (req, res) => {

    const { device_id, master_key } = req.body;
    const cycleDate = getCurrentCycleDate();

    if (master_key === MASTER_CODE)
        return res.json({ allowed: true, isMaster: true });

    db.get(
        "SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?",
        [device_id, cycleDate],
        (err, row) => {

            if (row)
                return res.json({
                    allowed: false,
                    msg: "لقد شاركت في مسابقة هذه الدورة بالفعل!"
                });

            res.json({ allowed: true });
        }
    );
});


/* ===============================
   إرسال الإجابات
=================================*/
router.post('/submit', (req, res) => {

    const { name, age, phone, device_id, answers, master_key } = req.body;
    const cycleDate = getCurrentCycleDate();
    const isMaster = (master_key === MASTER_CODE);

    db.all(
        "SELECT id, correct_answer FROM questions WHERE quiz_date = ?",
        [cycleDate],
        (err, questions) => {

            if (!questions || questions.length === 0)
                return res.json({
                    success: false,
                    message: "لا توجد أسئلة"
                });

            let score = 0;

            questions.forEach(q => {
                if (answers[q.id] == q.correct_answer)
                    score++;
            });

            if (!isMaster) {

                db.run(
                    "INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
                    [name, age, phone, device_id, score, cycleDate],
                    function(err) {

                        if (err)
                            return res.json({
                                success: false,
                                message: "لقد شاركت اليوم بالفعل"
                            });

                        res.json({
                            success: true,
                            score,
                            total: questions.length
                        });
                    }
                );

            } else {

                res.json({
                    success: true,
                    score,
                    total: questions.length,
                    note: "Master Mode"
                });

            }
        }
    );
});

module.exports = router;