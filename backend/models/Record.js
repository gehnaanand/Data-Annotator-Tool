class Record {
    constructor({ id, datasetId, annotatorId = null, name = null }) {
        this.id = id;
        this.datasetId = datasetId;
        this.annotatorId = annotatorId;
        this.name = name;
    }

    /**
     * Converts the Record object to a plain object for database insertion.
     * @returns {Object} A plain object representation of the record.
     */
    toDatabaseObject() {
        return {
            id: this.id,
            dataset_id: this.datasetId,
            annotator_id: this.annotatorId,
            name: this.name,
        };
    }

    /**
     * Validates the record fields. Throws an error if any required field is missing.
     */
    validate() {
        if (!this.id || !this.datasetId) {
            throw new Error("Missing required record fields: id and datasetId are mandatory.");
        }
    }
}

module.exports = Record;  