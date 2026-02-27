const express = require('express');
const router = express.Router();
const db = require('../config/db');

// دالة تحديد تاريخ الدورة (تتغير الساعة 8 مساءً)
function getCurrentCycleDate() {
    const now = new Date();
    const currentHour = now.getHours();
    
    let cycleDate = new Date();
    // إذا كنا قبل الساعة 8 مساءً، نعتبر أنفسنا في دورة "أمس"
    if (currentHour < 20) {
        cycleDate.setDate(now.getDate() - 1);
    }
    return cycleDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
}

// 1️⃣ صفحة الخربشة (التحقق من مواعيد الفتح والإغلاق)
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

// 2️⃣ فحص الجهاز (تعديل: استخدام تاريخ الدورة + استثناء الماستر)
router.post('/check-device', (req, res) => {
    const { device_id } = req.body;
    const cycleDate = getCurrentCycleDate(); // توحيد منطق التاريخ

    // استثناء جهاز المهندس محمد عيد (الماستر)
    if (device_id === 'MASTER-DEVICE-BYPASS' || device_id === 'FINGERPRINT-123456789') {
        return res.json({ allowed: true });
    }

    db.get(
        "SELECT id FROM scratch_logs WHERE device_id = ? AND scratch_date = ?",
        [device_id, cycleDate],
        (err, row) => {
            if (row) {
                return res.json({
                    allowed: false,
                    msg: "لقد خربشت اليوم بالفعل 🎁. تفتح الدورة الجديدة يومياً الساعة 8 مساءً."
                });
            }
            res.json({ allowed: true });
        }
    );
});

// 3️⃣ كشف الكارت (تعديل: التأكد من التصفير اليومي)
router.post('/reveal', (req, res) => {
    const { device_id } = req.body;
    const cycleDate = getCurrentCycleDate();

    // الاستثناء الخاص بجهازك
    const isMaster = (device_id === 'MASTER-DEVICE-BYPASS' || device_id === 'FINGERPRINT-123456789');

    // حساب الترتيب بناءً على تاريخ الدورة لضمان التصفير يومياً الساعة 8 مساءً
    db.get("SELECT COUNT(*) as count FROM scratch_logs WHERE scratch_date = ?", [cycleDate], (err, result) => {
        const count = result?.count || 0;
        const internalOrder = count + 1; // الترتيب الحقيقي للفوز
        
        // رقم الكارت الظاهري للطفل (يبدأ من 1 لكل يوم جديد)
        const displayOrder = 100 + count;

        db.get("SELECT * FROM prize_config WHERE target_index = ? AND prize_date = ?", [internalOrder, cycleDate], (err, prize) => {
            let isWinner = false;
            let claimCode = null;
            let prizeName = "حظ أوفر غداً";

            if (prize) {
                isWinner = true;
                prizeName = prize.prize_name;
                claimCode = "MARJAN-" + Math.floor(1000 + Math.random() * 9000);
            }

            if (!isMaster) {
                // تسجيل المشاركة للجهاز العادي لمنعه من التكرار
                db.run(
                    "INSERT INTO scratch_logs (device_id, scratch_date, claim_code, prize_won) VALUES (?,?,?,?)",
                    [device_id, cycleDate, claimCode, prizeName],
                    (err) => {
                        if (err) return res.json({ status: 'error' });
                        res.json({ isWinner, amount: prizeName, claimCode, order: displayOrder });
                    }
                );
            } else {
                // جهاز الماستر يتخطى التسجيل ليتمكن من التجربة آلاف المرات
                res.json({ isWinner, amount: prizeName, claimCode, order: displayOrder });
            }
        });
    });
});

module.exports = router;