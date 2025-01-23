import React, { useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import "../fileUpload.css";

const FileUploader = ({ clientId, token, role }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [datasetType, setDatasetType] = useState("image");
  const [classes, setClasses] = useState("");
  const [error, setError] = useState('');

  const generateMD5Hash = (fileName) => {
    return CryptoJS.MD5(fileName).toString();
  };

  const handleFileChange = (e) => {
    setProgress(0);
    setMessage("");
    setError("");
    setFile(null);

    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.zip')) {
      setFile(selectedFile);  
    } else {
      setError('Please select a valid ZIP file.'); 
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage("");

    const datasetId = generateMD5Hash(file.name + clientId);
    setDatasetId(datasetId);
    const formData = new FormData();
    formData.append("zipFile", file);
    formData.append("datasetId", datasetId);
    formData.append("clientId", clientId);
    formData.append("type", datasetType);
    formData.append("classes", classes);
    formData.append("numOfClasses", classes.split(",").filter((c) => c.trim() !== "").length);

    // const totalDuration = 10000; // 10 seconds  - // Comment
    // const interval = 100; // 100ms intervals - // Comment
    // let elapsed = 0; // Comment

    // Comment
    // const timer = setInterval(() => {
    //   elapsed += interval;
    //   const simulatedProgress = Math.min((elapsed / totalDuration) * 100, 100);
    //   setProgress(simulatedProgress);
    //   if (simulatedProgress === 100) {
    //     setMessage("File uploaded successfully");
    //     clearInterval(timer);
    //   }
    // }, interval);

    try {
      // const uploadStartTime = Date.now(); // Comment
      await axios.post(`${process.env.REACT_APP_SERVER_HOST}/api/upload-zip`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (progressEvent) => {
          setProgress((progressEvent.loaded / progressEvent.total) * 100);
        },
      });

      // const uploadEndTime = Date.now(); // Comment
      // const uploadDuration = uploadEndTime - uploadStartTime; // Comment

      // const remainingTime = Math.max(totalDuration - uploadDuration, 0); // Comment
      // await new Promise((resolve) => setTimeout(resolve, remainingTime)); // Comment

      setMessage("File uploaded successfully"); 
    } catch (error) {
      console.error(error);
      // clearInterval(timer);
      setProgress(0);
      setMessage("Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const fetchAssembledFiles = async (page = 1) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_HOST}/api/fetch-records`, {
        params: { datasetId, page, limit: 2 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const { totalFiles, totalPages, currentPage, data } = response.data;
      const files = data.map((recordItem) => recordItem.filePath);
      setImageUrls(files);
      setTotalPages(totalPages);
      setCurrentPage(currentPage);
    } catch (error) {
      console.error("Error fetching the assembled files:", error);
      setMessage("Failed to fetch assembled files.");
    }
  };

  const loadNextPage = () => {
    if (currentPage < totalPages) {
      fetchAssembledFiles(currentPage + 1);
    }
  };

  const loadPreviousPage = () => {
    if (currentPage > 1) {
      fetchAssembledFiles(currentPage - 1);
    }
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-card">
        <h2>Upload Zip file</h2>
        <div className="file-input-container">
          <label htmlFor="file-upload" className="custom-file-upload">
            Choose File
          </label>
          <input
            id="file-upload"
            type="file"
            className="file-input"
            onChange={handleFileChange}
          />
          {file && <span className="file-name">{file.name}</span>}
          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
        </div>
        <div>
          <label htmlFor="datasetType">Select Dataset Type:</label>
          <select
            id="datasetType"
            value={datasetType}
            onChange={(e) => setDatasetType(e.target.value)}
          >
            <option value="image">Image</option>
            <option value="text">Text</option>
          </select>
        </div>
        <div>
          <label htmlFor="classes">Classes (comma-separated):</label>
          <input
            type="text"
            id="classes"
            value={classes}
            onChange={(e) => setClasses(e.target.value)}
            placeholder="e.g., cat,dog,bird"
          />
        </div>
        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {message && <p>{message}</p>}

        {/* {!uploading && datasetId && (
          <button className="upload-button" onClick={() => fetchAssembledFiles(1)}>
            View Images
          </button>
        )}
        {imageUrls.length > 0 && (
          <div>
            <h2>Uploaded Images:</h2>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {imageUrls.map((fileUrl, index) => (
                <div key={index} style={{ margin: "10px" }}>
                  <img
                    src={`${process.env.REACT_APP_SERVER_HOST}${fileUrl}`}
                    alt={`Image ${index + 1}`}
                    style={{ width: "200px", maxWidth: "100%" }}
                  />
                </div>
              ))}
            </div>
            <div>
              <button
                onClick={loadPreviousPage}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={loadNextPage}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default FileUploader;