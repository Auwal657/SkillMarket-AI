import { pgTable, serial, integer, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { projectsTable } from "./projects";
import { freelancerProfilesTable } from "./freelancer_profiles";

export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "declined"]);

export const projectInvitationsTable = pgTable("project_invitations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  freelancerProfileId: integer("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
  status: invitationStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("invitations_project_id_idx").on(table.projectId),
  index("invitations_client_id_idx").on(table.clientId),
  index("invitations_freelancer_profile_id_idx").on(table.freelancerProfileId),
]);

export type ProjectInvitation = typeof projectInvitationsTable.$inferSelect;
