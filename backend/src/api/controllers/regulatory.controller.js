const InMemorySubmission = require('../../models/InMemorySubmission');
const InMemoryUser = require('../../models/InMemoryUser');
const blockchainService = require('../../services/blockchain.service');
const CreditLifecycleService = require('../../services/credit-lifecycle.service');

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
          credits: submission.credits,
          creditId: submission.creditId,
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
   * Approve a submission and generate credits
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

      // Get producer information for credit generation
      const producer = await UserModel.findById(submission.producerId);
      if (!producer) {
        return res.status(404).json({
          error: 'Producer not found',
          message: 'Producer associated with this submission not found'
        });
      }

      console.log('Generating credits for producer wallet:', producer.walletAddress, 'for submission:', submission._id);
      
      // Create submission data for IPFS storage
      const submissionForIPFS = {
        ...submission,
        producerId: producer.walletAddress,
        producerName: producer.name,
        id: submission._id
      };
      
      // Generate credits on blockchain with automatic IPFS sync
      const creditResult = await blockchainService.generateCreditsOnChain(
        producer.walletAddress,
        submission.productionData.quantity,
        submission.productionData.location,
        submission.productionData.productionDate,
        submissionForIPFS
      );

      if (!creditResult.success) {
        return res.status(500).json({
          error: 'Blockchain error',
          message: 'Failed to generate credits on blockchain',
          details: creditResult.error
        });
      }

      // Update submission with approval and credit details
      const updatedSubmission = await SubmissionModel.findByIdAndUpdate(
        id,
        {
          status: 'APPROVED',
          creditId: creditResult.creditId,
          credits: creditResult.credits,
          verifiedBy: authority._id,
          verifiedAt: new Date()
        },
        { new: true }
      );

      // Update producer's total credits and handle IPFS upload
      const currentCredits = producer.totalCredits || 0;
      const newTotalCredits = currentCredits + creditResult.credits;
      
      await UserModel.findByIdAndUpdate(
        submission.producerId,
        { totalCredits: newTotalCredits }
      );

      // Handle IPFS upload for credit approval
      const ipfsResult = await CreditLifecycleService.handleCreditApproval(submission, creditResult);
      
      // Real-time IPFS sync for producer balance update
      try {
        const balanceIpfsHash = await blockchainService.updateProducerCreditsInIPFS(
          producer.walletAddress,
          newTotalCredits,
          'credit_approval_balance_update'
        );
        console.log(`[RegulatoryController] ✓ Producer balance updated in IPFS: ${balanceIpfsHash}`);
      } catch (ipfsError) {
        console.warn('[RegulatoryController] Failed to update producer balance in IPFS:', ipfsError.message);
      }
      
      console.log('Submission approved and credits generated:', {
        submissionId: updatedSubmission._id,
        creditId: creditResult.creditId,
        credits: creditResult.credits,
        authority: authority.name,
        producer: producer.name,
        ipfsUpload: ipfsResult.success ? 'SUCCESS' : 'FAILED',
        ipfsHash: ipfsResult.ipfsHash,
        producerTotalCredits: newTotalCredits
      });

      res.json({
        message: 'Submission approved and credits generated successfully',
        submission: {
          id: updatedSubmission._id,
          status: updatedSubmission.status,
          creditId: updatedSubmission.creditId,
          credits: updatedSubmission.credits,
          verifiedBy: authority.name,
          verifiedAt: updatedSubmission.verifiedAt,
          producer: {
            id: producer._id,
            name: producer.name,
            walletAddress: producer.walletAddress
          }
        },
        creditInfo: {
          creditId: creditResult.creditId,
          credits: creditResult.credits,
          quantity: creditResult.quantity,
          transactionHash: creditResult.transactionHash,
          ipfsHash: ipfsResult.ipfsHash,
          ipfsUpload: ipfsResult.success,
          generatedFor: producer.walletAddress
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
