const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

router.get('/', (req, res) => {
    res.render('scratch');
});

router.post('/reveal', (req, res) => {
    const { device_id } = req.body;
    const today = new Date().toISOString().split('T')[0];

    db.get("SELECT id FROM scratch_cards WHERE device_id = ? AND scratch_date = ?", [device_id, today], (err, row) => {
        if (row) return res.json({ status: 'already_played' });

        // Logic: 10% chance to win if winners < max_winners
        db.get("SELECT COUNT(*) as count FROM scratch_cards WHERE is_winner = 1 AND scratch_date = ?", [today], (err, result) => {
            db.get("SELECT max_winners FROM settings", (err, settings) => {
                let isWinner = (result.count < settings.max_winners && Math.random() < 0.1) ? 1 : 0;
                let claimCode = isWinner ? crypto.randomBytes(3).toString('hex').toUpperCase() : null;
                let amount = isWinner ? "قسيمة شراء بقيمة 50 جنيه" : "حظ أوفر غداً";

                db.run("INSERT INTO scratch_cards (amount, is_winner, claim_code, device_id, scratch_date) VALUES (?,?,?,?,?)",
                    [amount, isWinner, claimCode, device_id, today], () => {
                        res.json({ isWinner, amount, claimCode });
                    });
            });
        });
    });
});

module.exports = router;