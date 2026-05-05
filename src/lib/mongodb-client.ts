import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

const options = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

const client = global._mongoClient ?? new MongoClient(uri, options);

if (process.env.NODE_ENV !== "production") {
  global._mongoClient = client;
}

export default client;
