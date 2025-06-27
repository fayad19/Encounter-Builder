import React, { useState, useEffect, useRef } from 'react';
import { EncounterService } from '../services/encounterService';

export default function EncounterSharing({ onDataLoaded }) {
  const [encounterId, setEncounterId] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const hasAutoLoadedRef = useRef(false);

  // Check for encounter ID in URL on component mount
  useEffect(() => {
    // Check if we've already auto-loaded to prevent infinite loops
    if (hasAutoLoadedRef.current) {
      console.log('Already auto-loaded, skipping...');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlEncounterId = urlParams.get('encounter');
    console.log('URL params:', window.location.search);
    console.log('Encounter ID from URL:', urlEncounterId);
    
    if (urlEncounterId) {
      setEncounterId(urlEncounterId);
      hasAutoLoadedRef.current = true; // Mark as auto-loaded
      console.log('Auto-loading encounter:', urlEncounterId);
      // Auto-load if encounter ID is in URL
      handleLoadEncounter(urlEncounterId);
    }
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSaveAndShare = async () => {
    setLoading(true);
    try {
      // Get all localStorage data
      const encounterData = EncounterService.getAllLocalStorageData();
      
      // Generate unique ID if not provided
      const id = encounterId || EncounterService.generateEncounterId();
      
      // Save to Firebase
      await EncounterService.saveEncounter(id, encounterData);
      
      // Create shareable link
      const shareLink = `${window.location.origin}?encounter=${id}`;
      setEncounterId(id);
      setShareUrl(shareLink);
      
      showMessage(`Encounter saved successfully! ID: ${id}`, 'success');
    } catch (error) {
      console.error('Error saving encounter:', error);
      showMessage('Error saving encounter. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadEncounter = async (id = encounterId) => {
    console.log('handleLoadEncounter called with ID:', id);
    
    if (!id) {
      showMessage('Please enter an encounter ID', 'error');
      return;
    }

    setLoading(true);
    try {
      const encounterId = EncounterService.extractEncounterId(id);
      console.log('Extracted encounter ID:', encounterId);
      
      console.log('Loading encounter from Firebase...');
      const data = await EncounterService.loadEncounter(encounterId);
      console.log('Loaded data from Firebase:', data);
      
      // Restore localStorage data
      console.log('Restoring localStorage data...');
      const success = EncounterService.restoreLocalStorageData(data);
      console.log('Restore success:', success);
      
      if (success) {
        showMessage('Encounter loaded successfully!', 'success');
        
        // Notify parent component that data was loaded
        if (onDataLoaded) {
          onDataLoaded(data);
        }
        
        // Clear the URL parameter to prevent future auto-loading
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        console.log('Encounter loaded and URL cleaned');
      } else {
        showMessage('Error restoring encounter data', 'error');
      }
    } catch (error) {
      console.error('Error loading encounter:', error);
      showMessage(error.message || 'Error loading encounter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showMessage('Error copying to clipboard', 'error');
    }
  };

  const clearForm = () => {
    setEncounterId('');
    setShareUrl('');
    setMessage('');
  };

  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      
      // Test saving a simple document
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Firebase connection test'
      };
      
      const testId = `test-${Date.now()}`;
      console.log('Saving test document with ID:', testId);
      
      await EncounterService.saveEncounter(testId, testData);
      console.log('Test document saved successfully');
      
      // Test loading the document
      console.log('Loading test document...');
      const loadedData = await EncounterService.loadEncounter(testId);
      console.log('Test document loaded:', loadedData);
      
      showMessage('Firebase connection test successful!', 'success');
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      showMessage(`Firebase test failed: ${error.message}`, 'error');
    }
  };

  const debugLocalStorage = () => {
    const data = EncounterService.getAllLocalStorageData();
    console.log('Current localStorage data:', data);
    showMessage('LocalStorage data logged to console', 'info');
  };

  return (
    <div className="encounter-sharing">
      <h3>Share Encounter</h3>
      
      {/* Message Display */}
      {message && (
        <div className={`alert alert-${messageType === 'error' ? 'danger' : messageType === 'success' ? 'success' : 'info'}`}>
          {message}
        </div>
      )}
      
      {/* Save & Share Section */}
      <div className="sharing-section">
        <h4>Save & Share Your Current Encounter</h4>
        <div className="form-group">
          <label htmlFor="encounterId">Encounter ID (optional):</label>
          <input
            type="text"
            id="encounterId"
            className="form-control"
            placeholder="Leave empty for auto-generated ID"
            value={encounterId}
            onChange={(e) => setEncounterId(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button 
          onClick={handleSaveAndShare} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : 'Save & Generate Share Link'}
        </button>
        
        {shareUrl && (
          <div className="share-info">
            <h5>Share Link Generated!</h5>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control"
                value={shareUrl} 
                readOnly 
                onClick={(e) => e.target.select()}
              />
              <button 
                className="btn btn-outline-secondary"
                onClick={() => copyToClipboard(shareUrl)}
              >
                Copy
              </button>
            </div>
            <p className="text-muted">
              <strong>Encounter ID:</strong> {encounterId}
            </p>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={clearForm}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      <hr />
      
      {/* Load Encounter Section */}
      <div className="loading-section">
        <h4>Load Someone Else's Encounter</h4>
        <div className="form-group">
          <label htmlFor="loadEncounterId">Encounter ID or Share Link:</label>
          <input
            type="text"
            id="loadEncounterId"
            className="form-control"
            placeholder="Paste encounter ID or full share link"
            value={encounterId}
            onChange={(e) => setEncounterId(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button 
          onClick={() => handleLoadEncounter()} 
          disabled={loading || !encounterId}
          className="btn btn-success"
        >
          {loading ? 'Loading...' : 'Load Encounter'}
        </button>
        
        <p className="text-muted">
          <small>
            Note: Loading an encounter will replace your current data. 
            Make sure to save your current encounter first if needed.
          </small>
        </p>
      </div>
      
      {/* Instructions */}
      <div className="instructions">
        <h4>How to Use</h4>
        <ol>
          <li><strong>To share:</strong> Click "Save & Generate Share Link", then copy the link and send it to others</li>
          <li><strong>To load:</strong> Paste an encounter ID or share link and click "Load Encounter"</li>
          <li><strong>Auto-load:</strong> If someone sends you a share link, just open it and the encounter will load automatically</li>
        </ol>
        
        <hr />
        
        <h4>Debug Tools</h4>
        <button 
          onClick={testFirebaseConnection}
          className="btn btn-outline-info btn-sm"
        >
          Test Firebase Connection
        </button>
        <button 
          onClick={debugLocalStorage}
          className="btn btn-outline-secondary btn-sm"
        >
          Debug Local Storage
        </button>
        <p className="text-muted">
          <small>
            Use this to test if Firebase is working correctly. Check the browser console for detailed logs.
          </small>
        </p>
      </div>
    </div>
  );
} 