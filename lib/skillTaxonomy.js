export const skillTaxonomy = {
  "Web Development": [
    { topic: "HTML", prerequisites: [] },
    { topic: "CSS", prerequisites: ["HTML"] },
    { topic: "JavaScript Basics", prerequisites: ["HTML", "CSS"] },
    { topic: "DOM Manipulation", prerequisites: ["JavaScript Basics"] },
    { topic: "Async JavaScript", prerequisites: ["JavaScript Basics"] },
    { topic: "React Basics", prerequisites: ["DOM Manipulation", "Async JavaScript"] },
    { topic: "React Hooks", prerequisites: ["React Basics"] },
    { topic: "Next.js Basics", prerequisites: ["React Hooks"] },
    { topic: "Tailwind CSS", prerequisites: ["CSS", "React Basics"] }
  ],
  "Data Science": [
    { topic: "Python Basics", prerequisites: [] },
    { topic: "Numpy", prerequisites: ["Python Basics"] },
    { topic: "Pandas", prerequisites: ["Numpy"] },
    { topic: "Data Visualization", prerequisites: ["Pandas"] },
    { topic: "Machine Learning Basics", prerequisites: ["Data Visualization"] },
    { topic: "Scikit-Learn", prerequisites: ["Machine Learning Basics"] },
    { topic: "Deep Learning Concepts", prerequisites: ["Scikit-Learn"] },
    { topic: "PyTorch", prerequisites: ["Deep Learning Concepts"] }
  ],
  "DSA/Backend Engineering": [
    { topic: "Programming Fundamentals", prerequisites: [] },
    { topic: "Arrays & Strings", prerequisites: ["Programming Fundamentals"] },
    { topic: "Linked Lists", prerequisites: ["Arrays & Strings"] },
    { topic: "Hash Tables", prerequisites: ["Arrays & Strings"] },
    { topic: "Trees & Graphs", prerequisites: ["Linked Lists", "Hash Tables"] },
    { topic: "Node.js Basics", prerequisites: ["Programming Fundamentals"] },
    { topic: "Express.js", prerequisites: ["Node.js Basics"] },
    { topic: "SQL Databases", prerequisites: ["Node.js Basics"] },
    { topic: "API Design", prerequisites: ["Express.js", "SQL Databases"] }
  ],
  "Cloud/DevOps": [
    { topic: "Linux Basics", prerequisites: [] },
    { topic: "Networking Basics", prerequisites: ["Linux Basics"] },
    { topic: "Git Version Control", prerequisites: ["Linux Basics"] },
    { topic: "Docker", prerequisites: ["Linux Basics", "Networking Basics"] },
    { topic: "CI/CD", prerequisites: ["Docker", "Git Version Control"] },
    { topic: "AWS Basics", prerequisites: ["Docker"] },
    { topic: "Terraform", prerequisites: ["AWS Basics"] },
    { topic: "Kubernetes", prerequisites: ["Docker", "AWS Basics"] }
  ]
};
