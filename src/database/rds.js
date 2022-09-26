require('dotenv').config();
const { Pool } = require('pg');

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

console.log('Logging into RDS...');
const pool = new Pool(config);
console.log('Logged into RDS.');

async function query(q, params) {
    const response = await pool.query(q, params).catch((e) => {
        throw `Error with query "${q}": ${e}`;
    });

    return response.rows;
}

module.exports = {
    query
};
