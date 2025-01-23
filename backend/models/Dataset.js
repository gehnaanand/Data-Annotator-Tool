class Dataset {
    constructor({
        id,
        name,
        type,
        clientId,
        classes = null,
        numOfClasses = 0,
        size,
        modifiedDate,
        uploadedDate,
        numOfRecords = 0,
        completionPercentage = 0,  
    }) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.clientId = clientId;
        this.classes = classes;
        this.numOfClasses = numOfClasses;
        this.size = size;
        this.modifiedDate = modifiedDate;
        this.uploadedDate = uploadedDate;
        this.numOfRecords = numOfRecords;
        this.completionPercentage = completionPercentage;  
    }

    /**
     * Converts the Dataset object to a plain object for database insertion.
     * @returns {Object} A plain object representation of the dataset.
     */
    toDatabaseObject() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            client_id: this.clientId,
            classes: this.classes,
            num_of_classes: this.numOfClasses,
            size: this.size,
            modified_date: this.modifiedDate,
            uploaded_date: this.uploadedDate,
            num_of_records: this.numOfRecords,
            completion_percentage: this.completionPercentage
        };
    }

    /**
     * Validates the dataset fields. Throws an error if any required field is missing.
     */
    validate() {
        if (!this.id || !this.name || !this.type || !this.clientId || !this.size) {
            throw new Error("Missing required dataset fields.");
        }
    }
}

module.exports = Dataset;