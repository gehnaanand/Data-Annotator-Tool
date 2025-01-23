import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Stage, Layer, Rect } from "react-konva";
import axios from "axios";

const AnnotationTool = ({ clientId, token, role }) => {
  const { datasetId } = useParams(); // Get dataset ID from URL
  const navigate = useNavigate();
  const [datasetImages, setDatasetImages] = useState([])
  const [annotations, setAnnotations] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newAnnotation, setNewAnnotation] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  //   const clientId = 'abcd5678'; // Hardcoded client ID for now
  const limit = 10; // Number of records to fetch per page
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [imageLocked, setImageLocked] = useState(0);
  const [currentImage, setCurrentImage] = useState(null);


  const fetchImages = async (page = 1) => {
    setLoading(true);
    try {
      let response = null;
      if (role == 'annotator') {
        response = await axios.get(
          `${process.env.REACT_APP_SERVER_HOST}/api/fetch-records?datasetId=${datasetId}&annotatorId=${clientId}&page=${page}&limit=${limit}`,
          { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } }
        );
      } else {
        response = await axios.get(
          `${process.env.REACT_APP_SERVER_HOST}/api/fetch-records?datasetId=${datasetId}&client=${clientId}&page=${page}&limit=${limit}`,
          { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } }
        );
      }
      const { data, totalPages } = response.data;
      let images = [];
      for (let i = 0; i < data.length; i++) {

        let fp = data[i].filePath;
        const id = data[i].id
        // concatenate fp with the base URL
        fp = `${process.env.REACT_APP_SERVER_HOST}${fp}`;
        images.push([id, fp]);
      }
      console.log(images)
      setDatasetImages(images); // Update images
      setTotalPages(totalPages); // Total pages for pagination
      setLoading(false);
    } catch (error) {
      console.error("Error fetching images:", error);
      setLoading(false);
    }
  };
  const fetchClasses = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_HOST}/api/fetch-classes?datasetId=${datasetId}`, { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } })
      let { data } = response.data;
      //converting string to array
      data = data.split(',')
      setClasses(data);
    }
    catch (error) {
      console.log("Error fetching classes:", error);
    }
  };

  const checkImageLock = async (rId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SERVER_HOST}/api/is-record-in-use?datasetId=${datasetId}&recordId=${rId}`,
        { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } }
      );
      if (response.data.isUse === 1) {
        alert("This image is locked by another annotator");
        return false;
      } else {
        const body = {
          recordId: rId,
          datasetId: datasetId,
          inUse: 1, // Set inUse to true to indicate locking
        };

        await axios.post(`${process.env.REACT_APP_SERVER_HOST}/api/set-record-in-use`, body, { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } });
        setImageLocked(response.data.isUse);
        return true;
      }
    } catch (error) {
      console.error("Error checking image lock:", error);
    }
  };


  const getCurrentImage = async () => {
    const currentRecord = datasetImages[currentImageIndex];
    if (!currentRecord) return;
    const [rId, imageUrl] = currentRecord;

    const isLockValid = await checkImageLock(rId);
    if (isLockValid) {
      setCurrentImage(imageUrl);
    } else {
      setCurrentImage(null);
    }
  };

  useEffect(() => {
    fetchImages(currentPage); // Fetch images on component mount or page change
    fetchClasses();
  }, [currentPage, datasetId]);

  useEffect(() => {
    getCurrentImage();
  }, [currentImageIndex, datasetImages]);
  //   const currentImage = datasetImages[currentImageIndex];

  const handleMouseDown = (e) => {
    if (!selectedClass) {
      alert("Please select a class before drawing!");
      return;
    }
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewAnnotation({ x, y, width: 0, height: 0, className: selectedClass });
  };

  const handleMouseMove = (e) => {
    if (!newAnnotation) return;
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewAnnotation((prev) => ({
      ...prev,
      width: x - prev.x,
      height: y - prev.y,
    }));
  };

  const handleMouseUp = () => {
    if (newAnnotation) {
      const updatedAnnotations = { ...annotations };
      const imageAnnotations = updatedAnnotations[currentImage] || [];
      updatedAnnotations[currentImage] = [...imageAnnotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      setNewAnnotation(null);
    }
  };

  const handleNext = async () => {

    const currentRecord = datasetImages[currentImageIndex];
    if (!currentRecord) return;
    const [rId, imageUrl] = currentRecord;

    const body = {
      recordId: rId,
      datasetId: datasetId,
      inUse: 0, // Set inUse to true to indicate locking
    };

    await axios.post(`${process.env.REACT_APP_SERVER_HOST}/api/set-record-in-use`, body, { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } });

    setCurrentImageIndex((prev) => (prev + 1) % datasetImages.length);
    setCurrentImage(datasetImages[currentImageIndex][1]);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + datasetImages.length) % datasetImages.length);
    setCurrentImage(datasetImages[currentImageIndex][1]);
  };

  const saveAnnotations = async () => {
    const currentRecord = datasetImages[currentImageIndex];
    if (!currentRecord) return;
    const [rId, imageUrl] = currentRecord;

    // send annotations as json

    const tempAnnotations = JSON.stringify(annotations[currentImage]);
    console.log("Annotations:", tempAnnotations);
    const body = {
      recordId: rId,
      datasetId: datasetId,
      annotatorId: clientId,
      annotations: tempAnnotations,
    };

    await axios.post(`${process.env.REACT_APP_SERVER_HOST}/api/set-annotations`, body, { headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` } });

    alert("Annotations saved successfully!");
    // Add API call logic here to save annotations to a server.
  };

  return (
    clientId ? (
      <div style={styles.container}>
        {/* Sidebar for Classes */}
        <div style={styles.sidebar}>
          <h3>Classes</h3>
          <ul style={styles.classList}>
            {classes.map((cls) => (
              <li
                key={cls}
                style={{
                  ...styles.classItem,
                  backgroundColor: cls === selectedClass ? "#3498db" : "#ecf0f1",
                }}
                onClick={() => setSelectedClass(cls)}
              >
                {cls}
              </li>
            ))}
          </ul>
        </div>

        {/* Annotation Tool */}
        <div style={styles.annotationContainer}>
          <h1>Dataset {datasetId}</h1>
          <div style={styles.imageContainer}>
            <img
              src={currentImage}
              alt={`Dataset ${datasetId}`}
              style={styles.image}
            />
            <Stage
              width={800}
              height={600}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <Layer>
                {(annotations[currentImage] || []).map((rect, i) => (
                  <Rect
                    key={i}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    stroke="red"
                  />
                ))}
                {newAnnotation && (
                  <Rect
                    x={newAnnotation.x}
                    y={newAnnotation.y}
                    width={newAnnotation.width}
                    height={newAnnotation.height}
                    stroke="blue"
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>
        <div>
          <div>
            <button onClick={handlePrevious} disabled={currentImageIndex === 0}>
              Previous
            </button>
            <button onClick={handleNext}>Next</button>
            <button onClick={saveAnnotations}>Save Annotations</button>
          </div>
        </div>
      </div>
    ) : (
      <h1>Please login to access the annotation tool</h1>
    )
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
  },
  sidebar: {
    width: "200px",
    backgroundColor: "#34495e",
    color: "#ecf0f1",
    padding: "1rem",
    overflowY: "auto",
  },
  classList: {
    listStyle: "none",
    padding: 0,
  },
  classItem: {
    padding: "0.5rem",
    marginBottom: "0.5rem",
    cursor: "pointer",
    borderRadius: "4px",
    textAlign: "center",
    color: "black",
  },
  annotationContainer: {
    flex: 1,
    padding: "1rem",
  },
  imageContainer: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    width: "100%",
    backgroundColor: "#f4f4f4",
  },
  image: {
    width: "500px",
    height: "400px",
    objectFit: "cover",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
};

export default AnnotationTool;
