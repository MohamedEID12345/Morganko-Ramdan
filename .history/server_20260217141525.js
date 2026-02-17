const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// إعدادات المحرك والقوالب
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// الميدل وير
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'ramadan-secret-key',
    resave: false,
    saveUninitialized: true
}));

// استيراد ملفات الروابط (تأكد من صحة المسارات)
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');
const scratchRoutes = require('./routes/scratch');

// تفعيل الروابط
app.use('/admin', adminRoutes);
app.use('/quiz', quizRoutes); // هنا الربط الأساسي
app.use('/scratch', scratchRoutes);

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.render('home');
});

// تشغيل السيرفر
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});