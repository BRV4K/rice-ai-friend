const { MongoClient } = require('mongodb');

let db;

async function connectToMongo() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        db = client.db('riceBot');
        console.log('Connected to MongoDB');
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        throw err;
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not connected');
    }
    return db;
}

module.exports = { connectToMongo, getDb };