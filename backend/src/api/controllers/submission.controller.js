const Submission = require('../../models/Submission');
const InMemorySubmission = require('../../models/InMemorySubmission');
const User = require('../../models/User');
const InMemoryUser = require('../../models/InMemoryUser');
const blockchainService = require('../../services/blockchain.service');

// Always use in-memory store for simplicity
const SubmissionModel = InMemorySubmission;
const UserModel = InMemoryUser;

class SubmissionController {
  /**
   * Create a new submission (Producer only)
   * POST /api/submissions
   */
  async createSubmission(req, res) {
    try {
      console.log('Creating submission with data:', req.body);
      console.log('Authenticated user:', req.user);
      const { productionData, price } = req.body;

      // Validate input
      if (!productionData || !price) {
        console.log('Missing required fields:', { productionData, price });
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'productionData and price are required'
        });
      }

      if (price <= 0) {
        console.log('Invalid price:', price);
        return res.status(400).json({
          error: 'Invalid price',
          message: 'Price must be greater than 0'
        });
      }

      // Use authenticated user as producer
      const producer = req.user;
      
      if (producer.role !== 'PRODUCER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only users with PRODUCER role can create submissions'
        });
      }

      // Create submission with proper user ID
      const submission = await SubmissionModel.create({
        producerId: producer._id,
        productionData,
        price: price.toString(),
        status: 'PENDING'
      });

      // Add producer info to submission for response
      submission.producer = {
        id: producer._id,
        name: producer.name,
        walletAddress: producer.walletAddress
      };

      console.log('New submission created:', submission._id, 'by producer:', producer.name);
      console.log('Total submissions in store:', SubmissionModel.getAll().length);

      res.status(201).json({
        message: 'Submission created successfully',
        submission: {
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          createdAt: submission.createdAt,
          producer: submission.producer
        }
      });

    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create submission'
      });
    }
  }

  /**
   * Get pending submissions (Verifier only)
   * GET /api/submissions/pending
   */
  async getPendingSubmissions(req, res) {
    try {
      // Only verifiers can access pending submissions
      if (req.user.role !== 'VERIFIER' && req.user.role !== 'REGULATORY_AUTHORITY') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only verifiers can view pending submissions'
        });
      }

      const submissions = await SubmissionModel.find({ status: 'PENDING' });

      res.json({
        submissions: submissions.map(submission => ({
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          createdAt: submission.createdAt,
          producer: submission.producerId
        }))
      });

    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch pending submissions'
      });
    }
  }

  /**
   * Verify and approve submission (Verifier only)
   * POST /api/submissions/:id/verify
   */
  async verifySubmission(req, res) {
    try {
      const { id } = req.params;
      const { verifierId } = req.body;

      // Use authenticated user as verifier
      const verifier = req.user;
      
      if (verifier.role !== 'VERIFIER' && verifier.role !== 'REGULATORY_AUTHORITY') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only users with VERIFIER or REGULATORY_AUTHORITY role can verify submissions'
        });
      }

      const submission = await SubmissionModel.findById(req.params.id);
      if (!submission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'The requested submission does not exist'
        });
      }

      if (submission.status !== 'PENDING') {
        return res.status(400).json({
          error: 'Invalid submission status',
          message: 'Only pending submissions can be verified'
        });
      }

      // Get the status from request body (for regulatory authority approval/rejection)
      const newStatus = req.body.status || 'APPROVED';
      
      let updatedSubmission;
      
      if (newStatus === 'APPROVED') {
        // Mint NFT on blockchain for approved submissions
        console.log('Minting NFT for submission:', submission._id);
        const mintResult = await blockchainService.mintHydrogenCredit(
          submission.productionData,
          submission.price
        );

        if (!mintResult.success) {
          return res.status(500).json({
            error: 'Blockchain error',
            message: 'Failed to mint NFT on blockchain'
          });
        }

        // Update submission with approval and NFT details
        updatedSubmission = await SubmissionModel.findByIdAndUpdate(
          req.params.id,
          {
            status: 'APPROVED',
            tokenId: mintResult.tokenId,
            verifiedBy: verifier._id,
            verifiedAt: new Date()
          },
          { new: true }
        );

        console.log('Submission approved and NFT minted:', {
          submissionId: updatedSubmission._id,
          tokenId: mintResult.tokenId,
          verifier: verifier.name
        });

        res.json({
          message: 'Submission approved and NFT minted successfully',
          submission: {
            id: updatedSubmission._id,
            status: updatedSubmission.status,
            tokenId: updatedSubmission.tokenId,
            verifiedBy: verifier.name,
            verifiedAt: updatedSubmission.verifiedAt
          },
          nft: {
            tokenId: mintResult.tokenId,
            transactionHash: mintResult.transactionHash
          }
        });

      } else if (newStatus === 'REJECTED') {
        // Update submission with rejection
        updatedSubmission = await SubmissionModel.findByIdAndUpdate(
          req.params.id,
          {
            status: 'REJECTED',
            verifiedBy: verifier._id,
            verifiedAt: new Date()
          },
          { new: true }
        );

        console.log('Submission rejected:', {
          submissionId: updatedSubmission._id,
          verifier: verifier.name
        });

        res.json({
          message: 'Submission rejected successfully',
          submission: {
            id: updatedSubmission._id,
            status: updatedSubmission.status,
            verifiedBy: verifier.name,
            verifiedAt: updatedSubmission.verifiedAt
          }
        });
      }

    } catch (error) {
      console.error('Error verifying submission:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify submission'
      });
    }
  }

  /**
   * Get submissions by producer
   * GET /api/submissions/producer/:producerId
   */
  async getSubmissionsByProducer(req, res) {
    try {
      const { producerId } = req.params;
      
      // Verify user can access this producer's data
      if (req.user._id !== producerId && req.user.role !== 'REGULATORY_AUTHORITY') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own submissions'
        });
      }

      const submissions = await SubmissionModel.find({ producerId });
      console.log(`Found ${submissions.length} submissions for producer ${producerId}`);

      const submissionsArray = submissions.map(submission => {
        // Get producer info for each submission
        const producer = {
          id: req.user._id,
          name: req.user.name,
          walletAddress: req.user.walletAddress
        };

        return {
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          tokenId: submission.tokenId,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          producer: producer
        };
      });

      res.json(submissionsArray);

    } catch (error) {
      console.error('Error fetching producer submissions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch producer submissions'
      });
    }
  }

  /**
   * Get all submissions (admin function)
   * GET /api/submissions
   */
  async getAllSubmissions(req, res) {
    try {
      const { status } = req.query;
      
      let query = {};
      if (status) {
        query.status = status;
      }

      const submissions = await SubmissionModel.find(query);
      console.log(`Found ${submissions.length} submissions with status: ${status || 'all'}`);

      const submissionsArray = await Promise.all(submissions.map(async submission => {
        // Get producer info for each submission
        let producer = null;
        try {
          producer = await UserModel.findById(submission.producerId);
        } catch (err) {
          console.log('Could not find producer for submission:', submission._id);
        }

        return {
          id: submission._id,
          _id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          tokenId: submission.tokenId,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          producer: producer ? {
            id: producer._id,
            name: producer.name,
            walletAddress: producer.walletAddress
          } : null
        };
      }));

      res.json(submissionsArray);

    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch submissions'
      });
    }
  }

  /**
   * Get submissions for the authenticated user
   * GET /api/submissions/my-submissions
   */
  async getMySubmissions(req, res) {
    try {
      const user = req.user;
      
      // Only producers can have submissions
      if (user.role !== 'PRODUCER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only producers can have submissions'
        });
      }

      const submissions = await SubmissionModel.find({ producerId: user._id });
      console.log(`Found ${submissions.length} submissions for authenticated user ${user.name}`);

      const submissionsArray = submissions.map(submission => {
        const producer = {
          id: user._id,
          name: user.name,
          walletAddress: user.walletAddress
        };

        return {
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          tokenId: submission.tokenId,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          producer: producer
        };
      });

      res.json(submissionsArray);

    } catch (error) {
      console.error('Error fetching user submissions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch user submissions'
      });
    }
  }
}

module.exports = new SubmissionController();
