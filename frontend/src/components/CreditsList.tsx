import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface CreditData {
  version: string;
  type: string;
  creditId: string;
  producer: {
    address: string;
    name: string;
  };
  production: {
    date: string;
    quantity: number;
    location: string;
    method: string;
    additionalNotes?: string;
  };
  credits: {
    amount: number;
    generatedAt: string;
    approvedBy: string;
    approvedAt: string;
    status: string;
    ownership: {
      currentOwner: string;
      transferHistory: any[];
    };
  };
  verification: {
    submissionId: string;
    status: string;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    standard: string;
    network: string;
  };
}

interface Credit {
  ipfsHash: string;
  name: string;
  dateUploaded: string;
  size: number;
  producer: string;
  creditId: string;
  creditData: CreditData | null;
  source: string;
  error?: string;
}

const CreditsList: React.FC = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'producer'>('all');
  const [producerAddress, setProducerAddress] = useState('');

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/credits');
      setCredits(response.data.credits || []);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducerCredits = async () => {
    if (!producerAddress.trim()) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/credits/producer/${producerAddress}`);
      setCredits(response.data.credits || []);
    } catch (error) {
      console.error('Error fetching producer credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const CreditCard: React.FC<{ credit: Credit }> = ({ credit }) => (
    <div className="credit-card" style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '16px', 
      margin: '8px 0',
      backgroundColor: '#f9f9f9'
    }}>
      <div className="credit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>Credit ID: {credit.creditId}</h4>
        <span className="credit-status" style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: credit.creditData?.credits.status === 'active' ? '#d4edda' : '#f8d7da',
          color: credit.creditData?.credits.status === 'active' ? '#155724' : '#721c24'
        }}>
          {credit.creditData?.credits.status || 'Unknown'}
        </span>
      </div>
      
      {credit.creditData ? (
        <div className="credit-details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <div>
              <p><strong>Producer:</strong> {credit.creditData.producer.name}</p>
              <p><strong>Address:</strong> {credit.creditData.producer.address.substring(0, 10)}...</p>
              <p><strong>Credits:</strong> {credit.creditData.credits.amount}</p>
              <p><strong>Quantity:</strong> {credit.creditData.production.quantity} kg</p>
            </div>
            <div>
              <p><strong>Location:</strong> {credit.creditData.production.location}</p>
              <p><strong>Method:</strong> {credit.creditData.production.method}</p>
              <p><strong>Approved:</strong> {formatDate(credit.creditData.credits.approvedAt)}</p>
              <p><strong>Standard:</strong> {credit.creditData.metadata.standard}</p>
            </div>
          </div>
          
          <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
            <p><strong>IPFS Hash:</strong> {credit.ipfsHash}</p>
            <p><strong>Uploaded:</strong> {formatDate(credit.dateUploaded)}</p>
            <p><strong>Size:</strong> {formatFileSize(credit.size)}</p>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setSelectedCredit(credit)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              View Details
            </button>
            <a 
              href={`https://gateway.pinata.cloud/ipfs/${credit.ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px'
              }}
            >
              View on IPFS
            </a>
          </div>
        </div>
      ) : (
        <div style={{ color: '#dc3545', marginTop: '8px' }}>
          <p>Error loading credit data: {credit.error}</p>
          <p><strong>IPFS Hash:</strong> {credit.ipfsHash}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="credits-list" style={{ padding: '20px' }}>
      <div className="credits-header" style={{ marginBottom: '20px' }}>
        <h2>Green Hydrogen Credits from IPFS</h2>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <div>
            <label>
              <input
                type="radio"
                value="all"
                checked={viewMode === 'all'}
                onChange={(e) => setViewMode(e.target.value as 'all')}
                style={{ marginRight: '8px' }}
              />
              All Credits
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                value="producer"
                checked={viewMode === 'producer'}
                onChange={(e) => setViewMode(e.target.value as 'producer')}
                style={{ marginRight: '8px' }}
              />
              By Producer
            </label>
          </div>
        </div>

        {viewMode === 'producer' && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Enter producer wallet address"
              value={producerAddress}
              onChange={(e) => setProducerAddress(e.target.value)}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                flex: 1 
              }}
            />
            <button
              onClick={fetchProducerCredits}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          <button
            onClick={fetchCredits}
            disabled={loading}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Loading...' : 'Refresh Credits'}
          </button>
        </div>
      </div>

      <div className="credits-stats" style={{ 
        padding: '16px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Statistics</h3>
        <p><strong>Total Credits Found:</strong> {credits.length}</p>
        <p><strong>Successfully Loaded:</strong> {credits.filter(c => c.creditData).length}</p>
        <p><strong>Failed to Load:</strong> {credits.filter(c => !c.creditData).length}</p>
        <p><strong>Source:</strong> Pinata IPFS</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading credits from IPFS...</p>
        </div>
      ) : credits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No credits found in IPFS.</p>
          <p>Credits will appear here when approved by regulatory authority.</p>
        </div>
      ) : (
        <div className="credits-grid">
          {credits.map((credit, index) => (
            <CreditCard key={credit.ipfsHash || index} credit={credit} />
          ))}
        </div>
      )}

      {/* Credit Details Modal */}
      {selectedCredit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Credit Details</h3>
              <button
                onClick={() => setSelectedCredit(null)}
                style={{ 
                  padding: '4px 8px', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            {selectedCredit.creditData && (
              <div>
                <pre style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '16px', 
                  borderRadius: '4px', 
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(selectedCredit.creditData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsList;
