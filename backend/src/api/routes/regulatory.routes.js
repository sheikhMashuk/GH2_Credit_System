const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { authenticateToken, requireRegulatoryAuth } = require('../../middleware/auth');

/**
 * @route GET /api/regulatory/submissions
 * @desc Get all submissions for regulatory review
 * @access Regulatory Authority only
 */
router.get('/submissions', authenticateToken, requireRegulatoryAuth, submissionController.getAllSubmissions);

/**
 * @route GET /api/regulatory/submissions/approved
 * @desc Get all approved submissions
 * @access Regulatory Authority only
 */
router.get('/submissions/approved', authenticateToken, requireRegulatoryAuth, async (req, res) => {
  try {
    // Filter for approved submissions
    req.query.status = 'APPROVED';
    await submissionController.getAllSubmissions(req, res);
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
    // Filter for rejected submissions
    req.query.status = 'REJECTED';
    await submissionController.getAllSubmissions(req, res);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch rejected submissions'
    });
  }
});

/**
 * @route PUT /api/regulatory/submissions/:id/approve
 * @desc Approve a submission
 * @access Regulatory Authority only
 */
router.put('/submissions/:id/approve', authenticateToken, requireRegulatoryAuth, async (req, res) => {
  try {
    // Set the request parameters for approval
    req.params.id = req.params.id;
    req.body = {
      status: 'APPROVED',
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };
    await submissionController.verifySubmission(req, res);
  } catch (error) {
    console.error('Error in approve route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to approve submission'
    });
  }
});

/**
 * @route PUT /api/regulatory/submissions/:id/reject
 * @desc Reject a submission
 * @access Regulatory Authority only
 */
router.put('/submissions/:id/reject', authenticateToken, requireRegulatoryAuth, async (req, res) => {
  try {
    // Set the request parameters for rejection
    req.params.id = req.params.id;
    req.body = {
      status: 'REJECTED',
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    };
    await submissionController.verifySubmission(req, res);
  } catch (error) {
    console.error('Error in reject route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reject submission'
    });
  }
});

module.exports = router;
