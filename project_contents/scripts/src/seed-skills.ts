import { db, skillsTable } from "@workspace/db";

const SKILLS = [
  // Development
  { name: "React", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "JavaScript", category: "Frontend" },
  { name: "Vue.js", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "CSS / Tailwind", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "Python", category: "Backend" },
  { name: "Express.js", category: "Backend" },
  { name: "PostgreSQL", category: "Backend" },
  { name: "REST API Design", category: "Backend" },
  { name: "GraphQL", category: "Backend" },
  { name: "React Native", category: "Mobile" },
  { name: "Flutter", category: "Mobile" },
  { name: "iOS (Swift)", category: "Mobile" },
  { name: "Android (Kotlin)", category: "Mobile" },
  // Design
  { name: "UI / UX Design", category: "Design" },
  { name: "Figma", category: "Design" },
  { name: "Illustration", category: "Design" },
  { name: "Motion Graphics", category: "Design" },
  { name: "Brand Identity", category: "Design" },
  // Data
  { name: "Machine Learning", category: "Data Science" },
  { name: "Data Analysis", category: "Data Science" },
  { name: "Data Visualization", category: "Data Science" },
  { name: "SQL", category: "Data Science" },
  // Writing
  { name: "Copywriting", category: "Writing" },
  { name: "Technical Writing", category: "Writing" },
  { name: "Content Strategy", category: "Writing" },
  // Marketing
  { name: "SEO", category: "Marketing" },
  { name: "Social Media Marketing", category: "Marketing" },
  { name: "Email Marketing", category: "Marketing" },
  // Other
  { name: "Video Editing", category: "Video" },
  { name: "Photography", category: "Creative" },
  { name: "3D Modeling", category: "Creative" },
];

async function seed() {
  console.log("Seeding skills...");
  for (const skill of SKILLS) {
    await db.insert(skillsTable).values(skill).onConflictDoNothing();
  }
  console.log(`Seeded ${SKILLS.length} skills.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
