const express = require('express');
const path = require('path');
const session = require('express-session');
const db = require('./config/db'); // تأكد أن المسار صحيح هنا

const app = express();

// إعدادات المحرك
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// الميدل وير
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'ramadan-morgan-2024',
    resave: false,
    saveUninitialized: true
}));

// جعل الإعدادات (مثل رابط الموسيقى) متاحة في كل صفحات الـ EJS
app.use((req, res, next) => {
    db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {
        res.locals.settings = settings || {};
        next();
    });
});

// استيراد الروابط
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');
const scratchRoutes = require('./routes/scratch');

// تفعيل الروابط
app.use('/admin', adminRoutes);
app.use('/quiz', quizRoutes);
app.use('/scratch', scratchRoutes);

// الصفحة الرئيسية

app.get('/', (req, res) => {
    res.render('home');
});

// قائمة الأوائل
app.get('/leaderboard', (req, res) => {
    db.all("SELECT name, score FROM participants ORDER BY score DESC, created_at ASC LIMIT 10", (err, topScorers) => {
        res.render('leaderboard', { topScorers: topScorers || [] });
    });
});

const PORT = process.env.PORT || 3000; // استخدم البورت الديناميكي أولاً
app.listen(PORT, () => {
    console.log(`✅ السيرفر يعمل الآن على: http://localhost:${PORT}`);
});
