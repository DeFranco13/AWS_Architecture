const pg = require('pg');
const connectionString = process.env.DATABASE_URL;
console.log('connection string', connectionString)
const pool = new pg.Pool({connectionString: connectionString});

async function createUpload(mimetype, size, filename, nickname) {
    const result = await pool.query('INSERT INTO uploads (mimetype, size, filename, nickname) VALUES ($1, $2, $3, $4) RETURNING id', [mimetype, size, filename, nickname]);
    return result.rows[0];
}

async function getUploads(nickname) {
    const result = await pool.query('SELECT * FROM uploads WHERE nickname = $1', [nickname]);
    return result.rows;
}

async function getUpload(id, nickname) {
    const result = await pool.query('SELECT * FROM uploads WHERE id = $1 AND nickname = $2', [id, nickname]);
    return result.rows[0];
}

async function deleteUpload(id, nickname) {
    await pool.query('DELETE FROM uploads WHERE id = $1 AND nickname = $2', [id, nickname]);
}

async function createTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS uploads (
                id SERIAL PRIMARY KEY, 
                mimetype VARCHAR(255), 
                size INTEGER, 
                filename VARCHAR(255),
                nickname VARCHAR(255))`);
}

/*
async function alterTable() {
    await pool.query('ALTER TABLE uploads ADD COLUMN nickname VARCHAR(255)');
}
*/

module.exports = {
    createUpload,
    getUploads,
    getUpload,
    deleteUpload,
};

setTimeout(() => {
    console.log('creating table if not exists...');
    createTable()
        .then(() => console.log('table created if not exists'))
        .catch(err => {
            console.log(err);
            console.log('database not available, exiting');
            process.exit(1);
        });
}, 5000);