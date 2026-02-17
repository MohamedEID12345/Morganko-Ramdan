const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/ramadan.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Questions Table
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        opt1 TEXT, opt2 TEXT, opt3 TEXT, opt4 TEXT,
        correct_answer INTEGER,
        quiz_date DATE
    )`);

    // Participants Table
    db.run(`CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, age INTEGER, phone TEXT,
        device_id TEXT, score INTEGER,
        quiz_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Scratch Cards Table
    db.run(`CREATE TABLE IF NOT EXISTS scratch_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount TEXT, is_winner INTEGER,
        is_claimed INTEGER DEFAULT 0,
        claim_code TEXT, device_id TEXT,
        scratch_date DATE
    )`);

    // Settings Table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        quiz_start TIME, quiz_end TIME,
        scratch_start TIME, scratch_end TIME,
        max_winners INTEGER DEFAULT 10
    )`);

    // Insert default settings if not exists
    db.run(`INSERT OR IGNORE INTO settings (id, quiz_start, quiz_end, scratch_start, scratch_end) 
            VALUES (1, '10:00', '23:59', '10:00', '23:59')`);
});

module.exports = db;