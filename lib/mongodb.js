import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  // In a real app we'd throw, but for scaffolding let's allow it to start
  console.warn('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcltech-amplified';
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db();
}

export default clientPromise;
