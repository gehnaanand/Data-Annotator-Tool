import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ clientId, token, role }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        if (!clientId) {
          throw new Error("Client ID is missing");
        }

        let response = null;
        if (role == 'annotator') {
          response = await axios.get(`${process.env.REACT_APP_SERVER_HOST}/api/fetch-datasets`, {
            params: { annotatorId: clientId }, headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` },
          });
          setDatasets(response.data);
        }
        else {
          response = await axios.get(`${process.env.REACT_APP_SERVER_HOST}/api/fetch-datasets`, {
            params: { clientId: clientId }, headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` },
          });
          setDatasets(response.data);
        }
      } catch (err) {
        console.error("Error fetching datasets:", err);
        setError("Failed to fetch datasets");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [clientId]);

  const handleDatasetClick = (id) => {
    navigate(`/annotator/${id}`);
  };

  const jsonToCsv = (json) => {
    const headers = ["id", "annotations"];
    const rows = json.data.map((item) => [item.id, item.annotations || "null"]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    return csvContent;
  };

  const downloadAnnotations = async (datasetId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_HOST}/api/fetch-annotations`, {
        params: { datasetId: datasetId },
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });

      const csvContent = jsonToCsv(response.data);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = `annotations_${datasetId}.csv`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading annotations:", error);
      setError("Failed to download annotations");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.dashboardContainer}>
      <h1 style={styles.title}> Dashboard</h1>
      <table style={styles.table}>
        <thead>
          {role === "annotator" ? (
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Annotator ID</th>
              <th style={styles.headerCell}>Name</th>
              <th style={styles.headerCell}>Dataset ID</th>
              <th style={styles.headerCell}>Created On</th>
              <th style={styles.headerCell}>Assigned Records</th>
              <th style={styles.headerCell}>Completed Records</th>
            </tr>
          ) : (
            <tr style={styles.headerRow}>
              <th style={styles.headerCell}>Dataset ID</th>
              <th style={styles.headerCell}>Name</th>
              <th style={styles.headerCell}>Data Type</th>
              <th style={styles.headerCell}>No. of Records</th>
              <th style={styles.headerCell}>Uploaded Date</th>
              <th style={styles.headerCell}>Completion</th>
            </tr>
          )}
        </thead>
        <tbody>
          {datasets.map((item) => (
            <tr
              key={item.id}
              style={styles.dataRow}
              onClick={() => handleDatasetClick(role === "annotator" ? item.dataset_id : item.id)}
            >
              {role === "annotator" ? (
                <>
                  <td style={styles.dataCell}>{item.id}</td>
                  <td style={styles.dataCell}>{item.name}</td>
                  <td style={styles.dataCell}>{item.dataset_id}</td>
                  <td style={styles.dataCell}>{new Date(item.created_on).toLocaleDateString("en-US")}</td>
                  <td style={styles.dataCell}>{item.assigned_record}</td>
                  <td style={styles.dataCell}>{item.completed_record}</td>
                </>
              ) : (
                <>
                  <td style={styles.dataCell}>{item.id}</td>
                  <td style={styles.dataCell}>{item.name}</td>
                  <td style={styles.dataCell}>{item.type}</td>
                  <td style={styles.dataCell}>{item.num_of_records}</td>
                  <td style={styles.dataCell}>{new Date(item.uploaded_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</td>
                  <td style={styles.dataCell}>{`${item.completion_percent !== null ? parseInt(item.completion_percent, 10) : 0}%`}</td>
                  <td style={styles.dataCell}>
                    <button onClick={() => downloadAnnotations(item.id)} style={styles.downloadButton}>
                      Download Annotation
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "'Arial', sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
  },
  headerRow: {
    backgroundColor: "#f7f7f7",
  },
  headerCell: {
    textAlign: "left",
    padding: "10px",
    fontWeight: "bold",
    fontSize: "14px",
    color: "#555",
  },
  dataRow: {
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  dataCell: {
    padding: "10px",
    fontSize: "14px",
    color: "#333",
    borderBottom: "1px solid #eee",
  },
  downloadButton: {
    padding: "5px 10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Dashboard;
