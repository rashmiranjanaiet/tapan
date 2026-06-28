import { MongoClient } from "mongodb";
import { MONGODB_URI } from "./app-config";

let client;
let clientPromise;

if (!global._learnifyMongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  global._learnifyMongoClientPromise = client.connect();
}

clientPromise = global._learnifyMongoClientPromise;

export async function getDb() {
  const mongoClient = await clientPromise;
  return mongoClient.db("learnify");
}

export function serializeDoc(doc) {
  if (!doc) return doc;

  return {
    ...doc,
    _id: doc._id?.toString(),
    id: doc.id ?? doc._id?.toString(),
  };
}

export async function getCollections() {
  const db = await getDb();
  return {
    users: db.collection("users"),
    courses: db.collection("courses"),
    enrollCourses: db.collection("enrollCourse"),
  };
}
