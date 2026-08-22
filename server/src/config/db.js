const mongoose = require('mongoose');
const { exec } = require('child_process');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    let isMemory = false;

    const isLocal = !uri || uri.includes('localhost') || uri.includes('127.0.0.1');

    if (isLocal && process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI must be set to a real MongoDB URI in production!');
    }

    // Use MongoMemoryServer for local dev / demo
    if (isLocal) {
      console.log('🔄 Starting local MongoDB Memory Server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      isMemory = true;
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    if (isMemory) {
      // Check if we need to seed the in-memory database
      const collections = await mongoose.connection.db.collections();
      let isEmpty = true;
      for (let collection of collections) {
         const count = await collection.estimatedDocumentCount();
         if (count > 0) {
            isEmpty = false;
            break;
         }
      }

      if (isEmpty) {
        console.log('🌱 Database is empty. Running seed script...');
        exec('node seed/seed.js', { env: { ...process.env, MONGO_URI: uri } }, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Seed error: ${error.message}`);
            return;
          }
          console.log(stdout);
        });
      }
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
