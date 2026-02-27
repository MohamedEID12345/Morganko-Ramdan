const express = require('express');
const router = express.Router();
const db = require('../config/db');

// دالة توحيد التاريخ البرمجي للمسابقة (تتغير الساعة 8 مساءً)
function getCurrentCycleDate() {
    const now = new Date();
    const currentHour = now.getHours();
    let cycleDate = new Date();
    if (currentHour < 20) {
        cycleDate.setDate(now.getDate() - 1);
    }
    return cycleDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

// 1️⃣ صفحة المسابقة
router.get('/', (req, res) => {
    const cycleDate = getCurrentCycleDate(); // استخدام تاريخ الدورة لتمكين جلب أسئلة اليوم الصحيح

    db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {
        if (err || !config) {
            return res.render('message', { msg: "يرجى ضبط الإعدادات أولاً" });
        }

        const now = new Date();
        const [startHour, startMin] = config.quiz_start_time.split(':');
        const [endHour, endMin] = config.quiz_end_time.split(':');

        const startTime = new Date();
        startTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

        const endTime = new Date();
        endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

        // التحقق من الوقت الحالي
        if (now < startTime) {
            return res.render('coming-soon', { targetTime: config.quiz_start_time });
        }
        if (now > endTime) {
            return res.render('message', { msg: "عفواً، انتهى وقت المسابقة اليوم 🌙" });
        }

        // جلب الأسئلة بناءً على تاريخ الدورة (الذي يبدأ 8 مساءً)
        db.all("SELECT * FROM questions WHERE quiz_date = ?", [cycleDate], (err2, questions) => {
            if (err2 || !questions || questions.length === 0) {
                return res.render('message', { msg: "لا توجد أسئلة مضافة لهذه الدورة، يرجى مراجعة الإدارة." });
            }
            res.render('quiz', { questions, bg_music: config.bg_music });
        });
    });
});

// 2️⃣ فحص الجهاز (بالبصمة وتاريخ الدورة)
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const cycleDate = getCurrentCycleDate();

    // 🏆 استثناء جهاز الماستر (المهندس محمد عيد)
    if (device_id === 'MASTER-DEVICE-BYPASS' || device_id === 'FINGERPRINT-123456789') {
        return res.json({ allowed: true });
    }

    db.get(
        "SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?",
        [device_id, cycleDate],
        (err, row) => {
            if (row) {
                return res.json({
                    allowed: false,
                    msg: "لقد شاركت في مسابقة هذه الدورة بالفعل! تبدأ الدورة الجديدة يومياً الساعة 8 مساءً 🌙"
                });
            }
            res.json({ allowed: true });
        }
    );
});

// 3️⃣ إرسال الإجابات وحفظ النتيجة
router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers } = req.body;
    const cycleDate = getCurrentCycleDate();
    const isMaster = (device_id === 'MASTER-DEVICE-BYPASS' || device_id === 'FINGERPRINT-123456789');

    db.all("SELECT id, correct_answer FROM questions WHERE quiz_date = ?", [cycleDate], (err, questions) => {
        if (!questions) return res.json({ success: false, message: "حدث خطأ في البيانات" });

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] == q.correct_answer) score++;
        });

        if (!isMaster) {
            // حفظ النتيجة للمتسابق العادي
            db.run(
                "INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
                [name, age, phone, device_id, score, cycleDate],
                function(err) {
                    if (err) return res.json({ success: false, message: "لقد شاركت اليوم بالفعل" });
                    res.json({ success: true, score, total: questions.length });
                }
            );
        } else {
            // جهاز الماستر: يرى النتيجة ولا يتم تقييده في قاعدة البيانات للتجربة المتكررة
            res.json({ success: true, score, total: questions.length, note: "Master Mode Active" });
        }
    });
});

module.exports = router;