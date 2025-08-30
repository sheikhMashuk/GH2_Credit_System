const express = require('express');
const submissionController = require('../controllers/submission.controller');

const router = express.Router();

/**
 * @route POST /api/submissions
 * @desc Create a new submission (Producer only)
 * @access Producer
 */
router.post('/', submissionController.createSubmission);

/**
 * @route GET /api/submissions/pending
 * @desc Get pending submissions (Verifier only)
 * @access Verifier
 */
router.get('/pending', submissionController.getPendingSubmissions);

/**
 * @route POST /api/submissions/:id/verify
 * @desc Verify and approve submission (Verifier only)
 * @access Verifier
 */
router.post('/:id/verify', submissionController.verifySubmission);

/**
 * @route GET /api/submissions/producer/:producerId
 * @desc Get submissions by producer
 * @access Producer
 */
router.get('/producer/:producerId', submissionController.getSubmissionsByProducer);

/**
 * @route GET /api/submissions
 * @desc Get all submissions (admin function)
 * @access Admin
 */
router.get('/', submissionController.getAllSubmissions);

module.exports = router;
