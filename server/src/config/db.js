const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');
const User = require('../models/User');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    let isMemory = false;

    const isLocal = !uri || uri.includes('localhost') || uri.includes('127.0.0.1');

    if (isLocal && process.env.NODE_ENV === 'production') {
      throw new Error('MONGO_URI must be set to a real MongoDB URI in production!');
    }

    // Use MongoMemoryServer for local dev / demo if local MongoDB is not running
    if (isLocal) {
      console.log('🔄 Checking MongoDB connection or starting Memory Server...');
      try {
        await mongoose.connect(uri || 'mongodb://localhost:27017/financial_habit_tracker', {
          serverSelectionTimeoutMS: 2000,
        });
        console.log(`✅ MongoDB connected locally: ${mongoose.connection.host}`);
      } catch (localErr) {
        console.log('⚠️ Local MongoDB not reachable. Starting local MongoDB Memory Server...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        isMemory = true;
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ MongoDB Memory Server connected: ${uri}`);
      }
    } else {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }

    // Ensure User indexes (especially unique index on email) exist and are fully built
    try {
      await User.init();
      console.log('✅ User model indexes verified');
    } catch (idxError) {
      console.warn('⚠️ User index verification notice:', idxError.message);
    }

    // Seed if empty (either memory server or fresh empty database)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Database has 0 users. Seeding initial accounts & demo data...');
      const seedScriptPath = path.resolve(__dirname, '../../seed/seed.js');
      const serverCwd = path.resolve(__dirname, '../..');
      exec(
        `node "${seedScriptPath}"`,
        { cwd: serverCwd, env: { ...process.env, MONGO_URI: uri } },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Automatic seed error: ${error.message}`);
            return;
          }
          if (stdout) console.log(stdout);
          if (stderr) console.error(stderr);
        }
      );
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
