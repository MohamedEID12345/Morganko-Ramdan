const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/update-settings', (req, res) => {
    const { start, end } = req.body;
    db.run("UPDATE settings SET quiz_start_time = ?, quiz_end_time = ? WHERE id = 1", [start, end], () => {
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

// ... باقي كود الـ login والـ dashboard من الإجابات السابقة
module.exports = router;