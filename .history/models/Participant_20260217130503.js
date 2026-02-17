const db = require('../config/db');

const Participant = {
    checkParticipation: (deviceId, date, cb) => {
        db.get("SELECT id FROM participants WHERE device_id = ? AND quiz_date = ?", [deviceId, date], cb);
    },
    save: (data, cb) => {
        db.run("INSERT INTO participants (name, age, phone, device_id, score, quiz_date) VALUES (?,?,?,?,?,?)",
        [data.name, data.age, data.phone, data.device_id, data.score, data.date], cb);
    },
    getTopFive: (cb) => {
        db.all("SELECT name, score FROM participants ORDER BY score DESC, created_at ASC LIMIT 5", cb);
    }
};

module.exports = Participant;