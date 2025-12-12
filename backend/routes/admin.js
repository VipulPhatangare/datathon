import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import User from '../models/User.js';
import Config from '../models/Config.js';
import AnswerCSV from '../models/AnswerCSV.js';
import Submission from '../models/Submission.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Apply admin middleware to all routes
router.use(requireAdmin);

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
router.post('/users', async (req, res) => {
  try {
    const { email, password, teamName, role, uploadLimit } = req.body;

    // Validate required fields
    if (!email || !password || !teamName) {
      return res.status(400).json({ 
        error: 'Email, password, and team name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      passwordHash,
      teamName,
      role: role || 'user',
      uploadLimit: uploadLimit || null
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        teamName: newUser.teamName,
        role: newUser.role,
        uploadLimit: newUser.uploadLimit,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * GET /api/admin/users
 * Get all users with their submission stats
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').lean();

    // Get submission stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const submissionCount = await Submission.countDocuments({ userId: user._id });
      const bestSubmission = await Submission.findOne({ userId: user._id })
        .sort({ accuracy: -1, f1: -1 })
        .lean();

      return {
        ...user,
        submissionCount,
        bestAccuracy: bestSubmission ? bestSubmission.accuracy : null,
        bestF1: bestSubmission ? bestSubmission.f1 : null
      };
    }));

    res.json({ users: usersWithStats });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, teamName, role, uploadLimit } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (email) user.email = email.toLowerCase();
    if (teamName) user.teamName = teamName;
    if (role) user.role = role;
    if (uploadLimit !== undefined) user.uploadLimit = uploadLimit;

    // Update password if provided
    if (password) {
      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        teamName: user.teamName,
        role: user.role,
        uploadLimit: user.uploadLimit
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.session.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all user's submissions to keep data consistent
    await Submission.deleteMany({ userId: id });

    res.json({ message: 'User and all their submissions deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * POST /api/admin/answer-csv
 * Upload canonical answer CSV
 */
router.post('/answer-csv', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read and parse CSV file
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'CSV parsing error',
        details: parseResult.errors 
      });
    }

    // Validate required columns
    const columns = parseResult.meta.fields;
    if (!columns.includes('row_id') || !columns.includes('label')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'CSV must contain "row_id" and "label" columns' 
      });
    }

    // Extract data
    const data = parseResult.data.map(row => ({
      row_id: String(row.row_id).trim(),
      label: String(row.label).trim()
    }));

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Delete existing answer CSV
    await AnswerCSV.deleteMany({});

    // Save new answer CSV
    const answerCSV = new AnswerCSV({
      filename: req.file.originalname,
      uploadedBy: req.session.user.id,
      data,
      columns
    });

    await answerCSV.save();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Answer CSV uploaded successfully',
      rowCount: data.length,
      columns
    });

  } catch (error) {
    console.error('Upload answer CSV error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload answer CSV' });
  }
});

/**
 * GET /api/admin/answer-csv
 * Get current answer CSV info
 */
router.get('/answer-csv', async (req, res) => {
  try {
    const answerCSV = await AnswerCSV.findOne()
      .populate('uploadedBy', 'email teamName')
      .lean();

    if (!answerCSV) {
      return res.json({ answerCSV: null });
    }

    res.json({
      answerCSV: {
        filename: answerCSV.filename,
        uploadedBy: answerCSV.uploadedBy,
        uploadedAt: answerCSV.uploadedAt,
        rowCount: answerCSV.data.length,
        columns: answerCSV.columns
      }
    });

  } catch (error) {
    console.error('Get answer CSV error:', error);
    res.status(500).json({ error: 'Failed to fetch answer CSV info' });
  }
});

/**
 * PUT /api/admin/config
 * Update global configuration (e.g., default upload limit)
 */
router.put('/config', async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ 
        error: 'Key and value are required' 
      });
    }

    // Validate allowed config keys
    const allowedKeys = ['defaultUploadLimit'];
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ 
        error: `Invalid config key. Allowed keys: ${allowedKeys.join(', ')}` 
      });
    }

    // Update or create config
    let config = await Config.findOne({ key });
    
    if (config) {
      config.value = value;
      config.updatedAt = Date.now();
      await config.save();
    } else {
      config = new Config({ key, value });
      await config.save();
    }

    res.json({
      message: 'Configuration updated successfully',
      config: {
        key: config.key,
        value: config.value
      }
    });

  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * GET /api/admin/config/:key
 * Get a specific configuration value
 */
router.get('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const config = await Config.findOne({ key });

    if (!config) {
      // Return default values for known keys
      if (key === 'defaultUploadLimit') {
        return res.json({ key, value: 15, isDefault: true });
      }
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json({
      key: config.key,
      value: config.value,
      isDefault: false
    });

  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

/**
 * GET /api/admin/submissions
 * Get all submissions (admin view)
 */
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('userId', 'email teamName')
      .sort({ uploadedAt: -1 })
      .limit(100)
      .lean();

    res.json({ submissions });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

export default router;
