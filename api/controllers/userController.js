const db = require('../models/db');

const bcrypt = require('bcryptjs');

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const [results] = await db.promise().query('SELECT id, name, email FROM users');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE new user
exports.addUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE user
exports.updateUser = async (req, res) => {
  const { name, email } = req.body;
  try {
    await db.promise().query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, req.params.id]
    );
    res.json({ id: req.params.id, name, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    await db.promise().query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

