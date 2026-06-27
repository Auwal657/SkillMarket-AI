import { pgTable, text, serial, integer, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { freelancerProfilesTable } from "./freelancer_profiles";

export const proficiencyEnum = pgEnum("proficiency_level", ["beginner", "intermediate", "advanced", "expert"]);

export const skillsTable = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
});

export const freelancerSkillsTable = pgTable("freelancer_skills", {
  id: serial("id").primaryKey(),
  freelancerProfileId: integer("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skillsTable.id, { onDelete: "cascade" }),
  proficiencyLevel: proficiencyEnum("proficiency_level").notNull().default("intermediate"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("unique_freelancer_skill").on(table.freelancerProfileId, table.skillId),
]);

export const insertSkillSchema = createInsertSchema(skillsTable).omit({ id: true });
export const insertFreelancerSkillSchema = createInsertSchema(freelancerSkillsTable).omit({ id: true, createdAt: true });
export type Skill = typeof skillsTable.$inferSelect;
export type FreelancerSkill = typeof freelancerSkillsTable.$inferSelect;
export type InsertFreelancerSkill = z.infer<typeof insertFreelancerSkillSchema>;
