const express = require('express');
const router = express.Router();
const db = require('../config/db');

// هذا المسار سيعمل على http://localhost:3000/quiz
router.get('/', (req, res) => {
  const today = new Date().toLocaleDateString('en-CA');

  db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {

    if (err) {
      console.error("DB error (settings):", err);
      return res.render('message', { msg: "حدث خطأ في قراءة الإعدادات" });
    }

    if (!config) {
      return res.render('message', { msg: "يرجى ضبط الإعدادات أولاً" });
    }

    const now = new Date();
    const [startHour, startMin] = config.quiz_start_time.split(':');
    const [endHour, endMin] = config.quiz_end_time.split(':');
    
    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0);
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0);

    if (now < startTime) {
      return res.render('coming-soon', { targetTime: config.quiz_start_time });
    }
    if (now > endTime) {
      return res.render('message', { msg: "انتهى وقت المسابقة اليوم " });
    }

    db.all("SELECT * FROM questions WHERE quiz_date = ?", [today], (err2, questions) => {

      if (err2) {
        console.error("DB error (questions):", err2);
        return res.render('message', { msg: "حدث خطأ في جلب الأسئلة" });
      }

      if (!questions || questions.length === 0) {
        return res.render('message', { msg: "لا توجد أسئلة لهذا اليوم" });
      }

      res.render('quiz', { questions });
    });
  });
});

// فحص الجهاز (POST /quiz/check-device)
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toLocaleDateString('en-CA');

    // الفحص هنا يتم في جدول participants فقط
    db.get("SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?", [device_id, today], (err, row) => {
        if (row) {
            return res.json({ allowed: false, msg: "لقد شاركت في مسابقة اليوم بالفعل! يمكنك خربشة كارت السعادة إذا لم تقم بذلك بعد 🌙" });
        }
        res.json({ allowed: true });
    });
});
// إرسال الإجابات (POST /quiz/submit)
router.post('/submit', (req, res) => {
    const { name, age, phone, device_id, answers } = req.body;
    const today = new Date().toLocaleDateString('en-CA')

    db.all("SELECT id, correct_answer FROM questions WHERE quiz_date = ?", [today], (err, questions) => {
        let score = 0;
        if (questions) {
            questions.forEach(q => {
                if (answers[q.id] == q.correct_answer) score++;
            });
        }

        db.run("INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
        [name, age, phone, device_id, score, today], function(err) {
            if (err) return res.json({ success: false, message: "لقد شاركت اليوم بالفعل" });
            res.json({ success: true, score: score, total: questions.length });
        });
    });
});

module.exports = router; // تأكد من وجود هذا السطر