const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد database
const dbDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbDir)){
    fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'ramadan.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. جدول الأسئلة
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT, opt1 TEXT, opt2 TEXT, opt3 TEXT, opt4 TEXT,
        correct_answer INTEGER, quiz_date DATE
    )`);

    // 2. جدول المتسابقين
    db.run(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, age INTEGER, phone TEXT,
        device_id TEXT, score INTEGER,
        quiz_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. جدول إعدادات الجوائز
    db.run(`CREATE TABLE IF NOT EXISTS prize_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_index INTEGER, prize_name TEXT, prize_date DATE
    )`);

    // 4. سجل الخربشة
    db.run(`CREATE TABLE IF NOT EXISTS scratch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT, scratch_date DATE, claim_code TEXT, prize_won TEXT
    )`);

    // 5. جدول الإعدادات الشامل (المواعيد + الموسيقى)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        quiz_start_time TEXT, quiz_end_time TEXT,
        scratch_start_time TEXT, scratch_end_time TEXT,
        bg_music TEXT
    )`);

    // إدخال الإعدادات الافتراضية
    db.run(`INSERT OR IGNORE INTO settings (id, quiz_start_time, quiz_end_time, scratch_start_time, scratch_end_time, bg_music) 
            VALUES (1, '10:00', '23:59', '10:00', '23:59', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')`);
});

module.exports = db;