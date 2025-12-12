import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login user and create session
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Create session
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      teamName: user.teamName,
      role: user.role,
      uploadLimit: user.uploadLimit
    };

    // Save session and return user info
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          teamName: user.teamName,
          role: user.role,
          uploadLimit: user.uploadLimit
        }
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session and logout user
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ message: 'Logout successful' });
    });
  } else {
    res.json({ message: 'No active session' });
  }
});

/**
 * GET /api/auth/me
 * Get current user from session
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({ user: req.session.user });
});

export default router;
