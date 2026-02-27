const express = require('express');
const router = express.Router();
const db = require('../config/db');

const auth = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/admin/login');
};

router.get('/login', (req, res) => res.render('admin-login'));

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if(username === 'admin' && password === '123456') {
        req.session.isAdmin = true;
        return res.redirect('/admin/dashboard');
    }
    res.send('خطأ في البيانات');
});

// دالة توحيد التاريخ البرمجي (نفس الموجودة في الكويز)
function getCurrentCycleDate() {
    const now = new Date();
    const currentHour = now.getHours();
    let cycleDate = new Date();
    if (currentHour < 20) {
        cycleDate.setDate(now.getDate() - 1);
    }
    return cycleDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

router.get('/dashboard', auth, (req, res) => {
    const cycleDate = getCurrentCycleDate(); // نستخدم تاريخ الدورة الحالية
    
    // 1. جلب المتسابقين في الدورة الحالية
    db.all("SELECT * FROM participants WHERE quiz_date = ?", [cycleDate], (err, participants) => {
        // 2. جلب الأسئلة المضافة لهذه الدورة
        db.all("SELECT * FROM questions WHERE quiz_date = ?", [cycleDate], (err, questions) => {
            // 3. جلب الفائزين في الدورة الحالية
            db.get("SELECT COUNT(*) as count FROM scratch_logs WHERE prize_won != 'حظ أوفر غداً' AND scratch_date = ?", [cycleDate], (err, stats) => {
                // 4. جلب الإعدادات (الموسيقى والمواعيد) لعرضها في الفورم
                db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {
                    
                    const totalWinners = (stats && stats.count) ? stats.count : 0;

                    res.render('admin-dashboard', { 
                        participants: participants || [], 
                        questions: questions || [], 
                        winCount: totalWinners,
                        settings: settings || {}, // تأكد من إرسال هذا المتغير
                        currentCycle: cycleDate // لإظهار التاريخ الذي تراه الآن
                    });
                });
            });
        });
    });
});

// إضافة سؤال
router.post('/add-question', auth, (req, res) => {
    const { question, opt1, opt2, opt3, opt4, correct, date } = req.body;
    db.run("INSERT INTO questions (question, opt1, opt2, opt3, opt4, correct_answer, quiz_date) VALUES (?,?,?,?,?,?,?)",
    [question, opt1, opt2, opt3, opt4, correct, date], () => res.redirect('/admin/dashboard'));
});

// تحديث الإعدادات
router.post('/update-settings', auth, (req, res) => {
    const { q_start, q_end, s_start, s_end, bg_music } = req.body;
    db.run(`UPDATE settings SET 
            quiz_start_time = ?, quiz_end_time = ?, 
            scratch_start_time = ?, scratch_end_time = ?,
            bg_music = ? 
            WHERE id = 1`, 
            [q_start, q_end, s_start, s_end, bg_music], () => {
        res.redirect('/admin/dashboard');
    });
});

// إضافة جائزة
router.post('/add-prize', auth, (req, res) => {
    const { index, prize, date } = req.body;
    db.run("INSERT INTO prize_config (target_index, prize_name, prize_date) VALUES (?,?,?)", 
    [index, prize, date], () => res.redirect('/admin/dashboard'));
});

// تصدير النتائج CSV
router.get('/export', auth, (req, res) => {
    db.all("SELECT * FROM participants ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).send("خطأ في جلب البيانات");

        // إضافة BOM لدعم اللغة العربية في Excel
        let csv = "\uFEFF"; 
        csv += "الاسم,العمر,الموبايل,النتيجة,التاريخ\n";
        
        rows.forEach(r => {
            csv += `${r.name},${r.age},${r.phone},${r.score},${r.quiz_date}\n`;
        });

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment('results_ramadan.csv');
        res.send(csv);
    });
});
module.exports = router;