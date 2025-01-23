import React, { useState } from "react";
import "./fileUpload.css";

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setUploadProgress(0); // Reset progress when a new file is selected
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        setIsUploading(true);
        console.log("Uploading file:", file.name);

        try {
            // Simulate an upload process (Replace this with your actual upload logic)
            const fakeUpload = new Promise((resolve) => {
                const interval = setInterval(() => {
                    setUploadProgress((prev) => {
                        if (prev >= 100) {
                            clearInterval(interval);
                            resolve();
                            return prev;
                        }
                        return prev + 10; // Increment progress by 10% (simulate upload)
                    });
                }, 200); // Update every 200ms
            });

            await fakeUpload;

            setIsUploading(false);
            alert("Upload complete!");
        } catch (error) {
            console.error("Upload failed:", error);
            setIsUploading(false);
            alert("Upload failed. Please try again.");
        }
    };

    return (
        <div className="file-upload-container">
            <div className="file-upload-card">
                <h2>Upload Your File</h2>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="file-input"
                />
                {file && <p className="file-name">{file.name}</p>}

                {/* Progress Bar */}
                {isUploading && (
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    className="upload-button"
                    disabled={isUploading}
                >
                    {isUploading ? "Uploading..." : "Upload"}
                </button>
            </div>
        </div>
    );
};

export default FileUpload;
