const Submission = require('../../models/Submission');
const User = require('../../models/User');
const blockchainService = require('../../services/blockchain.service');

class SubmissionController {
  /**
   * Create a new submission (Producer only)
   * POST /api/submissions
   */
  async createSubmission(req, res) {
    try {
      const { producerId, productionData, price } = req.body;

      // Validate input
      if (!producerId || !productionData || !price) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'producerId, productionData, and price are required'
        });
      }

      if (price <= 0) {
        return res.status(400).json({
          error: 'Invalid price',
          message: 'Price must be greater than 0'
        });
      }

      // Verify producer exists and has PRODUCER role
      const producer = await User.findById(producerId);

      if (!producer) {
        return res.status(404).json({
          error: 'Producer not found',
          message: 'No producer found with this ID'
        });
      }

      if (producer.role !== 'PRODUCER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only users with PRODUCER role can create submissions'
        });
      }

      // Create submission
      const submission = await Submission.create({
        producerId,
        productionData,
        price: price.toString(),
        status: 'PENDING'
      });

      await submission.populate('producerId', 'name walletAddress');

      console.log('New submission created:', submission.id, 'by producer:', producer.name);

      res.status(201).json({
        message: 'Submission created successfully',
        submission: {
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          createdAt: submission.createdAt,
          producer: submission.producerId
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
      const submissions = await Submission.find({ status: 'PENDING' })
        .populate('producerId', 'name walletAddress')
        .sort({ createdAt: 1 });

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

      // Validate verifier
      if (verifierId) {
        const verifier = await User.findById(verifierId);

        if (!verifier || verifier.role !== 'VERIFIER') {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Only users with VERIFIER role can verify submissions'
          });
        }
      }

      // Get submission with producer details
      const submission = await Submission.findById(id)
        .populate('producerId');

      if (!submission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'No submission found with this ID'
        });
      }

      if (submission.status !== 'PENDING') {
        return res.status(400).json({
          error: 'Invalid submission status',
          message: 'Only pending submissions can be verified'
        });
      }

      console.log('Verifying submission:', id, 'for producer:', submission.producerId.name);

      // Mint NFT and list on marketplace via blockchain service
      try {
        const mintResult = await blockchainService.mintAndListCredit(
          submission.producerId.walletAddress,
          parseFloat(submission.price),
          {
            productionDate: submission.productionData.productionDate,
            quantity: submission.productionData.quantity,
            location: submission.productionData.location,
            submissionId: submission._id
          }
        );

        console.log('NFT minted successfully:', mintResult);

        // Update submission status and add token ID
        const updatedSubmission = await Submission.findByIdAndUpdate(
          id,
          {
            status: 'APPROVED',
            tokenId: mintResult.tokenId
          },
          { new: true }
        ).populate('producerId', 'name walletAddress');

        res.json({
          message: 'Submission verified and NFT minted successfully',
          submission: {
            id: updatedSubmission._id,
            status: updatedSubmission.status,
            tokenId: updatedSubmission.tokenId,
            productionData: updatedSubmission.productionData,
            price: updatedSubmission.price,
            createdAt: updatedSubmission.createdAt,
            updatedAt: updatedSubmission.updatedAt,
            producer: updatedSubmission.producerId
          },
          blockchain: {
            tokenId: mintResult.tokenId,
            transactionHash: mintResult.transactionHash,
            blockNumber: mintResult.blockNumber
          }
        });

      } catch (blockchainError) {
        console.error('Blockchain operation failed:', blockchainError);
        
        // Update submission status to rejected due to blockchain error
        await Submission.findByIdAndUpdate(id, { status: 'REJECTED' });

        res.status(500).json({
          error: 'Blockchain operation failed',
          message: `Failed to mint NFT: ${blockchainError.message}`
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

      const submissions = await Submission.find({ producerId })
        .populate('producerId', 'name walletAddress')
        .sort({ createdAt: -1 });

      res.json({
        submissions: submissions.map(submission => ({
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          tokenId: submission.tokenId,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          producer: submission.producerId
        }))
      });

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
      
      const filter = status ? { status } : {};

      const submissions = await Submission.find(filter)
        .populate('producerId', 'name walletAddress')
        .sort({ createdAt: -1 });

      res.json({
        submissions: submissions.map(submission => ({
          id: submission._id,
          status: submission.status,
          tokenId: submission.tokenId,
          productionData: submission.productionData,
          price: submission.price,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          producer: submission.producerId
        }))
      });

    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch submissions'
      });
    }
  }
}

module.exports = new SubmissionController();
