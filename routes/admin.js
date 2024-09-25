const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ADMIN_PASSWORD = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res) => {
  const { password } = req.body;

  const isPasswordCorrect = await bcrypt.compare(password, ADMIN_PASSWORD);

  if (!isPasswordCorrect) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const token = jwt.sign({}, JWT_SECRET, { expiresIn: '24h' });

  res.json({ token });
});

module.exports = router;