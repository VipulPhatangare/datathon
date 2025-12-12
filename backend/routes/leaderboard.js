import express from 'express';
import Submission from '../models/Submission.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * GET /api/leaderboard
 * Get leaderboard with top submissions
 * Query params:
 *  - limit: number of top entries (default 50)
 *  - includeRank: if true, includes current user's rank
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const includeRank = req.query.includeRank === 'true';
    const currentUserId = req.user?.id;

    // Aggregate best submission for each user
    // Group by userId and get max accuracy and f1 for each user
    const leaderboardData = await Submission.aggregate([
      {
        $sort: { accuracy: -1, f1: -1 }
      },
      {
        $group: {
          _id: '$userId',
          bestAccuracy: { $first: '$accuracy' },
          bestF1: { $first: '$f1' },
          bestPrecision: { $first: '$precision' },
          bestRecall: { $first: '$recall' },
          bestSubmissionId: { $first: '$_id' },
          submissionDate: { $first: '$uploadedAt' },
          attemptNumber: { $first: '$attemptNumber' }
        }
      },
      {
        $sort: { bestAccuracy: -1, bestF1: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Populate user info
    const userIds = leaderboardData.map(entry => entry._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('email teamName')
      .lean();

    const userMap = new Map(users.map(user => [user._id.toString(), user]));

    // Combine data
    const leaderboard = leaderboardData.map((entry, index) => {
      const user = userMap.get(entry._id.toString());
      return {
        rank: index + 1,
        userId: entry._id,
        teamName: user?.teamName || 'Unknown',
        email: user?.email || 'Unknown',
        accuracy: entry.bestAccuracy,
        f1: entry.bestF1,
        precision: entry.bestPrecision,
        recall: entry.bestRecall,
        submissionDate: entry.submissionDate,
        attemptNumber: entry.attemptNumber
      };
    });

    // If requested, find current user's rank
    let userRank = null;
    if (includeRank && currentUserId) {
      // Get all users sorted by accuracy and f1
      const allRankings = await Submission.aggregate([
        {
          $sort: { accuracy: -1, f1: -1 }
        },
        {
          $group: {
            _id: '$userId',
            bestAccuracy: { $first: '$accuracy' },
            bestF1: { $first: '$f1' }
          }
        },
        {
          $sort: { bestAccuracy: -1, bestF1: -1 }
        }
      ]);

      const rankIndex = allRankings.findIndex(
        entry => entry._id.toString() === currentUserId
      );

      if (rankIndex !== -1) {
        userRank = {
          rank: rankIndex + 1,
          accuracy: allRankings[rankIndex].bestAccuracy,
          f1: allRankings[rankIndex].bestF1,
          totalUsers: allRankings.length
        };
      }
    }

    res.json({
      leaderboard,
      userRank,
      totalEntries: leaderboardData.length
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
