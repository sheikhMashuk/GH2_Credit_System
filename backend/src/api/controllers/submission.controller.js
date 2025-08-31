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
      const { productionData } = req.body;

      // Validate input
      if (!productionData) {
        console.log('Missing required fields:', { productionData });
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'productionData is required'
        });
      }

      // Validate production data fields
      if (!productionData.quantity || !productionData.location || !productionData.productionDate) {
        console.log('Missing production data fields:', productionData);
        return res.status(400).json({
          error: 'Missing production data fields',
          message: 'quantity, location, and productionDate are required'
        });
      }

      const quantity = parseFloat(productionData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        console.log('Invalid quantity:', productionData.quantity);
        return res.status(400).json({
          error: 'Invalid quantity',
          message: 'Quantity must be a valid number greater than 0'
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

      // Create submission with proper user ID (no price field)
      const submission = await SubmissionModel.create({
        producerId: producer._id,
        productionData,
        status: 'PENDING'
      });

      // Add producer info to submission for response
      submission.producer = {
        id: producer._id,
        name: producer.name,
        walletAddress: producer.walletAddress
      };

      console.log('New submission created:', submission._id, 'by producer:', producer.name);
      console.log('Calculated credits:', submission.credits, 'for quantity:', productionData.quantity, 'kg');
      console.log('Total submissions in store:', SubmissionModel.getAll().length);

      res.status(201).json({
        message: 'Submission created successfully',
        submission: {
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          credits: submission.credits,
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
          credits: submission.credits,
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
        // Get producer info for credit generation
        const producer = await UserModel.findById(submission.producerId);
        if (!producer) {
          return res.status(404).json({
            error: 'Producer not found',
            message: 'Cannot generate credits - producer not found'
          });
        }

        // Generate credits on blockchain for approved submissions with IPFS update
        console.log('Generating credits for submission:', submission._id, 'for producer:', producer.walletAddress);
        
        // Add producer wallet address to production data for credit generation
        const productionDataWithProducer = {
          ...submission.productionData,
          producerAddress: producer.walletAddress
        };
        
        // Create submission data for IPFS storage
        const submissionForIPFS = {
          ...submission,
          producerId: producer.walletAddress,
          producerName: producer.name
        };
        
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
            message: 'Failed to generate credits on blockchain'
          });
        }

        // Update submission with approval and credit details
        updatedSubmission = await SubmissionModel.findByIdAndUpdate(
          req.params.id,
          {
            status: 'APPROVED',
            creditId: creditResult.creditId,
            credits: creditResult.credits,
            verifiedBy: verifier._id,
            verifiedAt: new Date()
          },
          { new: true }
        );

        // Update producer's total credits and trigger IPFS sync
        const submissionProducer = await UserModel.findById(submission.producerId);
        if (submissionProducer) {
          const currentCredits = submissionProducer.totalCredits || 0;
          const newTotalCredits = currentCredits + creditResult.credits;
          
          await UserModel.findByIdAndUpdate(
            submission.producerId,
            { totalCredits: newTotalCredits }
          );
          
          console.log(`Updated producer ${submissionProducer.name} total credits: ${currentCredits} + ${creditResult.credits} = ${newTotalCredits}`);
          
          // Trigger IPFS update for all producer's credits after credit change
          try {
            const allProducerSubmissions = await SubmissionModel.find({ 
              producerId: submission.producerId, 
              status: 'APPROVED' 
            });
            
            await blockchainService.updateAllCreditsIPFS(
              submissionProducer.walletAddress, 
              allProducerSubmissions
            );
            
            console.log(`IPFS synchronized for producer ${submissionProducer.walletAddress} after credit update`);
          } catch (ipfsError) {
            console.warn('Failed to sync IPFS after credit update:', ipfsError.message);
          }
        }

        res.json({
          message: 'Submission approved and credits generated successfully',
          submission: {
            id: updatedSubmission._id,
            status: updatedSubmission.status,
            creditId: updatedSubmission.creditId,
            credits: updatedSubmission.credits,
            verifiedBy: verifier.name,
            verifiedAt: updatedSubmission.verifiedAt
          },
          creditInfo: {
            creditId: creditResult.creditId,
            quantity: creditResult.quantity,
            credits: creditResult.credits,
            transactionHash: creditResult.transactionHash
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

        console.log('Producer submission mapping:', {
          id: submission._id,
          status: submission.status,
          credits: submission.credits,
          quantity: submission.productionData?.quantity
        });

        return {
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          credits: submission.credits || 0,
          creditId: submission.creditId,
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
          credits: submission.credits,
          creditId: submission.creditId,
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

        console.log('getMySubmissions mapping:', {
          id: submission._id,
          status: submission.status,
          credits: submission.credits,
          quantity: submission.productionData?.quantity
        });

        return {
          id: submission._id,
          status: submission.status,
          productionData: submission.productionData,
          credits: submission.credits || 0,
          creditId: submission.creditId,
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
