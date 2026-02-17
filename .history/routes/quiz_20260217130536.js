const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Participant = require('../models/Participant');

router.get('/', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    Question.getToday(today, (err, questions) => {
        if (!questions || questions.length === 0) {
            return res.render('message', { msg: "لا توجد أسئلة مضافة اليوم، انتظرنا غداً!" });
        }
        res.render('quiz', { questions });
    });
});

router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers } = req.body;
    const today = new Date().toISOString().split('T')[0];

    Participant.checkParticipation(device_id, today, (err, row) => {
        if (row) return res.json({ success: false, message: "عفواً، شاركت اليوم بالفعل!" });

        Question.getToday(today, (err, questions) => {
            let score = 0;
            questions.forEach(q => {
                if (answers[q.id] == q.correct_answer) score++;
            });

            Participant.save({ name, age, phone, device_id, score, date: today }, () => {
                res.json({ success: true, score, total: questions.length });
            });
        });
    });
});

module.exports = router;