const databaseUtil = require('../utils/databaseUtil');
const User = require('../models/User');

const insertDataset = async (dataset) => {
    const data = {
        id: dataset.id,
        name: dataset.name,
        type: dataset.type,
        client_id: dataset.clientId,
        classes: dataset.classes,
        num_of_classes: dataset.numOfClasses,
        size: dataset.size,
        modified_date: dataset.modifiedDate,
        uploaded_date: dataset.uploadedDate,
        num_of_records: dataset.numOfRecords,
    };

    try {
        const result = await databaseUtil.insert('dataset', data);
        console.log('Dataset inserted:', result.insertId);
    } catch (err) {
        console.error('Error inserting dataset:', err);
    }
};

const getAllDatasets = async () => {
    try {
        const datasets = await databaseUtil.select('dataset');
        console.log('Datasets:', datasets);
        return datasets;
    } catch (err) {
        console.error('Error retrieving datasets:', err);
    }
};

const getAllDatasetsOfClient = async (clientId) => {
    try {
        const datasets = await databaseUtil.select('dataset', { client_id: clientId });
        console.log('Datasets for client:', clientId, datasets);
        return datasets;
    } catch (err) {
        console.error('Error retrieving datasets for client:', err);
    }
};

const getDatasetsOfAnnotator = async (annotatorId) => {
    try {
        const datasets = await databaseUtil.getDatasetsOfAnnotator(annotatorId);
        console.log('Datasets for annotator:', annotatorId, datasets);
        return datasets;
    } catch (err) {
        console.error('Error retrieving datasets for annotator:', err);
    }
};

const updateDataset = async (datasetId, updatedData) => {
    try {
        const result = await databaseUtil.update(
            'dataset',
            updatedData,
            { id: datasetId }
        );
        console.log('Dataset updated:', result);
    } catch (err) {
        console.error('Error updating dataset:', err);
    }
};

const getClassesOfDataset = async (datasetId) => {
    try {
        const dataset = await databaseUtil.select('dataset', { id: datasetId });
        console.log('Classes for dataset:', datasetId, dataset);
        return dataset[0].classes;
    } catch (err) {
        console.error('Error retrieving classes:', err);
    }
}

const deleteDataset = async (datasetId) => {
    try {
        const result = await databaseUtil.delete('dataset', { id: datasetId });
        console.log('Dataset deleted:', result);
    } catch (err) {
        console.error('Error deleting dataset:', err);
    }
};

const updateCompletionPercentage = async (datasetId) => {
    try {
        const result = await databaseUtil.updateCompletionPercent(datasetId);
        console.log('Completion percent of Dataset :', result);
    } catch (err) {
        console.error('Error fetching completion percent dataset:', err);
    }
}

const insertRecords = async (recordList) => {
    try {
        console.log(`Records to insert for dataset:`, recordList);
        const records = recordList.map((record) => ({
            id: record.id,
            dataset_id: record.dataset_id,
            annotator_id: record.annotator_id,
            name: record.name
        }));

        for (const record of records) {
            await databaseUtil.insert('record', record);
        }

        console.log(`Inserted ${records.length} records for dataset:`, recordList[0].dataset_id);
    } catch (err) {
        console.error('Error inserting records:', err);
    }
}

const updateRecord = async (datasetId, recordId, updatedData) => {
    try {
        const result = await databaseUtil.update(
            'record',
            updatedData,
            { dataset_id: datasetId, id: recordId }
        );
        console.log('Record updated:', result);
    } catch (err) {
        console.error('Error updating record:', err);
    }
};

const getRecord = async (recordId, datasetId) => {
    try {
        const records = await databaseUtil.select('record', { id: recordId, dataset_id: datasetId });
        console.log('Records for :', recordId, datasetId, records);
        return records;
    } catch (err) {
        console.error('Error retrieving records:', err);
    }
};

const getRecordsOfDataset = async (datasetId) => {
    try {
        const records = await databaseUtil.select('record', { dataset_id: datasetId });
        console.log('Records for :', datasetId, records);
        return records;
    } catch (err) {
        console.error('Error retrieving records:', err);
    }
}

const getRecordsOfAnnotator = async (datasetId, annotatorId) => {
    try {
        const records = await databaseUtil.select('record', { dataset_id: datasetId, annotator_id: annotatorId });
        console.log('Records for :', annotatorId, datasetId, records);
        return records;
    } catch (err) {
        console.error('Error retrieving records:', err);
    }
}

const insertAnnotator = async (annotator) => {
    const data = {
        id: annotator.id,
        name: annotator.name,
        dataset_id: annotator.dataset_id,
        created_on: annotator.created_on,
        assigned_record: annotator.assigned_record,
        completed_record: annotator.completed_record
    };

    try {
        const result = await databaseUtil.insert('annotator', data);
        console.log('Annotator inserted:', result.insertId);
    } catch (err) {
        console.error('Error inserting annotator:', err);
    }
};

const updateAnnotator = async (annotatorId, updatedData) => {
    try {
        const result = await databaseUtil.update(
            'annotator',
            updatedData,
            { id: annotatorId }
        );
        console.log('Annotator updated:', result);
    } catch (err) {
        console.error('Error updating annotator:', err);
    }
};

const getAnnotators = async () => {
    try {
        const annotators = await databaseUtil.select('user', { role: 'annotator' });
        console.log('Annotators:', annotators);
        return annotators;
    } catch (err) {
        console.error('Error retrieving annotators:', err);
    }
};

const getAnnotator = async (annotatorId) => {
    try {
        const annotators = await databaseUtil.select('annotator', { id: annotatorId });
        console.log('Annotators:', annotators);
        if (annotators.length === 0) {
            throw new Error(`Annotator with id ${annotatorId} not found`);
        }
        return annotators[0];
    } catch (err) {
        console.error('Error retrieving annotators:', err);
    }
}

const getAnnotatorsLinkedDataset = async () => {
    try {
        const annotators = await databaseUtil.select('annotator');
        console.log('Annotators linked dataset:', annotators);
        return annotators;
    } catch (err) {
        console.error('Error retrieving annotators:', err);
    }
}

const getLastAnnotatorIndex = async () => {
    try {
        const lastAnnotatorIndex = await databaseUtil.select('last_annotator_index_tracking');
        if (lastAnnotatorIndex.length === 0) {
            insertLastAnnotatorIndex(0);
            return 0;
        }
        return lastAnnotatorIndex[0].last_annotator_index;
    } catch (err) {
        console.error('Error retrieving annotators:', err);
    }
}

const insertLastAnnotatorIndex = async (index) => {
    try {
        await databaseUtil.insert('last_annotator_index_tracking', { id: 0, last_annotator_index: index });
    } catch (err) {
        console.error('Error inserting annotator:', err);
    }
}

const updateAnnotatorAssignedRecordCount = async () => {
    try {
        await databaseUtil.updateAnnotatorAssignedRecordsForDataset();
    } catch (err) {
        console.error("Error in updating annotator record counts:", err);
    }
};

const updateAnnotatorCompletedRecordCount = async (annotatorId, datasetId) => {
    try {
        await databaseUtil.updateAnnotatorCompletedRecordCount(annotatorId, datasetId);
    } catch (err) {
        console.error("Error in updating annotator record counts:", err);
    }
};

const insertUser = async (user) => {
    if (!(user instanceof User)) {
        console.error('Provided user is not an instance of User');
        console.log('Actual user object:', user);
        return;
    }

    const data = user.toDatabaseObject();

    try {
        const result = await databaseUtil.insert('user', data);
        console.log('User inserted:', result.insertId);
    } catch (err) {
        console.error('Error inserting user:', err);
    }
};

const findUserByUsername = async (username) => {
    try {
        const users = await databaseUtil.select('user', { username: username });
        return users.length > 0 ? users[0] : null;
    } catch (err) {
        console.error('Error:', err);
    }
};

const updateLastLogin = async (userId) => {
    try {
        const data = { last_login: new Date() };
        const where = { id: userId };
        await databaseUtil.update('user', data, where);
    } catch (err) {
        console.error('Error:', err);
    }
};

const getAnnotationsByDatasetId = async (datasetId) => {
    try {
        const records = await databaseUtil.getAnnotationsByDatasetId(datasetId);
        return records;
    } catch (err) {
        console.error('Error:', err);
    }
}

module.exports = {
    insertDataset,
    getAllDatasets,
    getAllDatasetsOfClient,
    getDatasetsOfAnnotator,
    updateDataset,
    deleteDataset,
    getClassesOfDataset,
    updateCompletionPercentage,

    insertRecords,
    updateRecord,
    getRecord,
    getRecordsOfDataset,
    getRecordsOfAnnotator,

    insertAnnotator,
    getAnnotators,
    getAnnotator,
    updateAnnotator,
    getAnnotatorsLinkedDataset,

    getLastAnnotatorIndex,
    insertLastAnnotatorIndex,

    updateAnnotatorAssignedRecordCount,
    updateAnnotatorCompletedRecordCount,

    insertUser,
    findUserByUsername,
    updateLastLogin,

    getAnnotationsByDatasetId
};