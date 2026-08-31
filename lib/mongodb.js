import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcltech-amplified';
const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch(err => {
      console.error('MongoDB connection failed:', err.message);
      console.error('Using local MongoDB fallback: mongodb://localhost:27017/hcltech-amplified');
      console.error('To fix Atlas connection:');
      console.error('1. Check your MONGODB_URI in .env.local');
      console.error('2. Whitelist your IP in MongoDB Atlas Network Access');
      console.error('3. Ensure your Atlas cluster is running');
      const fallbackClient = new MongoClient('mongodb://localhost:27017/hcltech-amplified', options);
      return fallbackClient.connect();
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db();
  } catch (error) {
    console.error('getDb error:', error.message);
    throw new Error('Database connection failed. Please check MongoDB configuration.');
  }
}

export default clientPromise;
