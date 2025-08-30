const express = require('express');
const router = express.Router();
const regulatoryController = require('../controllers/regulatory.controller');
const { authenticateToken, requireRegulatoryAuth } = require('../../middleware/auth');

/**
 * @route GET /api/regulatory/dashboard
 * @desc Get dashboard statistics and recent submissions
 * @access Regulatory Authority only
 */
router.get('/dashboard', authenticateToken, requireRegulatoryAuth, regulatoryController.getDashboard);

/**
 * @route GET /api/regulatory/submissions
 * @desc Get all submissions for regulatory review
 * @access Regulatory Authority only
 */
router.get('/submissions', authenticateToken, requireRegulatoryAuth, regulatoryController.getAllSubmissions);

/**
 * @route GET /api/regulatory/submissions/pending
 * @desc Get pending submissions for review
 * @access Regulatory Authority only
 */
router.get('/submissions/pending', authenticateToken, requireRegulatoryAuth, regulatoryController.getPendingSubmissions);

/**
 * @route GET /api/regulatory/submissions/approved
 * @desc Get all approved submissions
 * @access Regulatory Authority only
 */
router.get('/submissions/approved', authenticateToken, requireRegulatoryAuth, async (req, res) => {
  try {
    req.query.status = 'APPROVED';
    await regulatoryController.getAllSubmissions(req, res);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch approved submissions'
    });
  }
});

/**
 * @route GET /api/regulatory/submissions/rejected
 * @desc Get all rejected submissions
 * @access Regulatory Authority only
 */
router.get('/submissions/rejected', authenticateToken, requireRegulatoryAuth, async (req, res) => {
  try {
    req.query.status = 'REJECTED';
    await regulatoryController.getAllSubmissions(req, res);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch rejected submissions'
    });
  }
});

/**
 * @route PUT /api/regulatory/submissions/:id/approve
 * @desc Approve a submission and mint NFT
 * @access Regulatory Authority only
 */
router.put('/submissions/:id/approve', authenticateToken, requireRegulatoryAuth, regulatoryController.approveSubmission);

/**
 * @route PUT /api/regulatory/submissions/:id/reject
 * @desc Reject a submission
 * @access Regulatory Authority only
 */
router.put('/submissions/:id/reject', authenticateToken, requireRegulatoryAuth, regulatoryController.rejectSubmission);

module.exports = router;
