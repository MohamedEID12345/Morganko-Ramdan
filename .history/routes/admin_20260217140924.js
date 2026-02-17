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

router.get('/dashboard', auth, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    db.all("SELECT * FROM participants WHERE quiz_date = ?", [today], (err, participants) => {
        db.all("SELECT * FROM questions WHERE quiz_date = ?", [today], (err, questions) => {
            // نعد الفائزين من جدول scratch_logs حيث الجائزة ليست "حظ أوفر"
            db.get("SELECT COUNT(*) as count FROM scratch_logs WHERE prize_won != 'حظ أوفر غداً' AND scratch_date = ?", [today], (err, stats) => {
                
                // حل مشكلة undefined: نضع قيمة افتراضية 0 إذا لم يوجد بيانات
                const totalWinners = (stats && stats.count) ? stats.count : 0;

                res.render('admin-dashboard', { 
                    participants: participants || [], 
                    questions: questions || [], 
                    winCount: totalWinners 
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
    const { q_start, q_end, s_start, s_end } = req.body;
    db.run(`UPDATE settings SET quiz_start_time = ?, quiz_end_time = ?, scratch_start_time = ?, scratch_end_time = ? WHERE id = 1`,
    [q_start, q_end, s_start, s_end], () => res.redirect('/admin/dashboard'));
});

// إضافة جائزة
router.post('/add-prize', auth, (req, res) => {
    const { index, prize, date } = req.body;
    db.run("INSERT INTO prize_config (target_index, prize_name, prize_date) VALUES (?,?,?)", 
    [index, prize, date], () => res.redirect('/admin/dashboard'));
});

module.exports = router;