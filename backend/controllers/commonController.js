const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const Record = require('../models/Record');
const Dataset = require("../models/Dataset");
const fileHandler = require("../utils/fileHandler");
const databaseController = require("./databaseController");
const { generateMD5Hash } = require("../utils/commonUtil");

const assembledImagesDir = `assembled-images`;

const uploadZip = async (req, res) => {
    const { datasetId, type, clientId, classes, numOfClasses } = req.body;
    const zipFile = req.file;

    if (!zipFile) {
        return res.status(400).send({ error: "ZIP file is missing" });
    }

    if (!clientId) {
        return res.status(400).send({ error: "Missing clientId" });
    }

    try {
        const lastAnnotatorIndex = await databaseController.getLastAnnotatorIndex();
        console.log("Last annotator index:", lastAnnotatorIndex);

        const annotators = await databaseController.getAnnotators();
        const annotatorsLinkedDataset = await databaseController.getAnnotatorsLinkedDataset();

        // Create a temporary directory for the ZIP extraction
        const tempDir = path.join(__dirname, "uploads", datasetId);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const zipPath = path.join(tempDir, zipFile.originalname);
        fs.writeFileSync(zipPath, zipFile.buffer);

        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: tempDir }))
            .on("close", async () => {
                console.log("ZIP extraction completed.");

                const files = fs.readdirSync(tempDir);
                const records = [];

                let annotatorIndex = lastAnnotatorIndex;

                for (const fileName of files) {
                    if (fileName === zipFile.originalname) continue;
                    const filePath = path.join(tempDir, fileName);
                    console.log("Processing file:", fileName);

                    const recordId = generateMD5Hash(fileName);
                    const annotatorId = annotators.length === 0 ? null : annotators[annotatorIndex].id;
                    const record = new Record({
                        id: recordId,
                        name: fileName,
                        datasetId: datasetId,
                        annotatorId: annotatorId,
                    });

                    record.validate();
                    records.push(record.toDatabaseObject());

                    // await fileHandler.uploadFileInChunks(filePath, fileName, datasetId);
                    await fileHandler.uploadFile(filePath, fileName, datasetId, recordId);
                    
                    if (annotators.length > 0) {
                        let annotatorLinkedDatasetRow = null;
                        if (annotatorsLinkedDataset) {
                            annotatorLinkedDatasetRow = annotatorsLinkedDataset.find((row) => row.annotator_id === annotatorId && row.dataset_id === datasetId);
                        }
                        if (annotatorLinkedDatasetRow) {
                            annotatorLinkedDatasetRow.assigned_record++;
                            await databaseController.updateAnnotator(annotatorId, annotatorLinkedDatasetRow);
                        } else {
                            annotatorLinkedDatasetRow = {
                                id: annotatorId,
                                name: annotators[annotatorIndex].username,
                                dataset_id: datasetId,
                                created_on: new Date(),
                                assigned_record: 1,
                                completed_record: 0,
                            };
                            await databaseController.insertAnnotator(annotatorLinkedDatasetRow);
                        }

                        annotatorIndex = (annotatorIndex + 1) % annotators.length;
                    }
                }

                const dataset = new Dataset({
                    id: datasetId,
                    name: zipFile.originalname,
                    type: type,
                    clientId: clientId,
                    size: zipFile.size,
                    classes: classes,
                    numOfClasses: numOfClasses,
                    modifiedDate: new Date(),
                    uploadedDate: new Date(),
                    numOfRecords: files.length - 1,
                });

                try {
                    dataset.validate();
                    await databaseController.insertDataset(dataset);

                    await databaseController.insertRecords(records);

                    await databaseController.insertLastAnnotatorIndex(annotatorIndex);

                    await databaseController.updateAnnotatorAssignedRecordCount();

                    res.status(200).send({ message: "ZIP file uploaded and processed successfully" });
                } catch (err) {
                    res.status(500).send({ error: 'Failed to save dataset metadata' });
                } finally {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to process ZIP file" });
    }
};

// Function to view all records of a dataset with pagination
const fetchRecords = async (req, res) => {
    const { datasetId, annotatorId, page = 1, limit = 2 } = req.query;

    if (!datasetId) {
        return res.status(400).send({ error: "Missing datasetId" });
    }

    try {
        // const assembledFiles = await fileHandler.assembleChunkedFiles(datasetId);
        const assembledFiles = await fileHandler.assembleFiles(datasetId, annotatorId);

        const totalFiles = assembledFiles.length;
        const totalPages = Math.ceil(totalFiles / limit);

        const startIndex = (page - 1) * Number(limit);
        const endIndex = Math.min(startIndex + Number(limit), totalFiles);
        console.log("startIndex:", startIndex, "endIndex:", endIndex, "limit:", limit);
        const paginatedFiles = assembledFiles.slice(startIndex, endIndex);

        const recordItems = paginatedFiles.map((recordItem) => {
            const fileName = path.basename(recordItem.filePath);
            return {
                ...recordItem,
                filePath: `/${assembledImagesDir}/${datasetId}/${fileName}`,
            };
        });

        res.json({
            totalFiles,
            totalPages,
            currentPage: parseInt(page),
            data: recordItems,
        });
    } catch (err) {
        console.error("Error assembling files:", err);
        res.status(500).send({ error: "Failed to assemble the files" });
    }
};

const fetchDatasets = async (req, res) => {
    try {
        const { clientId, annotatorId } = req.query;

        let datasets;
        if (clientId) {
            datasets = await databaseController.getAllDatasetsOfClient(clientId);
        } else if (annotatorId) {
            datasets = await databaseController.getDatasetsOfAnnotator(annotatorId);
        } else {
            return res.status(400).send({ error: "Either clientId or annotatorId must be provided" });
        }

        res.json(datasets);
    } catch (err) {
        console.error("Error retrieving datasets:", err);
        res.status(500).send({ error: "Failed to retrieve datasets" });
    }
};

const setRecordInUse = async (req, res) => {
    const { datasetId, recordId, inUse } = req.body;
    try {
        const updatedData = { in_use: inUse };

        await databaseController.updateRecord(datasetId, recordId, updatedData);

        res.status(200).send({ message: 'Record successfully updated.' });
    } catch (err) {
        console.error('Error updating record:', err);
        res.status(500).send({ error: 'Failed to update record status.' });
    }
}

const isRecordInUse = async (req, res) => {
    const { datasetId, recordId } = req.query;

    try {
        const records = await databaseController.getRecord(recordId, datasetId);

        if (records.length === 0) {
            return res.status(404).send({ message: 'Record not found.' });
        }

        const record = records[0];
        const inUse = record.in_use;

        res.status(200).send({ inUse });
    } catch (err) {
        console.error('Error checking record status:', err);
        res.status(500).send({ error: 'Failed to check record status.' });
    }
};

const setAnnotations = async (req, res) => {
    const { datasetId, recordId, annotatorId, annotations } = req.body;
    try {
        const updatedData = { annotations: annotations };

        await databaseController.updateRecord(datasetId, recordId, updatedData);

        await databaseController.updateCompletionPercentage(datasetId);

        await databaseController.updateAnnotatorCompletedRecordCount(annotatorId, datasetId);

        res.status(200).send({ message: 'Annotations successfully updated.' });
    } catch (err) {
        console.error('Error updating annotations:', err);
        res.status(500).send({ error: 'Failed to update annotations.' });
    }
}

const fetchClasses = async (req, res) => {
    try {
        const datasetId = req.query.datasetId;
        const classes = await databaseController.getClassesOfDataset(datasetId);
        console.log("Fetched classes:", classes);
        res.status(200).send({ data: classes });
    } catch (err) {
        console.error("Error retrieving classes:", err);
        res.status(500).send({ error: "Failed to retrieve classes" });
    }
};

const fetchAnnotationsByDatasetId = async (req, res) => {
    try {
        const datasetId = req.query.datasetId;
        const records = await databaseController.getAnnotationsByDatasetId(datasetId);
        console.log("Fetched records:", records);
        res.status(200).send({ data: records });
    } catch (err) {
        console.error("Error retrieving records:", err);
        res.status(500).send({ error: "Failed to retrieve records" });
    }
}

module.exports = {
    uploadZip,
    fetchRecords,
    fetchDatasets,
    fetchClasses,
    setRecordInUse,
    isRecordInUse,
    setAnnotations,
    fetchAnnotationsByDatasetId
};