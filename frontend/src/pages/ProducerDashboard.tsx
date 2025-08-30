import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Loader, Calendar, MapPin, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../utils/api';
import { Submission } from '../types';

const ProducerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    productionDate: '',
    quantity: '',
    location: '',
    price: '',
    additionalNotes: ''
  });

  useEffect(() => {
    if (user?.role !== 'PRODUCER') {
      toast.error('Access denied. This page is for producers only.');
      return;
    }
    fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await ApiService.getSubmissionsByProducer(user.id);
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (!formData.productionDate || !formData.quantity || !formData.location || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmitting(true);

    try {
      const productionData = {
        productionDate: formData.productionDate,
        quantity,
        location: formData.location,
        additionalNotes: formData.additionalNotes || ''
      };

      await ApiService.createSubmission(user.id, productionData, price);
      
      toast.success('Submission created successfully!');
      
      // Reset form and close
      setFormData({
        productionDate: '',
        quantity: '',
        location: '',
        price: '',
        additionalNotes: ''
      });
      setShowForm(false);
      
      // Refresh submissions
      await fetchSubmissions();

    } catch (error) {
      console.error('Error creating submission:', error);
      toast.error('Failed to create submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'PRODUCER') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to users with Producer role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Producer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Submit production data and track verification status
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Submission</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {submissions.length}
          </div>
          <div className="text-gray-600">Total Submissions</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {submissions.filter(s => s.status === 'PENDING').length}
          </div>
          <div className="text-gray-600">Pending Review</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {submissions.filter(s => s.status === 'APPROVED').length}
          </div>
          <div className="text-gray-600">Approved</div>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {submissions.filter(s => s.status === 'APPROVED').reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2)}
          </div>
          <div className="text-gray-600">Total Value (MATIC)</div>
        </div>
      </div>

      {/* Submission Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              New Production Submission
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Date *
                </label>
                <input
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  placeholder="Enter quantity in kg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field"
                  placeholder="Production facility location"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (MATIC) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  placeholder="Desired price in MATIC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Any additional information about the production..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Submissions</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Loading submissions...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first production submission to get started.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Create Submission
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(submission.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Submission #{submission.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                    <div className="text-sm font-medium text-gray-900 mt-1">
                      {parseFloat(submission.price).toFixed(4)} MATIC
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{submission.productionData.productionDate}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Scale className="h-4 w-4" />
                    <span>{submission.productionData.quantity} kg</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{submission.productionData.location}</span>
                  </div>
                </div>

                {submission.tokenId && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>NFT Minted:</strong> Token ID #{submission.tokenId}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducerDashboard;
