import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { submissionAPI } from '../api';

function Upload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const navigate = useNavigate();

  const validateCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: 1,
        complete: (results) => {
          const columns = results.meta.fields;
          
          if (!columns.includes('row_id')) {
            reject('CSV must contain a "row_id" column');
            return;
          }
          
          if (!columns.includes('label')) {
            reject('CSV must contain a "label" column');
            return;
          }
          
          resolve(true);
        },
        error: (error) => {
          reject('Failed to parse CSV file');
        }
      });
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setValidationError('');
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Check file type
    if (!selectedFile.name.endsWith('.csv')) {
      setValidationError('Please select a CSV file');
      setFile(null);
      return;
    }

    // Validate CSV structure
    try {
      await validateCSV(selectedFile);
      setFile(selectedFile);
      setValidationError('');
    } catch (err) {
      setValidationError(err);
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await submissionAPI.upload(file);
      // Navigate to results page with submission data
      navigate('/result', { state: { submission: response.data.submission } });
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <h1 className="card-title">Upload Submission</h1>
        
        <div className="alert alert-info">
          <strong>Instructions:</strong>
          <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            <li>Upload a CSV file with your predictions</li>
            <li>File must contain "row_id" and "label" columns</li>
            <li>Predictions will be compared against the canonical answer set</li>
          </ul>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {validationError && (
          <div className="alert alert-error">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="form-input"
              disabled={loading}
            />
            {file && !validationError && (
              <small style={{ color: '#27ae60', marginTop: '0.5rem', display: 'block' }}>
                ✓ {file.name} - Valid CSV file
              </small>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !file || validationError}
          >
            {loading ? 'Uploading...' : 'Upload and Analyze'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;
