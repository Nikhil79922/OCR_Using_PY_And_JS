import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [containerHeight, setContainerHeight] = useState('0px');
  const [copySuccess, setCopySuccess] = useState(false); // Copy success message state
  const contentRef = useRef(null); // Ref for extracted data content

  // Handle file drop
  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  // File upload handler
  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setExtractedData(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // React Dropzone options
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: '.png, .jpg, .jpeg, .pdf',
    maxFiles: 1,
    multiple: false,
  });

  // Update container height when extracted data changes
  useEffect(() => {
    const adjustHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        // Adding extra space to ensure all content fits
        setContainerHeight(`${height + 120}px`); 
      } else {
        setContainerHeight('0px');
      }
    };
  
    // Using a small delay to ensure rendering is complete
    const timeout = setTimeout(adjustHeight, 50);
  
    return () => clearTimeout(timeout);
  }, [extractedData]);


  // Copy extracted data to clipboard
  const copyToClipboard = () => {
    const dataToCopy = JSON.stringify(extractedData, null, 2); // Format data as readable JSON
    navigator.clipboard.writeText(dataToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset success message after 2 seconds
    });
  };

  // Function to display extracted data
  const renderExtractedData = () => {
    if (!extractedData) {
      return <p style={{ fontSize: '16px', color: '#777', textAlign: 'center' }}>No data extracted yet.</p>;
    }

    return (
      <div ref={contentRef}>
        {Object.keys(extractedData).map((key) => (
          <div key={key} style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#ff5722' }}>{key}:</strong>
            <p>{extractedData[key]}</p>
          </div>
        ))}
        <button
          onClick={copyToClipboard}
          style={{
            backgroundColor: '#ff5722',
            color: '#fff',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <lord-icon
            src="https://cdn.lordicon.com/rwtswsap.json"
            trigger="click"
            style={{ width: '20px', height: '20px' }}
          />
        </button>
        {copySuccess && <p style={{ color: '#4caf50', marginTop: '10px' }}>Text Copied!</p>}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: 'url("https://your-image-url.com/metal-background.jpg")', // Replace with your background image URL
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div
        className="flex gap-8 items-start"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '16px',
          maxWidth: '1200px',
          width: '100%',
          padding: '16px',
        }}
      >
        {/* Upload Box */}
        <div
          className="bg-gray-800 rounded-lg shadow-lg p-6"
          style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '12px',
            padding: '24px',
            border: '2px solid #444',
            background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h1
            className="text-center font-bold mb-6 text-gray-200"
            style={{ fontSize: '24px', marginBottom: '16px' }}
          >
            Upload Invoice
          </h1>

          <div
            {...getRootProps()}
            className="drag-area"
            style={{
              border: '2px dashed #888',
              backgroundColor: '#333',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '16px',
              boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.3s ease-in-out',
              color: '#ccc',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <input {...getInputProps()} />
            {!file ? (
              <div>
                <p style={{ fontSize: '16px', color: '#aaa', marginBottom: '8px' }}>Drag and drop here</p>
                <p style={{ fontSize: '14px', color: '#777' }}>or click to upload</p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '16px', color: '#bbb' }}>{file.name}</p>
                <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>File selected</p>
              </div>
            )}
          </div>

          <button
            onClick={handleFileUpload}
            disabled={!file}
            style={{
              width: '100%',
              backgroundColor: file ? '#ff5722' : '#666',
              color: '#FFF',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              cursor: file ? 'pointer' : 'not-allowed',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
              transition: 'background-color 0.3s ease, transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Upload & Process
          </button>
        </div>

        {/* Extracted Data Box */}
        <div
          className="bg-gray-800 rounded-lg shadow-lg p-6"
          style={{
            width: '100%',
            maxWidth: '500px',
            borderRadius: '12px',
            padding: '24px',
            border: '2px solid #444',
            background: 'linear-gradient(145deg, #2a2a2a, #1f1f1f)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            height: extractedData ? containerHeight : '130px', // 150px height when no data
            transition: 'height 1.5s ease', // Smooth height transition
          }}
        >
          <h1
            className="text-center font-bold mb-6 text-gray-200"
            style={{ fontSize: '24px', marginBottom: '16px' }}
          >
            Extracted Data
          </h1>
          {renderExtractedData()}
        </div>
      </div>
    </div>
  );
}

export default App;
