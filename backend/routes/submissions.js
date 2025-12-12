import express from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import fs from 'fs';
import Submission from '../models/Submission.js';
import AnswerCSV from '../models/AnswerCSV.js';
import Config from '../models/Config.js';
import { requireAuth } from '../middleware/auth.js';
import { compareCSVData } from '../utils/metrics.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * POST /api/submissions/upload
 * Upload and evaluate a CSV submission
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.session.user.id;

    // 1. Check if answer CSV exists
    const answerCSV = await AnswerCSV.findOne();
    if (!answerCSV) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'No canonical answer CSV has been uploaded yet. Please contact admin.' 
      });
    }

    // 2. Check submission limit
    const userSubmissionCount = await Submission.countDocuments({ userId });
    
    // Get user's upload limit (user-specific or global default)
    let uploadLimit = req.user.uploadLimit;
    if (uploadLimit === null || uploadLimit === undefined) {
      const config = await Config.findOne({ key: 'defaultUploadLimit' });
      uploadLimit = config ? config.value : 15; // Default to 15
    }

    if (userSubmissionCount >= uploadLimit) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ 
        error: `Upload limit reached. You have used ${userSubmissionCount} of ${uploadLimit} allowed submissions.` 
      });
    }

    // 3. Parse uploaded CSV
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'CSV parsing error',
        details: parseResult.errors 
      });
    }

    // 4. Validate required columns
    const columns = parseResult.meta.fields;
    if (!columns.includes('row_id') || !columns.includes('label')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'CSV must contain "row_id" and "label" columns',
        foundColumns: columns
      });
    }

    // 5. Extract data
    const userCSVData = parseResult.data.map(row => ({
      row_id: String(row.row_id).trim(),
      label: String(row.label).trim()
    }));

    if (userCSVData.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // 6. Compare with canonical answer and compute metrics
    const comparisonResult = compareCSVData(userCSVData, answerCSV.data);

    // 7. Determine attempt number
    const attemptNumber = userSubmissionCount + 1;

    // 8. Create preview (first 20 rows with mismatches prioritized)
    const mismatches = comparisonResult.comparisons.filter(c => !c.match);
    const matches = comparisonResult.comparisons.filter(c => c.match);
    const preview = [
      ...mismatches.slice(0, 15),
      ...matches.slice(0, 5)
    ].slice(0, 20);

    // 9. Save submission
    const submission = new Submission({
      userId,
      filename: req.file.originalname,
      rowsTotal: comparisonResult.rowsCompared,
      matches: comparisonResult.metrics.matches,
      accuracy: comparisonResult.metrics.accuracy,
      precision: comparisonResult.metrics.precision,
      recall: comparisonResult.metrics.recall,
      f1: comparisonResult.metrics.f1,
      fileDataPreview: preview,
      attemptNumber,
      rowsInCanonical: comparisonResult.rowsInCanonical,
      rowsInSubmission: comparisonResult.rowsInSubmission,
      rowsCompared: comparisonResult.rowsCompared,
      extraRows: comparisonResult.extraRows,
      missingRows: comparisonResult.missingRows
    });

    await submission.save();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // 10. Return results
    res.json({
      message: 'Submission processed successfully',
      submission: {
        id: submission._id,
        filename: submission.filename,
        attemptNumber: submission.attemptNumber,
        uploadedAt: submission.uploadedAt,
        metrics: {
          accuracy: submission.accuracy,
          precision: submission.precision,
          recall: submission.recall,
          f1: submission.f1
        },
        summary: {
          rowsInCanonical: comparisonResult.rowsInCanonical,
          rowsInSubmission: comparisonResult.rowsInSubmission,
          rowsCompared: comparisonResult.rowsCompared,
          matches: comparisonResult.metrics.matches,
          mismatches: comparisonResult.rowsCompared - comparisonResult.metrics.matches,
          missingRows: comparisonResult.missingRows,
          extraRows: comparisonResult.extraRows
        },
        preview: preview
      }
    });

  } catch (error) {
    console.error('Upload submission error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process submission' });
  }
});

/**
 * GET /api/submissions
 * Get user's own submissions
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const submissions = await Submission.find({ userId })
      .sort({ attemptNumber: -1 })
      .select('-fileDataPreview') // Exclude preview data for list view
      .lean();

    res.json({ submissions });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

/**
 * GET /api/submissions/:id
 * Get detailed submission info
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const submission = await Submission.findOne({ 
      _id: id,
      userId // Ensure user can only view their own submissions
    }).lean();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ submission });

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

/**
 * GET /api/submissions/best
 * Get user's best submission
 */
router.get('/user/best', async (req, res) => {
  try {
    const userId = req.user.id;

    const bestSubmission = await Submission.findOne({ userId })
      .sort({ accuracy: -1, f1: -1 })
      .lean();

    if (!bestSubmission) {
      return res.json({ submission: null });
    }

    res.json({ submission: bestSubmission });

  } catch (error) {
    console.error('Get best submission error:', error);
    res.status(500).json({ error: 'Failed to fetch best submission' });
  }
});

export default router;
