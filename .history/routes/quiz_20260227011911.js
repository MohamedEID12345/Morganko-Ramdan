const express = require('express');
const router = express.Router();
const db = require('../config/db');

// صفحة المسابقة
router.get('/', (req, res) => {
  const today = new Date().toLocaleDateString('en-CA');

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

    if (now < startTime) {
      return res.render('coming-soon', { targetTime: config.quiz_start_time });
    }

    if (now > endTime) {
      return res.render('message', { msg: "انتهى وقت المسابقة اليوم" });
    }

    db.all("SELECT * FROM questions WHERE quiz_date = ?", [today], (err2, questions) => {
      if (err2) {
        return res.render('message', { msg: "حدث خطأ في جلب الأسئلة" });
      }

      if (!questions || questions.length === 0) {
        return res.render('message', { msg: "لا توجد أسئلة لهذا اليوم" });
      }

      res.render('quiz', { questions, bg_music: config.bg_music });
    });
  });
});
function getCurrentCycleDate() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // إذا كان الوقت قبل الساعة 8 مساءً (20:00)، نحن نتبع تاريخ "أمس"
    // إذا كان بعد 8 مساءً، نحن في دورة تاريخ "اليوم"
    let cycleDate = new Date();
    if (currentHour < 20) {
        cycleDate.setDate(now.getDate() - 1);
    }
    return cycleDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
}
// فحص الجهاز
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const cycleDate = getCurrentCycleDate();

    // 🏆 الاستثناء الخاص بجهازك (Static Bypass)
    if (device_id === 'FINGERPRINT-123456789' || device_id === 'MASTER-DEVICE-BYPASS') {
        return res.json({ allowed: true });
    }

    // فحص البصمة في قاعدة البيانات لهذه الدورة الزمنية
    db.get(
        "SELECT id FROM participants WHERE (device_id = ?) AND quiz_date = ?",
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

// إرسال الإجابات
router.post('/submit', (req, res) => {
  const { name, age, phone, device_id, answers } = req.body;
  const today = new Date().toLocaleDateString('en-CA');

  db.all("SELECT id, correct_answer FROM questions WHERE quiz_date = ?", [today], (err, questions) => {

    let score = 0;
    if (questions) {
      questions.forEach(q => {
        if (answers[q.id] == q.correct_answer) score++;
      });
    }

    db.run(
      "INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
      [name, age, phone, device_id, score, today],
      function(err) {
        if (err) {
          return res.json({ success: false, message: "لقد شاركت اليوم بالفعل" });
        }

        res.json({ success: true, score, total: questions.length });
      }
    );
  });
});

module.exports = router;