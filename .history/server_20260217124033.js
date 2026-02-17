require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');
const scratchRoutes = require('./routes/scratch');

app.use('/admin', adminRoutes);
app.use('/quiz', quizRoutes);
app.use('/scratch', scratchRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
