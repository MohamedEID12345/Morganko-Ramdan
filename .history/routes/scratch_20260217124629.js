const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Scratch Page');
});

module.exports = router;
