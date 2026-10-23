const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');
const User = require('../models/User');
const startMemoryServer = async () => {
  console.log('🔄 Starting MongoDB Memory Server (in-memory fallback)...');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`✅ MongoDB Memory Server connected: ${uri}`);
  return uri;
};

const connectDB = async () => {
  let uri = (process.env.MONGO_URI || '').trim();
  let isConnected = false;

  const isPlaceholder =
    !uri ||
    uri.includes('<user>') ||
    uri.includes('<password>') ||
    uri.includes('<username>') ||
    uri.includes('cluster.mongodb.net/<');

  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

  // Attempt connecting to remote or local URI if valid
  if (uri && !isPlaceholder) {
    if (isLocal && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Localhost MONGO_URI detected in production. Attempting connection or falling back to in-memory database...');
    }
    try {
      console.log(`🔄 Attempting to connect to MongoDB (${isLocal ? 'local' : 'remote'})...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      isConnected = true;
    } catch (err) {
      console.warn(`⚠️ Failed to connect to MONGO_URI: ${err.message}`);
    }
  } else {
    console.warn('⚠️ MONGO_URI is not set or contains placeholder credentials.');
  }

  // Graceful fallback to MongoMemoryServer (works in dev and production)
  if (!isConnected) {
    try {
      uri = await startMemoryServer();
      isConnected = true;
    } catch (memErr) {
      console.error(`❌ In-memory MongoDB failed to start: ${memErr.message}`);
      process.exit(1);
    }
  }

  // Ensure User indexes exist and are fully built
  try {
    await User.init();
    console.log('✅ User model indexes verified');
  } catch (idxError) {
    console.warn('⚠️ User index verification notice:', idxError.message);
  }

  // Seed if empty (either memory server or fresh empty database)
  try {
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
  } catch (seedCheckErr) {
    console.warn('⚠️ Seed check notice:', seedCheckErr.message);
  }
};

module.exports = connectDB;

