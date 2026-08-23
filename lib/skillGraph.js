import { skillTaxonomy } from './skillTaxonomy.js';

export function topoSortMissingTopics(domain, coveredTopics) {
  const topicsList = skillTaxonomy[domain];
  if (!topicsList) return [];

  const missingTopics = [];
  const coveredSet = new Set(coveredTopics || []);
  
  const inDegree = new Map();
  const graph = new Map();
  const nodeMap = new Map();

  topicsList.forEach(({ topic, prerequisites }) => {
    if (!coveredSet.has(topic)) {
      inDegree.set(topic, 0);
      graph.set(topic, []);
      nodeMap.set(topic, { topic, prerequisites });
    }
  });

  topicsList.forEach(({ topic, prerequisites }) => {
    if (!coveredSet.has(topic)) {
      prerequisites.forEach(prereq => {
        if (!coveredSet.has(prereq)) {
          if (!graph.has(prereq)) {
             graph.set(prereq, []);
             inDegree.set(prereq, 0);
          }
          graph.get(prereq).push(topic);
          inDegree.set(topic, (inDegree.get(topic) || 0) + 1);
        }
      });
    }
  });

  const queue = [];
  inDegree.forEach((degree, topic) => {
    if (degree === 0) queue.push(topic);
  });

  while (queue.length > 0) {
    const current = queue.shift();
    missingTopics.push(nodeMap.get(current) || { topic: current, prerequisites: [] });

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  return missingTopics;
}
