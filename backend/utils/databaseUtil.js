const mysql = require('mysql2');
require('dotenv').config();

class DatabaseUtil {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        this.promisePool = this.pool.promise();
    }

    /**
     * Execute a query with parameters.
     * @param {string} query - The SQL query string.
     * @param {Array} params - Array of parameters for the query.
     * @returns {Promise<Object>} - The query result.
     */
    async executeQuery(query, params = []) {
        try {
            const [results] = await this.promisePool.query(query, params);
            return results;
        } catch (err) {
            console.error('Database query error:', err);
            throw err;
        }
    }

    /**
     * Insert a record into a table.
     * @param {string} table - The table name.
     * @param {Object} data - The data to insert as key-value pairs.
     * @returns {Promise<Object>} - The insertion result.
     */
    async insert(table, data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const updateClause = Object.keys(data)
            .map((col) => `${col} = VALUES(${col})`)
            .join(', ');

        const query = `
            INSERT INTO ${table} (${columns}) 
            VALUES (${placeholders})
            ON DUPLICATE KEY UPDATE ${updateClause};
        `;

        return this.executeQuery(query, values);
    }


    /**
     * Update a record in a table.
     * @param {string} table - The table name.
     * @param {Object} data - The data to update as key-value pairs.
     * @param {Object} where - The conditions for the update as key-value pairs.
     * @returns {Promise<Object>} - The update result.
     */
    async update(table, data, where) {
        const setClause = Object.keys(data).map((key) => `${key} = ?`).join(', ');
        const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');
        const values = [...Object.values(data), ...Object.values(where)];

        const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        return this.executeQuery(query, values);
    }

    /**
     * Retrieve records from a table.
     * @param {string} table - The table name.
     * @param {Object} [where] - The conditions for the retrieval as key-value pairs.
     * @returns {Promise<Array>} - The retrieved records.
     */
    async select(table, where = {}) {
        const whereClause = Object.keys(where)
            .map((key) => `${key} = ?`)
            .join(' AND ');
        const query = `SELECT * FROM ${table}${whereClause ? ` WHERE ${whereClause}` : ''}`;
        return this.executeQuery(query, Object.values(where));
    }

    /**
     * Delete records from a table.
     * @param {string} table - The table name.
     * @param {Object} where - The conditions for the deletion as key-value pairs.
     * @returns {Promise<Object>} - The deletion result.
     */
    async delete(table, where) {
        const whereClause = Object.keys(where).map((key) => `${key} = ?`).join(' AND ');
        const query = `DELETE FROM ${table} WHERE ${whereClause}`;
        return this.executeQuery(query, Object.values(where));
    }

    async updateAnnotatorAssignedRecordsForDataset() {
        const query = `
            WITH annotator_counts AS (
                SELECT annotator_id, dataset_id, COUNT(*) AS records_assigned
                FROM record
                GROUP BY annotator_id, dataset_id
            )
            
            UPDATE annotator
            SET assigned_record = (
                SELECT records_assigned
                FROM annotator_counts
                WHERE annotator_counts.annotator_id = annotator.id
                  AND annotator_counts.dataset_id = annotator.dataset_id
            )
            WHERE EXISTS (
                SELECT 1
                FROM annotator_counts
                WHERE annotator_counts.annotator_id = annotator.id
                  AND annotator_counts.dataset_id = annotator.dataset_id
            );
        `;

        return this.executeQuery(query);
    }

    async updateAnnotatorCompletedRecordCount(annotatorId, datasetId) {
        const query = `
            WITH completed_records AS (
                SELECT annotator_id, dataset_id, COUNT(*) AS completed_count
                FROM record
                WHERE annotator_id = ?
                  AND dataset_id = ?
                  AND annotations IS NOT NULL
                  AND TRIM(annotations) != '' 
                GROUP BY annotator_id, dataset_id
            )
            UPDATE annotator
            SET completed_record = (
                SELECT completed_count
                FROM completed_records
                WHERE completed_records.annotator_id = annotator.id
                  AND completed_records.dataset_id = annotator.dataset_id
            )
            WHERE annotator.id = ?
              AND annotator.dataset_id = ?;
        `;
        return this.executeQuery(query, [annotatorId, datasetId, annotatorId, datasetId]);
    }

    async getDatasetsOfAnnotator(annotatorId) {
        const query = `
            SELECT
                annotator.*
            FROM
                annotator
            WHERE
                annotator.id = ?;
        `;
        return this.executeQuery(query, [annotatorId]);
    }    

    async getAnnotatorsAndDataset() {
        const query = `
            SELECT 
                a.id,
                a.name,
                a.dataset_id,
                a.created_on,
                a.assigned_record,
                a.completed_record
            FROM 
                user u
            LEFT JOIN 
                annotator a ON u.id = a.id
            WHERE 
                u.role = 'annotator'
            ORDER BY 
                u.created_date ASC;
        `;
        return this.executeQuery(query);
    }

    async updateCompletionPercent(datasetId) {
        const query = `
            UPDATE dataset d
            JOIN (
                SELECT 
                    dataset_id,
                    (SUM(CASE WHEN annotations IS NOT NULL AND TRIM(annotations) != '' THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS completion_percentage
                FROM 
                    record
                WHERE dataset_id = ?
                GROUP BY 
                    dataset_id
            ) r ON d.id = r.dataset_id
            SET d.completion_percent = r.completion_percentage
            WHERE d.id = ?;
        `;
        return this.executeQuery(query, [datasetId, datasetId]);
    }    

    async getAnnotationsByDatasetId(datasetId) {
        const query = `
            SELECT id, annotations
            FROM record
            WHERE dataset_id = ?;
        `;
        return this.executeQuery(query, [datasetId]);
    }
    
}

module.exports = new DatabaseUtil();