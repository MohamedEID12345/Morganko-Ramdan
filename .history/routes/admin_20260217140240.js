const express = require('express');
const router = express.Router();
const db = require('../config/db');

// تحديث الإعدادات في لوحة التحكم
router.post('/update-settings', (req, res) => {
    // تأكد أن هذه الأسماء (q_start, etc) هي نفسها الموجودة في ملف الـ EJS
    const { q_start, q_end, s_start, s_end } = req.body;
    
    const query = `UPDATE settings SET 
        quiz_start_time = ?, 
        quiz_end_time = ?, 
        scratch_start_time = ?, 
        scratch_end_time = ? 
        WHERE id = 1`;

    db.run(query, [q_start, q_end, s_start, s_end], (err) => {
        if (err) console.error(err);
        res.redirect('/admin/dashboard');
    });
});

router.post('/add-prize', (req, res) => {
    const { index, prize, date } = req.body;
    db.run("INSERT INTO prize_config (target_index, prize_name, prize_date) VALUES (?,?,?)", 
    [index, prize, date], () => {
        res.redirect('/admin/dashboard');
    });
});
// Middleware للحماية البسيطة
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

router.get('/dashboard', auth, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    db.all("SELECT * FROM participants WHERE quiz_date = ?", [today], (err, participants) => {
        db.all("SELECT * FROM questions WHERE quiz_date = ?", [today], (err, questions) => {
            db.get("SELECT COUNT(*) as winCount FROM scratch_cards WHERE is_winner = 1 AND scratch_date = ?", [today], (err, stats) => {
                res.render('admin-dashboard', { participants, questions, winCount: stats.winCount });
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

// تصدير النتائج CSV
router.get('/export', auth, (req, res) => {
    db.all("SELECT * FROM participants", (err, rows) => {
        let csv = "الاسم,العمر,الموبايل,النتيجة,التاريخ\n";
        rows.forEach(r => {
            csv += `${r.name},${r.age},${r.phone},${r.score},${r.quiz_date}\n`;
        });
        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment('results.csv');
        res.send(Buffer.from('\uFEFF' + csv)); // UTF-8 BOM لضمان اللغة العربية في Excel
    });
});
router.post('/update-settings', (req, res) => {
    const { q_start, q_end, s_start, s_end } = req.body;
    db.run(`UPDATE settings SET 
            quiz_start_time = ?, quiz_end_time = ?, 
            scratch_start_time = ?, scratch_end_time = ? 
            WHERE id = 1`, [q_start, q_end, s_start, s_end], () => {
        res.redirect('/admin/dashboard');
    });
});
module.exports = router;