const express = require('express');
const router = express.Router();
const { authenticate } = require('../controllers/authController');
const commonController = require('../controllers/commonController');

router.get('/', (req, res) => {
    res.send('Server working!');
});

// Route to upload a zip file
router.post('/upload-zip', authenticate, commonController.uploadZip);

// Route to get all datasets given client ID or annotator ID
router.get('/fetch-datasets', authenticate, commonController.fetchDatasets);

// Route to view all records in a dataset given the dataset ID and annotator ID (optional)
router.get('/fetch-records', authenticate, commonController.fetchRecords);

// Route to get all classes of a dataset given the dataset ID
router.get('/fetch-classes', authenticate, commonController.fetchClasses);

// Route to set record in use or not in use, given the dataset ID, record ID, and inUse boolean
router.post('/set-record-in-use', authenticate, commonController.setRecordInUse);

// Route to check if a record is in use, given the dataset ID and record ID
router.get('/is-record-in-use', authenticate, commonController.isRecordInUse);

// Route to set annotations for a record, given the dataset ID, record ID, annotator ID, and annotations
router.post('/set-annotations', authenticate, commonController.setAnnotations);

// Route to get annotations, given the dataset ID
router.get('/fetch-annotations', authenticate, commonController.fetchAnnotationsByDatasetId);

module.exports = router;