import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import { skillTaxonomy } from '../lib/skillTaxonomy.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcltech-amplified';

const resources = [];

const domains = Object.keys(skillTaxonomy);
const types = ["course", "project", "article", "video"];
const difficulties = ["beginner", "intermediate", "advanced"];

let idCounter = 1;

// Generate 4-5 resources per topic to get ~150-200 resources
domains.forEach(domain => {
  const topics = skillTaxonomy[domain];
  topics.forEach((topicObj, idx) => {
    const topic = topicObj.topic;
    const prerequisites = topicObj.prerequisites;
    const isEarly = idx < 3;
    const difficulty = isEarly ? "beginner" : (idx < 6 ? "intermediate" : "advanced");
    
    // Resource 1: Official / Standard Documentation
    resources.push({
      title: `${topic} Official Guide`,
      type: "article",
      url: `https://developer.mozilla.org/en-US/docs/Web/Search?q=${encodeURIComponent(topic)}`,
      difficulty,
      topics: [topic],
      estimatedHours: 2,
      prerequisites
    });

    // Resource 2: Video Crash Course
    resources.push({
      title: `${topic} Crash Course in 2 Hours`,
      type: "video",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " crash course")}`,
      difficulty,
      topics: [topic],
      estimatedHours: 2,
      prerequisites
    });

    // Resource 3: Interactive Course
    resources.push({
      title: `Mastering ${topic} Interactive Course`,
      type: "course",
      url: `https://www.freecodecamp.org/learn/?q=${encodeURIComponent(topic)}`,
      difficulty,
      topics: [topic],
      estimatedHours: 5,
      prerequisites
    });

    // Resource 4: Hands-on Project
    resources.push({
      title: `Build a project using ${topic}`,
      type: "project",
      url: `https://github.com/topics/${encodeURIComponent(topic.toLowerCase().replace(' ', '-'))}`,
      difficulty: difficulty === "beginner" ? "intermediate" : "advanced",
      topics: [topic],
      estimatedHours: 10,
      prerequisites
    });

    // Resource 5: Advanced Deep Dive (if intermediate/advanced)
    if (!isEarly) {
      resources.push({
        title: `Advanced patterns in ${topic}`,
        type: "article",
        url: `https://roadmap.sh/${encodeURIComponent(topic.toLowerCase().replace(' ', '-'))}`,
        difficulty: "advanced",
        topics: [topic],
        estimatedHours: 3,
        prerequisites
      });
    }
  });
});

async function seed() {
  console.log(`Starting seed: ${resources.length} resources to insert...`);
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('resources');
    
    // Clear existing
    await collection.deleteMany({});
    
    // Insert new
    const result = await collection.insertMany(resources);
    console.log(`Successfully inserted ${result.insertedCount} resources.`);
  } catch (error) {
    console.error('Error seeding resources:', error);
  } finally {
    await client.close();
  }
}

seed();
