router.post('/reveal', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // 1. منع التكرار اليومي
    db.get("SELECT id FROM scratch_logs WHERE device_id = ? AND scratch_date = ?", [device_id, today], (err, used) => {
        if (used) return res.json({ status: 'used', msg: 'لقد قمت بالخربشة اليوم بالفعل!' });

        // 2. تسجيل العملية وحساب الترتيب
        db.run("INSERT INTO scratch_logs (device_id, scratch_date) VALUES (?,?)", [device_id, today], function(err) {
            const userIndex = this.lastID; // هذا ترتيبه الفعلي اليوم

            // 3. هل هذا الترتيب فائز؟
            db.get("SELECT * FROM prize_config WHERE target_index = ? AND prize_date = ?", [userIndex, today], (err, prize) => {
                if (prize) {
                    const claimCode = "MARJAN-" + Math.random().toString(36).substring(7).toUpperCase();
                    res.json({ 
                        isWinner: true, 
                        msg: `مبروك! كسبت ${prize.prize_name}`, 
                        code: claimCode,
                        index: userIndex 
                    });
                } else {
                    res.json({ isWinner: false, msg: 'حظ أوفر غداً مع هايبر مرجانكوا', index: userIndex });
                }
            });
        });
    });
});