const db = require('../config/db');

const Question = {
    getToday: (date, cb) => {
        db.all("SELECT * FROM questions WHERE quiz_date = ?", [date], cb);
    },
    add: (data, cb) => {
        db.run("INSERT INTO questions (question, opt1, opt2, opt3, opt4, correct_answer, quiz_date) VALUES (?,?,?,?,?,?,?)",
        [data.question, data.opt1, data.opt2, data.opt3, data.opt4, data.correct, data.date], cb);
    }
};

module.exports = Question;