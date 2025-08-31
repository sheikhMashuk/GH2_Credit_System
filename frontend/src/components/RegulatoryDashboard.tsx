import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface Submission {
  id: string;
  _id?: string;
  productionData: {
    productionDate: string;
    quantity: number;
    location: string;
    additionalNotes?: string;
  };
  status: string;
  credits: number;
  creditId?: string;
  createdAt: string;
  updatedAt: string;
  producer?: {
    id: string;
    name: string;
    walletAddress: string;
  };
}

const RegulatoryDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState<Submission[]>([]);
  const [rejectedSubmissions, setRejectedSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.role === 'REGULATORY_AUTHORITY') {
      fetchSubmissions();
      // Set up polling for real-time updates
      const interval = setInterval(fetchSubmissions, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const [allResponse, approvedResponse, rejectedResponse] = await Promise.all([
        api.get('/api/regulatory/submissions'),
        api.get('/api/regulatory/submissions/approved'),
        api.get('/api/regulatory/submissions/rejected')
      ]);

      console.log('All submissions response:', allResponse.data);
      console.log('Approved submissions response:', approvedResponse.data);
      console.log('Rejected submissions response:', rejectedResponse.data);

      // Handle both array and object responses
      setSubmissions(Array.isArray(allResponse.data) ? allResponse.data : allResponse.data.submissions || []);
      setApprovedSubmissions(Array.isArray(approvedResponse.data) ? approvedResponse.data : approvedResponse.data.submissions || []);
      setRejectedSubmissions(Array.isArray(rejectedResponse.data) ? rejectedResponse.data : rejectedResponse.data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    try {
      await api.put(`/api/regulatory/submissions/${submissionId}/approve`);
      fetchSubmissions(); // Refresh data
    } catch (error) {
      console.error('Error approving submission:', error);
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      await api.put(`/api/regulatory/submissions/${submissionId}/reject`);
      fetchSubmissions(); // Refresh data
    } catch (error) {
      console.error('Error rejecting submission:', error);
    }
  };

  const renderSubmissions = (submissionList: Submission[], showActions = false) => (
    <div className="submissions-list">
      {submissionList.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        submissionList.map((submission) => (
          <div key={submission.id || submission._id} className="submission-card">
            <div className="submission-header">
              <h4>Submission #{submission._id}</h4>
              <span className={`status ${submission.status.toLowerCase()}`}>
                {submission.status}
              </span>
            </div>
            
            <div className="submission-details">
              <p><strong>Quantity:</strong> {submission.productionData.quantity} kg</p>
              <p><strong>Location:</strong> {submission.productionData.location}</p>
              <p><strong>Production Date:</strong> {new Date(submission.productionData.productionDate).toLocaleString()}</p>
              <p><strong>Credits:</strong> {submission.credits}</p>
              <p><strong>Submitted By:</strong> {submission.producer?.name || 'Unknown Producer'}</p>
              <p><strong>Wallet Address:</strong> {submission.producer?.walletAddress || 'N/A'}</p>
              <p><strong>Submitted At:</strong> {new Date(submission.createdAt).toLocaleString()}</p>
              {submission.productionData.additionalNotes && (
                <p><strong>Notes:</strong> {submission.productionData.additionalNotes}</p>
              )}
            </div>

            {showActions && submission.status === 'PENDING' && (
              <div className="submission-actions">
                <button 
                  onClick={() => handleApprove(submission.id || submission._id || '')}
                  className="approve-btn"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReject(submission.id || submission._id || '')}
                  className="reject-btn"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  if (user?.role !== 'REGULATORY_AUTHORITY') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Access Denied</h2>
          <p>This dashboard is only accessible to regulatory authorities.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="regulatory-dashboard">
      <div className="dashboard-header">
        <h1>Regulatory Authority Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'pending' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({submissions.filter(s => s.status === 'PENDING').length})
        </button>
        <button 
          className={activeTab === 'approved' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({approvedSubmissions.length})
        </button>
        <button 
          className={activeTab === 'rejected' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({rejectedSubmissions.length})
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <p>Loading submissions...</p>
        ) : (
          <>
            {activeTab === 'pending' && renderSubmissions(
              submissions.filter(s => s.status === 'PENDING'), 
              true
            )}
            {activeTab === 'approved' && renderSubmissions(approvedSubmissions)}
            {activeTab === 'rejected' && renderSubmissions(rejectedSubmissions)}
          </>
        )}
      </div>
    </div>
  );
};

export default RegulatoryDashboard;
