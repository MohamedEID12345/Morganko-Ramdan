const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// تأكد من وجود مجلد database
const dbDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'ramadan.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {

    // 1️⃣ جدول الأسئلة
    db.run(`
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            opt1 TEXT NOT NULL,
            opt2 TEXT NOT NULL,
            opt3 TEXT NOT NULL,
            opt4 TEXT NOT NULL,
            correct_answer INTEGER NOT NULL,
            quiz_date TEXT NOT NULL
        )
    `);

    // 2️⃣ جدول المتسابقين
    db.run(`
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            age INTEGER,
            phone TEXT,
            device_id TEXT NOT NULL,
            score INTEGER,
            quiz_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // منع تكرار نفس الجهاز في نفس اليوم
    db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_participant_per_day
        ON participants(device_id, quiz_date)
    `);

    // 3️⃣ جدول الجوائز
    db.run(`
        CREATE TABLE IF NOT EXISTS prize_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_index INTEGER NOT NULL,
            prize_name TEXT NOT NULL,
            prize_date TEXT NOT NULL
        )
    `);

    // 4️⃣ سجل الخربشة
    db.run(`
        CREATE TABLE IF NOT EXISTS scratch_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            scratch_date TEXT NOT NULL,
            claim_code TEXT,
            prize_won TEXT
        )
    `);

    // منع تكرار الخربشة لنفس الجهاز في نفس اليوم
    db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_scratch_per_day
        ON scratch_logs(device_id, scratch_date)
    `);

    // 5️⃣ جدول الإعدادات
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            quiz_start_time TEXT,
            quiz_end_time TEXT,
            scratch_start_time TEXT,
            scratch_end_time TEXT,
            bg_music TEXT
        )
    `);

    // إدخال إعدادات افتراضية
    db.run(`
        INSERT OR IGNORE INTO settings 
        (id, quiz_start_time, quiz_end_time, scratch_start_time, scratch_end_time, bg_music)
        VALUES 
        (1, '20:00', '23:59', '20:00', '23:59', 
        'https://serv100.albumaty.com/dl/mem/mnw3at/albums/aghany-ramdan/Mohamed_Abdelmetlb_-_Ramdan_Gana.mp3')
    `);

});

module.exports = db;