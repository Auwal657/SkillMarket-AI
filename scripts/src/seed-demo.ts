import { db } from "@workspace/db";
import {
  usersTable,
  freelancerProfilesTable,
  skillsTable,
  freelancerSkillsTable,
  portfolioItemsTable,
  projectsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding demo data…");

  // --- Skills ---
  const skillNames = [
    "React", "TypeScript", "Node.js", "Python", "Machine Learning",
    "UI/UX Design", "Figma", "PostgreSQL", "Data Science", "Vue.js",
    "Next.js", "GraphQL", "AWS", "Mobile Development", "Blockchain",
  ];
  const existingSkills = await db.select().from(skillsTable);
  const existingSkillNames = new Set(existingSkills.map(s => s.name));
  for (const name of skillNames) {
    if (!existingSkillNames.has(name)) {
      await db.insert(skillsTable).values({ name, category: "technology" });
    }
  }
  const allSkills = await db.select().from(skillsTable);
  const skillMap = Object.fromEntries(allSkills.map(s => [s.name, s]));

  // --- Freelancer accounts ---
  const freelancers = [
    {
      email: "alex@demo.com", name: "Alex Chen", role: "freelancer" as const,
      university: "MIT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      headline: "Full-Stack React & Node.js Engineer",
      bio: "Passionate CS student at MIT with 3 years of freelance experience. I specialize in building beautiful, performant web apps with React and Node.js. Available for projects of any scale.",
      hourlyRate: 45,
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      portfolio: [
        { title: "TaskFlow – Project Management App", description: "A real-time project management tool built with React, Socket.io, and PostgreSQL. Used by 500+ users.", imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80", projectUrl: "https://github.com", tags: ["React", "Node.js", "Socket.io"] },
        { title: "E-commerce Platform", description: "Full-featured e-commerce site with Stripe integration, inventory management, and admin dashboard.", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80", projectUrl: "https://github.com", tags: ["Next.js", "TypeScript", "Stripe"] },
      ],
    },
    {
      email: "maya@demo.com", name: "Maya Patel", role: "freelancer" as const,
      university: "Stanford University",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
      headline: "AI/ML Engineer & Data Scientist",
      bio: "Stanford PhD candidate in Computer Science. I turn complex data into actionable insights and build production-ready ML models. Expert in Python, TensorFlow, and PyTorch.",
      hourlyRate: 75,
      skills: ["Python", "Machine Learning", "Data Science"],
      portfolio: [
        { title: "Sentiment Analysis API", description: "Production ML API processing 10K+ requests/day for a fintech startup. Built with FastAPI and deployed on AWS.", imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80", projectUrl: "https://github.com", tags: ["Python", "FastAPI", "TensorFlow"] },
      ],
    },
    {
      email: "james@demo.com", name: "James Wilson", role: "freelancer" as const,
      university: "Rhode Island School of Design",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
      headline: "UI/UX Designer & Figma Expert",
      bio: "RISD design graduate with a passion for creating intuitive digital experiences. I help startups craft beautiful, user-centered interfaces that convert.",
      hourlyRate: 55,
      skills: ["UI/UX Design", "Figma"],
      portfolio: [
        { title: "FinTech Dashboard Redesign", description: "Complete redesign of a financial dashboard resulting in 40% increase in user engagement and 25% reduction in support tickets.", imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80", projectUrl: "https://dribbble.com", tags: ["Figma", "Prototyping", "UX Research"] },
      ],
    },
    {
      email: "sofia@demo.com", name: "Sofia Martinez", role: "freelancer" as const,
      university: "Carnegie Mellon University",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia",
      headline: "Mobile App Developer (React Native & Flutter)",
      bio: "CMU CS student specializing in cross-platform mobile development. I've shipped 6 apps to the App Store and Play Store with a combined 50K+ downloads.",
      hourlyRate: 60,
      skills: ["Mobile Development", "React", "TypeScript"],
      portfolio: [
        { title: "FitTrack – Fitness App", description: "Cross-platform fitness tracking app with AI-powered workout recommendations. 20K+ downloads on both platforms.", imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80", projectUrl: "https://github.com", tags: ["React Native", "TypeScript", "AI"] },
      ],
    },
  ];

  const createdUsers: Record<string, typeof usersTable.$inferSelect> = {};

  for (const f of freelancers) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, f.email));
    let user: typeof usersTable.$inferSelect;
    if (existing.length > 0) {
      user = existing[0];
    } else {
      const pw = await bcrypt.hash("demo1234", 10);
      const [u] = await db.insert(usersTable).values({
        email: f.email, name: f.name, passwordHash: pw, role: f.role,
        university: f.university, avatarUrl: f.avatarUrl,
      }).returning();
      user = u;
    }
    createdUsers[f.email] = user;

    const existingProfile = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, user.id));
    if (existingProfile.length === 0) {
      await db.insert(freelancerProfilesTable).values({
        userId: user.id, headline: f.headline, bio: f.bio,
        hourlyRate: f.hourlyRate, availabilityStatus: "available",
      });
    }
    const [profile] = await db.select().from(freelancerProfilesTable).where(eq(freelancerProfilesTable.userId, user.id));

    const existingFSkills = await db.select().from(freelancerSkillsTable).where(eq(freelancerSkillsTable.freelancerProfileId, profile.id));
    if (existingFSkills.length === 0) {
      for (const skillName of f.skills) {
        const skill = skillMap[skillName];
        if (skill) {
          await db.insert(freelancerSkillsTable).values({ freelancerProfileId: profile.id, skillId: skill.id });
        }
      }
    }

    const existingPortfolio = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.freelancerProfileId, profile.id));
    if (existingPortfolio.length === 0) {
      for (const p of f.portfolio) {
        await db.insert(portfolioItemsTable).values({
          freelancerProfileId: profile.id, title: p.title, description: p.description,
          imageUrl: p.imageUrl, projectUrl: p.projectUrl, tags: p.tags,
        });
      }
    }
  }

  // --- Client accounts ---
  const clients = [
    { email: "client1@demo.com", name: "Sarah Thompson", role: "client" as const, avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah" },
    { email: "client2@demo.com", name: "Mark Johnson", role: "client" as const, avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mark" },
  ];
  for (const c of clients) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, c.email));
    if (existing.length > 0) {
      createdUsers[c.email] = existing[0];
    } else {
      const pw = await bcrypt.hash("demo1234", 10);
      const [u] = await db.insert(usersTable).values({
        email: c.email, name: c.name, passwordHash: pw, role: c.role, avatarUrl: c.avatarUrl,
      }).returning();
      createdUsers[c.email] = u;
    }
  }

  // --- Projects ---
  const projectsData = [
    {
      clientEmail: "client1@demo.com",
      title: "Build a SaaS Analytics Dashboard",
      description: "We need a skilled developer to build a real-time analytics dashboard for our SaaS platform. The dashboard should display key metrics like MAU, revenue, churn rate, and feature usage. Must integrate with our existing Node.js API and PostgreSQL database. We want beautiful charts, dark mode support, and export to PDF/CSV.",
      budgetMin: 1500, budgetMax: 2500, category: "web-development",
      requiredSkills: ["React", "TypeScript", "PostgreSQL"],
      timelineWeeks: 4,
    },
    {
      clientEmail: "client1@demo.com",
      title: "ML Model for Customer Churn Prediction",
      description: "Looking for an ML expert to build and deploy a customer churn prediction model for our subscription business. You'll work with 2 years of historical data, perform feature engineering, train multiple models, and deploy the best performer as a REST API. Must include model monitoring and retraining pipeline.",
      budgetMin: 3000, budgetMax: 4500, category: "data-science",
      requiredSkills: ["Python", "Machine Learning", "Data Science"],
      timelineWeeks: 6,
    },
    {
      clientEmail: "client2@demo.com",
      title: "Mobile App UI/UX Redesign",
      description: "Our fitness app needs a complete UI overhaul. Current design is outdated and users are churning. We need a designer to audit the existing app, create user personas, design new wireframes and high-fidelity mockups in Figma, and create a design system. We have 50K+ monthly active users.",
      budgetMin: 1200, budgetMax: 2000, category: "design",
      requiredSkills: ["UI/UX Design", "Figma", "Mobile Development"],
      timelineWeeks: 5,
    },
    {
      clientEmail: "client2@demo.com",
      title: "Full-Stack E-Commerce with AI Recommendations",
      description: "Building a niche e-commerce platform for sustainable fashion. Need a full-stack developer to implement product catalog, shopping cart, Stripe checkout, and an AI-powered recommendation engine. Tech stack: Next.js, Node.js, PostgreSQL. Must be fast, mobile-responsive, and SEO optimized.",
      budgetMin: 3500, budgetMax: 5000, category: "web-development",
      requiredSkills: ["React", "Node.js", "TypeScript", "Machine Learning"],
      timelineWeeks: 8,
    },
    {
      clientEmail: "client1@demo.com",
      title: "Python Web Scraper & Automated Data Pipeline",
      description: "Need an automated data pipeline that scrapes competitor pricing data daily from 20+ websites, cleans and normalizes the data, stores it in our database, and sends weekly summary reports. Must handle anti-scraping measures and run as a scheduled job on AWS Lambda.",
      budgetMin: 600, budgetMax: 1000, category: "data-science",
      requiredSkills: ["Python", "Data Science", "AWS"],
      timelineWeeks: 2,
    },
  ];

  for (const p of projectsData) {
    const clientUser = createdUsers[p.clientEmail];
    if (!clientUser) continue;
    const existingProject = await db.select().from(projectsTable).where(eq(projectsTable.title, p.title));
    if (existingProject.length === 0) {
      await db.insert(projectsTable).values({
        clientId: clientUser.id, title: p.title, description: p.description,
        budgetMin: p.budgetMin, budgetMax: p.budgetMax,
        category: p.category, requiredSkills: p.requiredSkills,
        timelineWeeks: p.timelineWeeks, status: "open",
      });
    }
  }

  console.log("✅ Demo data seeded successfully!");
  console.log("");
  console.log("Demo accounts (password: demo1234):");
  console.log("  Freelancers: alex@demo.com, maya@demo.com, james@demo.com, sofia@demo.com");
  console.log("  Clients: client1@demo.com, client2@demo.com");
  process.exit(0);
}

main().catch(e => {
  console.error("Seed failed:", e);
  process.exit(1);
});
