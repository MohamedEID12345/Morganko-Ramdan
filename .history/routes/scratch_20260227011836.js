const express = require('express');
const router = express.Router();
const db = require('../config/db');

// صفحة الخربشة
router.get('/', (req, res) => {

  db.get("SELECT * FROM settings WHERE id = 1", (err, config) => {

    if (err || !config) {
      return res.render('message', { msg: "يرجى ضبط إعدادات الخربشة أولاً" });
    }

    const now = new Date();

    const [startHour, startMin] = config.scratch_start_time.split(':');
    const [endHour, endMin] = config.scratch_end_time.split(':');

    const startTime = new Date();
    startTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

    const endTime = new Date();
    endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

    if (now < startTime) {
      return res.render('message', {
        msg: `الخربشة تبدأ الساعة ${config.scratch_start_time}`
      });
    }

    if (now > endTime) {
      return res.render('message', {
        msg: `انتهى وقت الخربشة اليوم 🌙`
      });
    }

    res.render('scratch', { bg_music: config.bg_music });
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
  const today = new Date().toLocaleDateString('en-CA');

  db.get(
    "SELECT id FROM scratch_logs WHERE device_id = ? AND scratch_date = ?",
    [device_id, today],
    (err, row) => {
      if (row) {
        return res.json({
          allowed: false,
          msg: "لقد خربشت اليوم بالفعل 🎁"
        });
      }
      res.json({ allowed: true });
    }
  );
});

// كشف الكارت
router.post('/reveal', (req, res) => {
  const { device_id } = req.body;
  const today = new Date().toLocaleDateString('en-CA');

  db.get(
    "SELECT COUNT(*) as count FROM scratch_logs WHERE scratch_date = ?",
    [today],
    (err, result) => {

      const count = result?.count || 0;
      const internalOrder = count + 1;
      const displayOrder = 100 + count;

      db.get(
        "SELECT * FROM prize_config WHERE target_index = ? AND prize_date = ?",
        [internalOrder, today],
        (err, prize) => {

          let isWinner = false;
          let claimCode = null;
          let prizeName = "حظ أوفر غداً";

          if (prize) {
            isWinner = true;
            prizeName = prize.prize_name;
            claimCode = "MARJAN-" + Math.floor(1000 + Math.random() * 9000);
          }

          db.run(
            "INSERT INTO scratch_logs (device_id, scratch_date, claim_code, prize_won) VALUES (?,?,?,?)",
            [device_id, today, claimCode, prizeName],
            () => {
              res.json({
                isWinner,
                amount: prizeName,
                claimCode,
                order: displayOrder
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;