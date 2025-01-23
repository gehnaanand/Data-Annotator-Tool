class Annotator {
    constructor({
        id,
        name,
        datasetId,
        createdOn,
        assignedRecord = 0,
        completedRecord = 0,
    }) {
        this.id = id;
        this.name = name;
        this.datasetId = datasetId;
        this.createdOn = createdOn;
        this.assignedRecord = assignedRecord;
        this.completedRecord = completedRecord;
    }

    /**
     * Converts the Annotator object to a plain object for database insertion.
     * @returns {Object} A plain object representation of the annotator.
     */
    toDatabaseObject() {
        return {
            id: this.id,
            name: this.name,
            dataset_id: this.datasetId,
            created_on: this.createdOn,
            assigned_record: this.assignedRecord,
            completed_record: this.completedRecord,
        };
    }

    /**
     * Validates the annotator fields. Throws an error if any required field is missing.
     */
    validate() {
        if (!this.id || !this.name || !this.datasetId || !this.createdOn) {
            throw new Error("Missing required annotator fields.");
        }
    }
}

module.exports = Annotator;