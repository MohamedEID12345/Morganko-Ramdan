const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/ramadan.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT, opt1 TEXT, opt2 TEXT, opt3 TEXT, opt4 TEXT,
        correct_answer INTEGER, quiz_date DATE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, age INTEGER, phone TEXT,
        device_id TEXT, score INTEGER,
        quiz_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS prize_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_index INTEGER, prize_name TEXT, prize_date DATE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scratch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT, scratch_date DATE, claim_code TEXT, prize_won TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        quiz_start_time TEXT, quiz_end_time TEXT,
        scratch_start_time TEXT, scratch_end_time TEXT
    )`);
// ابحث عن جدول settings وحدثه ليصبح هكذا:
db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    quiz_start_time TEXT, quiz_end_time TEXT,
    scratch_start_time TEXT, scratch_end_time TEXT,
    bg_music TEXT -- إضافة هذا العمود
)`);
    // تصحيح: أسماء الأعمدة هنا يجب أن تطابق تماماً ما في الأعلى
    db.run(`INSERT OR IGNORE INTO settings (id, quiz_start_time, quiz_end_time, scratch_start_time, scratch_end_time) 
            VALUES (1, '10:00', '23:59', '10:00', '23:59')`);
});

module.exports = db;