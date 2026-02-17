const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'ramadan-mubarak-2024',
    resave: false,
    saveUninitialized: true
}));

// Routes
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');
const scratchRoutes = require('./routes/scratch');

app.use('/admin', adminRoutes);
app.use('/quiz', quizRoutes);
app.use('/scratch', scratchRoutes);

app.get('/', (req, res) => {
    res.render('home', { title: 'الرئيسية' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

