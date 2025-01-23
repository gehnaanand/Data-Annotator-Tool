class User {
    constructor({ id, username, passwordHash, createdDate, lastLogin = null, role = 'client' }) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.createdDate = createdDate;
        this.lastLogin = lastLogin;
        this.role = role;
    }

    /**
     * Converts the User object to a plain object for database insertion.
     * @returns {Object} A plain object representation of the user.
     */
    toDatabaseObject() {
        return {
            id: this.id,
            username: this.username,
            password_hash: this.passwordHash,
            created_date: this.createdDate,
            last_login: this.lastLogin,
            role: this.role,
        };
    }

    /**
     * Validates the user fields. Throws an error if any required field is missing.
     */
    validate() {
        if (!this.id || !this.username || !this.passwordHash || !this.createdDate) {
            throw new Error("Missing required user fields: id, username, passwordHash, and createdDate are mandatory.");
        }
    }
}

module.exports = User;