const express = require('express');
const submissionController = require('../controllers/submission.controller');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/submissions
 * @desc Create a new submission (Producer only)
 * @access Producer
 */
router.post('/', authenticateToken, submissionController.createSubmission);

/**
 * @route GET /api/submissions/pending
 * @desc Get pending submissions (Verifier only)
 * @access Verifier
 */
router.get('/pending', authenticateToken, submissionController.getPendingSubmissions);

/**
 * @route POST /api/submissions/:id/verify
 * @desc Verify and approve submission (Verifier only)
 * @access Verifier
 */
router.post('/:id/verify', authenticateToken, submissionController.verifySubmission);

/**
 * @route GET /api/submissions/producer/:producerId
 * @desc Get submissions by producer
 * @access Producer
 */
router.get('/producer/:producerId', authenticateToken, submissionController.getSubmissionsByProducer);

/**
 * @route GET /api/submissions/my-submissions
 * @desc Get submissions for the authenticated user
 * @access Producer
 */
router.get('/my-submissions', authenticateToken, submissionController.getMySubmissions);

/**
 * @route GET /api/submissions
 * @desc Get all submissions (admin function)
 * @access Admin
 */
router.get('/', submissionController.getAllSubmissions);

module.exports = router;
