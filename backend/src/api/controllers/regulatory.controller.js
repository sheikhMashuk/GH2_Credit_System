const InMemorySubmission = require('../../models/InMemorySubmission');
const InMemoryUser = require('../../models/InMemoryUser');
const blockchainService = require('../../services/blockchain.service');

const SubmissionModel = InMemorySubmission;
const UserModel = InMemoryUser;

class RegulatoryController {
  /**
   * Get all submissions for regulatory review
   * GET /api/regulatory/submissions
   */
  async getAllSubmissions(req, res) {
    try {
      const { status } = req.query;
      
      let query = {};
      if (status) {
        query.status = status;
      }

      const submissions = await SubmissionModel.find(query);
      console.log(`Regulatory Authority - Found ${submissions.length} submissions with status: ${status || 'all'}`);

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
          verifiedAt: submission.verifiedAt,
          verifiedBy: submission.verifiedBy,
          producer: producer ? {
            id: producer._id,
            name: producer.name,
            walletAddress: producer.walletAddress
          } : null
        };
      }));

      res.json({
        message: 'Submissions retrieved successfully',
        submissions: submissionsArray,
        total: submissionsArray.length
      });

    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch submissions'
      });
    }
  }

  /**
   * Get pending submissions for review
   * GET /api/regulatory/submissions/pending
   */
  async getPendingSubmissions(req, res) {
    try {
      const submissions = await SubmissionModel.find({ status: 'PENDING' });
      console.log(`Regulatory Authority - Found ${submissions.length} pending submissions`);

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
          status: submission.status,
          productionData: submission.productionData,
          price: submission.price,
          createdAt: submission.createdAt,
          producer: producer ? {
            id: producer._id,
            name: producer.name,
            walletAddress: producer.walletAddress
          } : null
        };
      }));

      res.json({
        message: 'Pending submissions retrieved successfully',
        submissions: submissionsArray,
        total: submissionsArray.length
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
   * Approve a submission and mint NFT
   * PUT /api/regulatory/submissions/:id/approve
   */
  async approveSubmission(req, res) {
    try {
      const { id } = req.params;
      const authority = req.user;

      console.log(`Regulatory Authority ${authority.name} approving submission ${id}`);

      const submission = await SubmissionModel.findById(id);
      if (!submission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'The requested submission does not exist'
        });
      }

      if (submission.status !== 'PENDING') {
        return res.status(400).json({
          error: 'Invalid submission status',
          message: 'Only pending submissions can be approved'
        });
      }

      // Get producer information for NFT minting
      const producer = await UserModel.findById(submission.producerId);
      if (!producer) {
        return res.status(404).json({
          error: 'Producer not found',
          message: 'Producer associated with this submission not found'
        });
      }

      // Mint NFT on blockchain using producer's wallet address
      console.log('Minting NFT for submission:', submission._id, 'Producer wallet:', producer.walletAddress);
      
      // Prepare metadata for NFT
      const nftMetadata = {
        ...submission.productionData,
        producerAddress: producer.walletAddress,
        submissionId: submission._id,
        approvedBy: authority.name,
        approvedAt: new Date().toISOString()
      };

      const mintResult = await blockchainService.mintHydrogenCredit(
        nftMetadata,
        submission.price
      );

      if (!mintResult.success) {
        return res.status(500).json({
          error: 'Blockchain error',
          message: 'Failed to mint NFT on blockchain',
          details: mintResult.error
        });
      }

      // Update submission with approval and NFT details
      const updatedSubmission = await SubmissionModel.findByIdAndUpdate(
        id,
        {
          status: 'APPROVED',
          tokenId: mintResult.tokenId,
          verifiedBy: authority._id,
          verifiedAt: new Date(),
          transactionHash: mintResult.transactionHash
        },
        { new: true }
      );

      console.log('Submission approved and NFT minted:', {
        submissionId: updatedSubmission._id,
        tokenId: mintResult.tokenId,
        authority: authority.name,
        producer: producer.name
      });

      res.json({
        message: 'Submission approved and NFT minted successfully',
        submission: {
          id: updatedSubmission._id,
          status: updatedSubmission.status,
          tokenId: updatedSubmission.tokenId,
          verifiedBy: authority.name,
          verifiedAt: updatedSubmission.verifiedAt,
          transactionHash: updatedSubmission.transactionHash,
          producer: {
            id: producer._id,
            name: producer.name,
            walletAddress: producer.walletAddress
          }
        },
        nft: {
          tokenId: mintResult.tokenId,
          transactionHash: mintResult.transactionHash,
          blockNumber: mintResult.blockNumber
        }
      });

    } catch (error) {
      console.error('Error approving submission:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to approve submission',
        details: error.message
      });
    }
  }

  /**
   * Reject a submission
   * PUT /api/regulatory/submissions/:id/reject
   */
  async rejectSubmission(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const authority = req.user;

      console.log(`Regulatory Authority ${authority.name} rejecting submission ${id}`);

      const submission = await SubmissionModel.findById(id);
      if (!submission) {
        return res.status(404).json({
          error: 'Submission not found',
          message: 'The requested submission does not exist'
        });
      }

      if (submission.status !== 'PENDING') {
        return res.status(400).json({
          error: 'Invalid submission status',
          message: 'Only pending submissions can be rejected'
        });
      }

      // Update submission with rejection
      const updatedSubmission = await SubmissionModel.findByIdAndUpdate(
        id,
        {
          status: 'REJECTED',
          verifiedBy: authority._id,
          verifiedAt: new Date(),
          rejectionReason: reason || 'No reason provided'
        },
        { new: true }
      );

      // Get producer information for response
      const producer = await UserModel.findById(submission.producerId);

      console.log('Submission rejected:', {
        submissionId: updatedSubmission._id,
        authority: authority.name,
        reason: reason
      });

      res.json({
        message: 'Submission rejected successfully',
        submission: {
          id: updatedSubmission._id,
          status: updatedSubmission.status,
          verifiedBy: authority.name,
          verifiedAt: updatedSubmission.verifiedAt,
          rejectionReason: updatedSubmission.rejectionReason,
          producer: producer ? {
            id: producer._id,
            name: producer.name,
            walletAddress: producer.walletAddress
          } : null
        }
      });

    } catch (error) {
      console.error('Error rejecting submission:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to reject submission',
        details: error.message
      });
    }
  }

  /**
   * Get dashboard statistics
   * GET /api/regulatory/dashboard
   */
  async getDashboard(req, res) {
    try {
      const allSubmissions = await SubmissionModel.find({});
      
      const stats = {
        total: allSubmissions.length,
        pending: allSubmissions.filter(s => s.status === 'PENDING').length,
        approved: allSubmissions.filter(s => s.status === 'APPROVED').length,
        rejected: allSubmissions.filter(s => s.status === 'REJECTED').length
      };

      const recentSubmissions = allSubmissions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      const recentSubmissionsWithProducers = await Promise.all(
        recentSubmissions.map(async submission => {
          const producer = await UserModel.findById(submission.producerId);
          return {
            id: submission._id,
            status: submission.status,
            createdAt: submission.createdAt,
            price: submission.price,
            producer: producer ? {
              name: producer.name,
              walletAddress: producer.walletAddress
            } : null
          };
        })
      );

      res.json({
        message: 'Dashboard data retrieved successfully',
        stats,
        recentSubmissions: recentSubmissionsWithProducers
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch dashboard data'
      });
    }
  }
}

module.exports = new RegulatoryController();
