const db = require('../models/db');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'supersecret';

exports.register = async (req, res) => {
  console.log('=== REGISTER REQUEST ===');
  console.log('Request body:', req.body);
  
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    console.log('Missing fields validation failed');
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'viewer']
    );

    console.log('User registered successfully with ID:', result.insertId);
    res.status(201).json({ 
      message: 'User registered successfully', 
      id: result.insertId 
    });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Request body:', req.body);
  
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Missing credentials');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const [users] = await db.promise().query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', user.email);
    
    // Return token and user info (without password)
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};



