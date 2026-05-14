const oracledb = require('oracledb');
require('dotenv').config();

// Attempt to use Thick mode if needed for older Oracle versions, but Thin mode is default in oracledb 6.x
try {
    oracledb.initOracleClient(); // Depending on environment, might be needed. Usually Thin mode is enough.
} catch (err) {
    console.error('Whoops!', err);
}

// Ensure the driver returns rows as objects instead of arrays
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// And auto-commit for our simple CRUD operations
oracledb.autoCommit = true;

const dbConfig = {
    user: process.env.DB_USER || 'system',
    password: process.env.DB_PASSWORD || 'sqldbms',
    // Change xe/orcl/xepdb1 based on whatever user's actual setup is (usually xe for local Express Edition)
    connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/xe',
};

async function executeQuery(sql, binds = [], options = {}) {
    let connection;
    try {
        // CONNECTION
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(sql, binds, options);
        return result.rows;
    } catch (err) {
        if (err.errorNum !== 942) {
            console.error('Database execution error:', err);
        }
        throw err;
    } finally {
        if (connection) {
            try {
                // Connections should always be released when not needed
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

async function executeUpdate(sql, binds = [], options = {}) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(sql, binds, options);
        return result; // For inserts/updates, we might care about rowsAffected
    } catch (err) {
        console.error('Database update error:', err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

module.exports = {
    executeQuery,
    executeUpdate
};
