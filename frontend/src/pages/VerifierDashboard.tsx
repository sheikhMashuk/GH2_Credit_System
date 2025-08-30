import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, XCircle, Loader, Calendar, MapPin, Scale, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../utils/api';
import { Submission } from '../types';

const VerifierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (user?.role !== 'VERIFIER') {
      toast.error('Access denied. This page is for verifiers only.');
      return;
    }
    fetchPendingSubmissions();
  }, [user]);

  const fetchPendingSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getPendingSubmissions();
      setPendingSubmissions(data);
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      toast.error('Failed to load pending submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (submissionId: string) => {
    if (!user) return;

    setVerifyingIds(prev => new Set(prev).add(submissionId));

    try {
      const result = await ApiService.verifySubmission(submissionId, user.id);
      
      toast.success('Submission verified and NFT minted successfully!');
      
      // Remove the verified submission from the list
      setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));
      
      // Close modal if this submission was selected
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }

      console.log('Verification result:', result);

    } catch (error: any) {
      console.error('Error verifying submission:', error);
      
      if (error.response?.status === 403) {
        toast.error('Access denied. Only verifiers can approve submissions.');
      } else if (error.response?.status === 404) {
        toast.error('Submission not found.');
      } else {
        toast.error('Failed to verify submission. Please try again.');
      }
    } finally {
      setVerifyingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };

  const openSubmissionModal = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const closeSubmissionModal = () => {
    setSelectedSubmission(null);
  };

  if (user?.role !== 'VERIFIER') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to users with Verifier role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="bg-green-100 p-3 rounded-lg mr-4">
          <Shield className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verifier Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Review and verify green hydrogen production submissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {pendingSubmissions.length}
          </div>
          <div className="text-gray-600">Pending Reviews</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {pendingSubmissions.reduce((sum, s) => sum + s.productionData.quantity, 0).toFixed(2)}
          </div>
          <div className="text-gray-600">Total Quantity (kg)</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {pendingSubmissions.reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2)}
          </div>
          <div className="text-gray-600">Total Value (MATIC)</div>
        </div>
      </div>

      {/* Pending Submissions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Pending Submissions</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Loading submissions...</span>
          </div>
        ) : pendingSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">
              There are no pending submissions to review at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => (
              <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Submission #{submission.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Producer: {submission.producer.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Submitted {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-medium text-gray-900 mb-1">
                      {parseFloat(submission.price).toFixed(4)} MATIC
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      PENDING
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {submission.productionData.productionDate}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Scale className="h-4 w-4" />
                    <span>Quantity: {submission.productionData.quantity} kg</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>Location: {submission.productionData.location}</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => openSubmissionModal(submission)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Review Details</span>
                  </button>
                  
                  <button
                    onClick={() => handleVerify(submission.id)}
                    disabled={verifyingIds.has(submission.id)}
                    className="btn-success flex items-center space-x-2"
                  >
                    {verifyingIds.has(submission.id) ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve & Mint</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Submission Details
                </h2>
                <p className="text-gray-600">
                  Review all information before verification
                </p>
              </div>
              <button
                onClick={closeSubmissionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Producer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Producer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.producer.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Wallet:</span>
                    <span className="ml-2 font-mono text-xs">{selectedSubmission.producer.walletAddress}</span>
                  </div>
                </div>
              </div>

              {/* Production Data */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Production Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Production Date:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.productionData.productionDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.productionData.quantity} kg</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.productionData.location}</span>
                  </div>
                </div>
                
                {selectedSubmission.productionData.additionalNotes && (
                  <div className="mt-3">
                    <span className="text-gray-500">Additional Notes:</span>
                    <p className="mt-1 text-gray-700">{selectedSubmission.productionData.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Pricing Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Pricing Information</h3>
                <div className="text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Requested Price:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {parseFloat(selectedSubmission.price).toFixed(4)} MATIC
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-500">Price per kg:</span>
                    <span className="font-medium">
                      {(parseFloat(selectedSubmission.price) / selectedSubmission.productionData.quantity).toFixed(4)} MATIC/kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Submission Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted:</span>
                    <span>{new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {selectedSubmission.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={closeSubmissionModal}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              <button
                onClick={() => handleVerify(selectedSubmission.id)}
                disabled={verifyingIds.has(selectedSubmission.id)}
                className="btn-success flex-1 flex items-center justify-center space-x-2"
              >
                {verifyingIds.has(selectedSubmission.id) ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve & Mint NFT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifierDashboard;
