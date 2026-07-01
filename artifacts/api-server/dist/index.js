"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc3) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc3 = __getOwnPropDesc(from, key)) || desc3.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/logger.ts
var import_pino, logger;
var init_logger = __esm({
  "src/lib/logger.ts"() {
    "use strict";
    import_pino = __toESM(require("pino"));
    logger = (0, import_pino.default)({
      level: process.env.LOG_LEVEL ?? "info"
    });
  }
});

// src/lib/auth.ts
function signToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  return import_jsonwebtoken.default.verify(token, JWT_SECRET);
}
function setTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    // 7 days in milliseconds
    path: "/"
  });
}
function clearTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}
function extractToken(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: `Only ${role}s can perform this action` });
      return;
    }
    next();
  };
}
function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
    }
  }
  next();
}
var import_jsonwebtoken, JWT_SECRET, JWT_EXPIRES_IN, COOKIE_NAME;
var init_auth = __esm({
  "src/lib/auth.ts"() {
    "use strict";
    import_jsonwebtoken = __toESM(require("jsonwebtoken"));
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET environment variable is required. Add it to your Replit secrets."
      );
    }
    JWT_SECRET = process.env.JWT_SECRET;
    JWT_EXPIRES_IN = "7d";
    COOKIE_NAME = "auth_token";
  }
});

// ../../lib/db/src/schema/users.ts
var import_pg_core, import_drizzle_zod, userRoleEnum, usersTable, insertUserSchema;
var init_users = __esm({
  "../../lib/db/src/schema/users.ts"() {
    "use strict";
    import_pg_core = require("drizzle-orm/pg-core");
    import_drizzle_zod = require("drizzle-zod");
    userRoleEnum = (0, import_pg_core.pgEnum)("user_role", ["freelancer", "client"]);
    usersTable = (0, import_pg_core.pgTable)("users", {
      id: (0, import_pg_core.serial)("id").primaryKey(),
      email: (0, import_pg_core.text)("email").notNull().unique(),
      passwordHash: (0, import_pg_core.text)("password_hash").notNull(),
      name: (0, import_pg_core.text)("name").notNull(),
      role: userRoleEnum("role").notNull(),
      university: (0, import_pg_core.text)("university"),
      avatarUrl: (0, import_pg_core.text)("avatar_url"),
      isAdmin: (0, import_pg_core.boolean)("is_admin").notNull().default(false),
      isSuspended: (0, import_pg_core.boolean)("is_suspended").notNull().default(false),
      isBanned: (0, import_pg_core.boolean)("is_banned").notNull().default(false),
      emailVerified: (0, import_pg_core.boolean)("email_verified").notNull().default(false),
      emailVerificationToken: (0, import_pg_core.text)("email_verification_token"),
      emailVerificationSentAt: (0, import_pg_core.timestamp)("email_verification_sent_at", { withTimezone: true }),
      companyName: (0, import_pg_core.text)("company_name"),
      companyDescription: (0, import_pg_core.text)("company_description"),
      companyLogoUrl: (0, import_pg_core.text)("company_logo_url"),
      website: (0, import_pg_core.text)("website"),
      createdAt: (0, import_pg_core.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    });
    insertUserSchema = (0, import_drizzle_zod.createInsertSchema)(usersTable).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
  }
});

// ../../lib/db/src/schema/freelancer_profiles.ts
var import_pg_core2, import_drizzle_zod2, availabilityEnum, freelancerProfilesTable, insertFreelancerProfileSchema;
var init_freelancer_profiles = __esm({
  "../../lib/db/src/schema/freelancer_profiles.ts"() {
    "use strict";
    import_pg_core2 = require("drizzle-orm/pg-core");
    import_drizzle_zod2 = require("drizzle-zod");
    init_users();
    availabilityEnum = (0, import_pg_core2.pgEnum)("availability_status", ["available", "busy", "unavailable"]);
    freelancerProfilesTable = (0, import_pg_core2.pgTable)("freelancer_profiles", {
      id: (0, import_pg_core2.serial)("id").primaryKey(),
      userId: (0, import_pg_core2.integer)("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
      headline: (0, import_pg_core2.text)("headline").notNull(),
      bio: (0, import_pg_core2.text)("bio").notNull(),
      hourlyRate: (0, import_pg_core2.real)("hourly_rate").notNull(),
      availabilityStatus: availabilityEnum("availability_status").notNull().default("available"),
      totalEarnings: (0, import_pg_core2.real)("total_earnings").notNull().default(0),
      completedProjects: (0, import_pg_core2.integer)("completed_projects").notNull().default(0),
      averageRating: (0, import_pg_core2.real)("average_rating"),
      totalReviews: (0, import_pg_core2.integer)("total_reviews").notNull().default(0),
      profileViews: (0, import_pg_core2.integer)("profile_views").notNull().default(0),
      isVerified: (0, import_pg_core2.boolean)("is_verified").notNull().default(false),
      createdAt: (0, import_pg_core2.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core2.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    });
    insertFreelancerProfileSchema = (0, import_drizzle_zod2.createInsertSchema)(freelancerProfilesTable).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      totalEarnings: true,
      completedProjects: true,
      averageRating: true,
      totalReviews: true,
      profileViews: true
    });
  }
});

// ../../lib/db/src/schema/skills.ts
var import_pg_core3, import_drizzle_zod3, proficiencyEnum, skillsTable, freelancerSkillsTable, insertSkillSchema, insertFreelancerSkillSchema;
var init_skills = __esm({
  "../../lib/db/src/schema/skills.ts"() {
    "use strict";
    import_pg_core3 = require("drizzle-orm/pg-core");
    import_drizzle_zod3 = require("drizzle-zod");
    init_freelancer_profiles();
    proficiencyEnum = (0, import_pg_core3.pgEnum)("proficiency_level", ["beginner", "intermediate", "advanced", "expert"]);
    skillsTable = (0, import_pg_core3.pgTable)("skills", {
      id: (0, import_pg_core3.serial)("id").primaryKey(),
      name: (0, import_pg_core3.text)("name").notNull().unique(),
      category: (0, import_pg_core3.text)("category").notNull()
    });
    freelancerSkillsTable = (0, import_pg_core3.pgTable)("freelancer_skills", {
      id: (0, import_pg_core3.serial)("id").primaryKey(),
      freelancerProfileId: (0, import_pg_core3.integer)("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
      skillId: (0, import_pg_core3.integer)("skill_id").notNull().references(() => skillsTable.id, { onDelete: "cascade" }),
      proficiencyLevel: proficiencyEnum("proficiency_level").notNull().default("intermediate"),
      createdAt: (0, import_pg_core3.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => [
      (0, import_pg_core3.unique)("unique_freelancer_skill").on(table.freelancerProfileId, table.skillId)
    ]);
    insertSkillSchema = (0, import_drizzle_zod3.createInsertSchema)(skillsTable).omit({ id: true });
    insertFreelancerSkillSchema = (0, import_drizzle_zod3.createInsertSchema)(freelancerSkillsTable).omit({ id: true, createdAt: true });
  }
});

// ../../lib/db/src/schema/portfolio.ts
var import_pg_core4, import_drizzle_zod4, portfolioItemsTable, insertPortfolioItemSchema;
var init_portfolio = __esm({
  "../../lib/db/src/schema/portfolio.ts"() {
    "use strict";
    import_pg_core4 = require("drizzle-orm/pg-core");
    import_drizzle_zod4 = require("drizzle-zod");
    init_freelancer_profiles();
    portfolioItemsTable = (0, import_pg_core4.pgTable)("portfolio_items", {
      id: (0, import_pg_core4.serial)("id").primaryKey(),
      freelancerProfileId: (0, import_pg_core4.integer)("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
      title: (0, import_pg_core4.text)("title").notNull(),
      description: (0, import_pg_core4.text)("description").notNull(),
      imageUrl: (0, import_pg_core4.text)("image_url"),
      projectUrl: (0, import_pg_core4.text)("project_url"),
      tags: (0, import_pg_core4.text)("tags").array().notNull().default([]),
      createdAt: (0, import_pg_core4.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    insertPortfolioItemSchema = (0, import_drizzle_zod4.createInsertSchema)(portfolioItemsTable).omit({
      id: true,
      createdAt: true
    });
  }
});

// ../../lib/db/src/schema/projects.ts
var import_pg_core5, import_drizzle_zod5, projectStatusEnum, projectsTable, insertProjectSchema;
var init_projects = __esm({
  "../../lib/db/src/schema/projects.ts"() {
    "use strict";
    import_pg_core5 = require("drizzle-orm/pg-core");
    import_drizzle_zod5 = require("drizzle-zod");
    init_users();
    projectStatusEnum = (0, import_pg_core5.pgEnum)("project_status", ["open", "in_progress", "completed", "cancelled"]);
    projectsTable = (0, import_pg_core5.pgTable)("projects", {
      id: (0, import_pg_core5.serial)("id").primaryKey(),
      title: (0, import_pg_core5.text)("title").notNull(),
      description: (0, import_pg_core5.text)("description").notNull(),
      category: (0, import_pg_core5.text)("category").notNull(),
      budgetMin: (0, import_pg_core5.real)("budget_min").notNull(),
      budgetMax: (0, import_pg_core5.real)("budget_max").notNull(),
      timelineWeeks: (0, import_pg_core5.integer)("timeline_weeks"),
      status: projectStatusEnum("status").notNull().default("open"),
      clientId: (0, import_pg_core5.integer)("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      requiredSkills: (0, import_pg_core5.text)("required_skills").array().notNull().default([]),
      createdAt: (0, import_pg_core5.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core5.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    }, (table) => [
      // P2: Indexes for common query patterns
      (0, import_pg_core5.index)("projects_client_id_idx").on(table.clientId),
      (0, import_pg_core5.index)("projects_status_idx").on(table.status),
      (0, import_pg_core5.index)("projects_created_at_idx").on(table.createdAt)
    ]);
    insertProjectSchema = (0, import_drizzle_zod5.createInsertSchema)(projectsTable).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      clientId: true
    });
  }
});

// ../../lib/db/src/schema/applications.ts
var import_pg_core6, import_drizzle_zod6, applicationStatusEnum, applicationsTable, insertApplicationSchema;
var init_applications = __esm({
  "../../lib/db/src/schema/applications.ts"() {
    "use strict";
    import_pg_core6 = require("drizzle-orm/pg-core");
    import_drizzle_zod6 = require("drizzle-zod");
    init_projects();
    init_users();
    applicationStatusEnum = (0, import_pg_core6.pgEnum)("application_status", ["pending", "accepted", "rejected"]);
    applicationsTable = (0, import_pg_core6.pgTable)("applications", {
      id: (0, import_pg_core6.serial)("id").primaryKey(),
      projectId: (0, import_pg_core6.integer)("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
      freelancerId: (0, import_pg_core6.integer)("freelancer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      coverLetter: (0, import_pg_core6.text)("cover_letter").notNull(),
      proposedRate: (0, import_pg_core6.real)("proposed_rate").notNull(),
      status: applicationStatusEnum("status").notNull().default("pending"),
      createdAt: (0, import_pg_core6.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core6.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    }, (table) => [
      (0, import_pg_core6.unique)("unique_application").on(table.projectId, table.freelancerId),
      // P2: Indexes for common query patterns
      (0, import_pg_core6.index)("applications_freelancer_id_idx").on(table.freelancerId),
      (0, import_pg_core6.index)("applications_project_id_idx").on(table.projectId),
      (0, import_pg_core6.index)("applications_status_idx").on(table.status)
    ]);
    insertApplicationSchema = (0, import_drizzle_zod6.createInsertSchema)(applicationsTable).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      freelancerId: true
    });
  }
});

// ../../lib/db/src/schema/reviews.ts
var import_pg_core7, import_drizzle_zod7, reviewsTable, insertReviewSchema;
var init_reviews = __esm({
  "../../lib/db/src/schema/reviews.ts"() {
    "use strict";
    import_pg_core7 = require("drizzle-orm/pg-core");
    import_drizzle_zod7 = require("drizzle-zod");
    init_users();
    init_freelancer_profiles();
    init_projects();
    reviewsTable = (0, import_pg_core7.pgTable)("reviews", {
      id: (0, import_pg_core7.serial)("id").primaryKey(),
      freelancerProfileId: (0, import_pg_core7.integer)("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
      reviewerId: (0, import_pg_core7.integer)("reviewer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      projectId: (0, import_pg_core7.integer)("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
      rating: (0, import_pg_core7.real)("rating").notNull(),
      comment: (0, import_pg_core7.text)("comment"),
      createdAt: (0, import_pg_core7.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => [
      (0, import_pg_core7.unique)("unique_review").on(table.freelancerProfileId, table.reviewerId, table.projectId)
    ]);
    insertReviewSchema = (0, import_drizzle_zod7.createInsertSchema)(reviewsTable).omit({
      id: true,
      createdAt: true,
      reviewerId: true
    });
  }
});

// ../../lib/db/src/schema/saved_items.ts
var import_pg_core8, import_drizzle_zod8, savedItemsTable, insertSavedItemSchema;
var init_saved_items = __esm({
  "../../lib/db/src/schema/saved_items.ts"() {
    "use strict";
    import_pg_core8 = require("drizzle-orm/pg-core");
    init_users();
    import_drizzle_zod8 = require("drizzle-zod");
    savedItemsTable = (0, import_pg_core8.pgTable)("saved_items", {
      id: (0, import_pg_core8.serial)("id").primaryKey(),
      userId: (0, import_pg_core8.integer)("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      itemType: (0, import_pg_core8.text)("item_type").notNull(),
      // 'project' | 'freelancer'
      itemId: (0, import_pg_core8.integer)("item_id").notNull(),
      createdAt: (0, import_pg_core8.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => [
      (0, import_pg_core8.unique)("unique_saved_item").on(table.userId, table.itemType, table.itemId)
    ]);
    insertSavedItemSchema = (0, import_drizzle_zod8.createInsertSchema)(savedItemsTable).omit({
      id: true,
      createdAt: true,
      userId: true
    });
  }
});

// ../../lib/db/src/schema/messages.ts
var import_pg_core9, import_drizzle_zod9, conversationsTable, messagesTable, insertMessageSchema;
var init_messages = __esm({
  "../../lib/db/src/schema/messages.ts"() {
    "use strict";
    import_pg_core9 = require("drizzle-orm/pg-core");
    import_drizzle_zod9 = require("drizzle-zod");
    init_users();
    conversationsTable = (0, import_pg_core9.pgTable)("conversations", {
      id: (0, import_pg_core9.serial)("id").primaryKey(),
      participant1Id: (0, import_pg_core9.integer)("participant1_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      participant2Id: (0, import_pg_core9.integer)("participant2_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      lastMessageAt: (0, import_pg_core9.timestamp)("last_message_at", { withTimezone: true }).notNull().defaultNow(),
      createdAt: (0, import_pg_core9.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => [
      (0, import_pg_core9.index)("conversations_p1_idx").on(table.participant1Id),
      (0, import_pg_core9.index)("conversations_p2_idx").on(table.participant2Id)
    ]);
    messagesTable = (0, import_pg_core9.pgTable)("messages", {
      id: (0, import_pg_core9.serial)("id").primaryKey(),
      conversationId: (0, import_pg_core9.integer)("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
      senderId: (0, import_pg_core9.integer)("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      content: (0, import_pg_core9.text)("content").notNull().default(""),
      isRead: (0, import_pg_core9.boolean)("is_read").notNull().default(false),
      attachmentUrl: (0, import_pg_core9.text)("attachment_url"),
      attachmentName: (0, import_pg_core9.text)("attachment_name"),
      attachmentType: (0, import_pg_core9.text)("attachment_type"),
      createdAt: (0, import_pg_core9.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    insertMessageSchema = (0, import_drizzle_zod9.createInsertSchema)(messagesTable).omit({
      id: true,
      createdAt: true,
      senderId: true,
      isRead: true
    });
  }
});

// ../../lib/db/src/schema/notifications.ts
var import_pg_core10, import_drizzle_zod10, notificationsTable, insertNotificationSchema;
var init_notifications = __esm({
  "../../lib/db/src/schema/notifications.ts"() {
    "use strict";
    import_pg_core10 = require("drizzle-orm/pg-core");
    import_drizzle_zod10 = require("drizzle-zod");
    init_users();
    notificationsTable = (0, import_pg_core10.pgTable)("notifications", {
      id: (0, import_pg_core10.serial)("id").primaryKey(),
      userId: (0, import_pg_core10.integer)("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      type: (0, import_pg_core10.text)("type").notNull(),
      // 'application_accepted' | 'application_rejected' | 'new_application' | 'new_message' | 'review_received'
      title: (0, import_pg_core10.text)("title").notNull(),
      message: (0, import_pg_core10.text)("message").notNull(),
      link: (0, import_pg_core10.text)("link"),
      isRead: (0, import_pg_core10.boolean)("is_read").notNull().default(false),
      createdAt: (0, import_pg_core10.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => [
      // P2: Index for per-user notification polling
      (0, import_pg_core10.index)("notifications_user_id_idx").on(table.userId),
      (0, import_pg_core10.index)("notifications_user_read_idx").on(table.userId, table.isRead)
    ]);
    insertNotificationSchema = (0, import_drizzle_zod10.createInsertSchema)(notificationsTable).omit({
      id: true,
      createdAt: true,
      isRead: true
    });
  }
});

// ../../lib/db/src/schema/password_reset_tokens.ts
var import_pg_core11, passwordResetTokensTable;
var init_password_reset_tokens = __esm({
  "../../lib/db/src/schema/password_reset_tokens.ts"() {
    "use strict";
    import_pg_core11 = require("drizzle-orm/pg-core");
    init_users();
    passwordResetTokensTable = (0, import_pg_core11.pgTable)("password_reset_tokens", {
      id: (0, import_pg_core11.serial)("id").primaryKey(),
      userId: (0, import_pg_core11.integer)("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      token: (0, import_pg_core11.text)("token").notNull().unique(),
      expiresAt: (0, import_pg_core11.timestamp)("expires_at", { withTimezone: true }).notNull(),
      usedAt: (0, import_pg_core11.timestamp)("used_at", { withTimezone: true }),
      createdAt: (0, import_pg_core11.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    });
  }
});

// ../../lib/db/src/schema/reports.ts
var import_pg_core12, import_drizzle_zod11, reportTargetTypeEnum, reportStatusEnum, reportsTable, insertReportSchema;
var init_reports = __esm({
  "../../lib/db/src/schema/reports.ts"() {
    "use strict";
    import_pg_core12 = require("drizzle-orm/pg-core");
    import_drizzle_zod11 = require("drizzle-zod");
    init_users();
    reportTargetTypeEnum = (0, import_pg_core12.pgEnum)("report_target_type", ["user", "project", "message"]);
    reportStatusEnum = (0, import_pg_core12.pgEnum)("report_status", ["pending", "reviewed", "resolved", "dismissed"]);
    reportsTable = (0, import_pg_core12.pgTable)("reports", {
      id: (0, import_pg_core12.serial)("id").primaryKey(),
      reporterId: (0, import_pg_core12.integer)("reporter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      targetType: reportTargetTypeEnum("target_type").notNull(),
      targetId: (0, import_pg_core12.integer)("target_id").notNull(),
      reason: (0, import_pg_core12.text)("reason").notNull(),
      description: (0, import_pg_core12.text)("description"),
      status: reportStatusEnum("status").notNull().default("pending"),
      adminNote: (0, import_pg_core12.text)("admin_note"),
      resolvedAt: (0, import_pg_core12.timestamp)("resolved_at", { withTimezone: true }),
      createdAt: (0, import_pg_core12.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    }, (table) => [
      (0, import_pg_core12.index)("reports_reporter_idx").on(table.reporterId),
      (0, import_pg_core12.index)("reports_target_idx").on(table.targetType, table.targetId),
      (0, import_pg_core12.index)("reports_status_idx").on(table.status)
    ]);
    insertReportSchema = (0, import_drizzle_zod11.createInsertSchema)(reportsTable).omit({
      id: true,
      status: true,
      adminNote: true,
      resolvedAt: true,
      createdAt: true,
      reporterId: true
    });
  }
});

// ../../lib/db/src/schema/project_invitations.ts
var import_pg_core13, invitationStatusEnum, projectInvitationsTable;
var init_project_invitations = __esm({
  "../../lib/db/src/schema/project_invitations.ts"() {
    "use strict";
    import_pg_core13 = require("drizzle-orm/pg-core");
    init_users();
    init_projects();
    init_freelancer_profiles();
    invitationStatusEnum = (0, import_pg_core13.pgEnum)("invitation_status", ["pending", "accepted", "declined"]);
    projectInvitationsTable = (0, import_pg_core13.pgTable)("project_invitations", {
      id: (0, import_pg_core13.serial)("id").primaryKey(),
      projectId: (0, import_pg_core13.integer)("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
      clientId: (0, import_pg_core13.integer)("client_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
      freelancerProfileId: (0, import_pg_core13.integer)("freelancer_profile_id").notNull().references(() => freelancerProfilesTable.id, { onDelete: "cascade" }),
      status: invitationStatusEnum("status").notNull().default("pending"),
      message: (0, import_pg_core13.text)("message"),
      createdAt: (0, import_pg_core13.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core13.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    }, (table) => [
      (0, import_pg_core13.index)("invitations_project_id_idx").on(table.projectId),
      (0, import_pg_core13.index)("invitations_client_id_idx").on(table.clientId),
      (0, import_pg_core13.index)("invitations_freelancer_profile_id_idx").on(table.freelancerProfileId)
    ]);
  }
});

// ../../lib/db/src/schema/wallets.ts
var import_pg_core14, walletsTable;
var init_wallets = __esm({
  "../../lib/db/src/schema/wallets.ts"() {
    "use strict";
    import_pg_core14 = require("drizzle-orm/pg-core");
    walletsTable = (0, import_pg_core14.pgTable)("wallets", {
      id: (0, import_pg_core14.serial)("id").primaryKey(),
      userId: (0, import_pg_core14.integer)("user_id").notNull().unique(),
      balance: (0, import_pg_core14.numeric)("balance", { precision: 14, scale: 2 }).notNull().default("0"),
      currency: (0, import_pg_core14.text)("currency").notNull().default("NGN"),
      createdAt: (0, import_pg_core14.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core14.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    });
  }
});

// ../../lib/db/src/schema/escrow_transactions.ts
var import_pg_core15, escrowStatusEnum, escrowTransactionsTable;
var init_escrow_transactions = __esm({
  "../../lib/db/src/schema/escrow_transactions.ts"() {
    "use strict";
    import_pg_core15 = require("drizzle-orm/pg-core");
    escrowStatusEnum = (0, import_pg_core15.pgEnum)("escrow_status", [
      "pending",
      "funded",
      "in_escrow",
      "released",
      "refunded",
      "cancelled"
    ]);
    escrowTransactionsTable = (0, import_pg_core15.pgTable)("escrow_transactions", {
      id: (0, import_pg_core15.serial)("id").primaryKey(),
      projectId: (0, import_pg_core15.integer)("project_id").notNull().unique(),
      clientId: (0, import_pg_core15.integer)("client_id").notNull(),
      freelancerId: (0, import_pg_core15.integer)("freelancer_id").notNull(),
      amount: (0, import_pg_core15.numeric)("amount", { precision: 14, scale: 2 }).notNull(),
      status: escrowStatusEnum("status").notNull().default("pending"),
      paystackReference: (0, import_pg_core15.text)("paystack_reference"),
      paystackAccessCode: (0, import_pg_core15.text)("paystack_access_code"),
      paystackAuthorizationUrl: (0, import_pg_core15.text)("paystack_authorization_url"),
      paystackTransactionId: (0, import_pg_core15.text)("paystack_transaction_id"),
      initiatedAt: (0, import_pg_core15.timestamp)("initiated_at", { withTimezone: true }).notNull().defaultNow(),
      fundedAt: (0, import_pg_core15.timestamp)("funded_at", { withTimezone: true }),
      releasedAt: (0, import_pg_core15.timestamp)("released_at", { withTimezone: true }),
      refundedAt: (0, import_pg_core15.timestamp)("refunded_at", { withTimezone: true }),
      createdAt: (0, import_pg_core15.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core15.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    });
  }
});

// ../../lib/db/src/schema/wallet_transactions.ts
var import_pg_core16, walletTxTypeEnum, walletTxCategoryEnum, walletTransactionsTable;
var init_wallet_transactions = __esm({
  "../../lib/db/src/schema/wallet_transactions.ts"() {
    "use strict";
    import_pg_core16 = require("drizzle-orm/pg-core");
    walletTxTypeEnum = (0, import_pg_core16.pgEnum)("wallet_tx_type", ["credit", "debit"]);
    walletTxCategoryEnum = (0, import_pg_core16.pgEnum)("wallet_tx_category", [
      "escrow_fund",
      "escrow_release",
      "refund",
      "withdrawal",
      "fee",
      "deposit"
    ]);
    walletTransactionsTable = (0, import_pg_core16.pgTable)("wallet_transactions", {
      id: (0, import_pg_core16.serial)("id").primaryKey(),
      walletId: (0, import_pg_core16.integer)("wallet_id").notNull(),
      userId: (0, import_pg_core16.integer)("user_id").notNull(),
      type: walletTxTypeEnum("type").notNull(),
      category: walletTxCategoryEnum("category").notNull(),
      amount: (0, import_pg_core16.numeric)("amount", { precision: 14, scale: 2 }).notNull(),
      balanceBefore: (0, import_pg_core16.numeric)("balance_before", { precision: 14, scale: 2 }).notNull(),
      balanceAfter: (0, import_pg_core16.numeric)("balance_after", { precision: 14, scale: 2 }).notNull(),
      reference: (0, import_pg_core16.text)("reference").notNull(),
      description: (0, import_pg_core16.text)("description").notNull(),
      escrowTransactionId: (0, import_pg_core16.integer)("escrow_transaction_id"),
      createdAt: (0, import_pg_core16.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    });
  }
});

// ../../lib/db/src/schema/withdrawal_requests.ts
var import_pg_core17, withdrawalStatusEnum, withdrawalRequestsTable;
var init_withdrawal_requests = __esm({
  "../../lib/db/src/schema/withdrawal_requests.ts"() {
    "use strict";
    import_pg_core17 = require("drizzle-orm/pg-core");
    withdrawalStatusEnum = (0, import_pg_core17.pgEnum)("withdrawal_status", [
      "pending",
      "approved",
      "rejected",
      "completed"
    ]);
    withdrawalRequestsTable = (0, import_pg_core17.pgTable)("withdrawal_requests", {
      id: (0, import_pg_core17.serial)("id").primaryKey(),
      walletId: (0, import_pg_core17.integer)("wallet_id").notNull(),
      userId: (0, import_pg_core17.integer)("user_id").notNull(),
      amount: (0, import_pg_core17.numeric)("amount", { precision: 14, scale: 2 }).notNull(),
      status: withdrawalStatusEnum("status").notNull().default("pending"),
      bankName: (0, import_pg_core17.text)("bank_name").notNull(),
      accountNumber: (0, import_pg_core17.text)("account_number").notNull(),
      accountName: (0, import_pg_core17.text)("account_name").notNull(),
      note: (0, import_pg_core17.text)("note"),
      adminNote: (0, import_pg_core17.text)("admin_note"),
      processedAt: (0, import_pg_core17.timestamp)("processed_at", { withTimezone: true }),
      createdAt: (0, import_pg_core17.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: (0, import_pg_core17.timestamp)("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
    });
  }
});

// ../../lib/db/src/schema/invoices.ts
var import_pg_core18, invoiceTypeEnum, invoicesTable;
var init_invoices = __esm({
  "../../lib/db/src/schema/invoices.ts"() {
    "use strict";
    import_pg_core18 = require("drizzle-orm/pg-core");
    invoiceTypeEnum = (0, import_pg_core18.pgEnum)("invoice_type", [
      "escrow_funded",
      "escrow_released",
      "refund"
    ]);
    invoicesTable = (0, import_pg_core18.pgTable)("invoices", {
      id: (0, import_pg_core18.serial)("id").primaryKey(),
      invoiceNumber: (0, import_pg_core18.text)("invoice_number").notNull().unique(),
      escrowTransactionId: (0, import_pg_core18.integer)("escrow_transaction_id").notNull(),
      projectId: (0, import_pg_core18.integer)("project_id").notNull(),
      clientId: (0, import_pg_core18.integer)("client_id").notNull(),
      freelancerId: (0, import_pg_core18.integer)("freelancer_id").notNull(),
      amount: (0, import_pg_core18.numeric)("amount", { precision: 14, scale: 2 }).notNull(),
      type: invoiceTypeEnum("type").notNull(),
      paystackReference: (0, import_pg_core18.text)("paystack_reference"),
      createdAt: (0, import_pg_core18.timestamp)("created_at", { withTimezone: true }).notNull().defaultNow()
    });
  }
});

// ../../lib/db/src/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  applicationStatusEnum: () => applicationStatusEnum,
  applicationsTable: () => applicationsTable,
  availabilityEnum: () => availabilityEnum,
  conversationsTable: () => conversationsTable,
  escrowStatusEnum: () => escrowStatusEnum,
  escrowTransactionsTable: () => escrowTransactionsTable,
  freelancerProfilesTable: () => freelancerProfilesTable,
  freelancerSkillsTable: () => freelancerSkillsTable,
  insertApplicationSchema: () => insertApplicationSchema,
  insertFreelancerProfileSchema: () => insertFreelancerProfileSchema,
  insertFreelancerSkillSchema: () => insertFreelancerSkillSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPortfolioItemSchema: () => insertPortfolioItemSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertReportSchema: () => insertReportSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertSavedItemSchema: () => insertSavedItemSchema,
  insertSkillSchema: () => insertSkillSchema,
  insertUserSchema: () => insertUserSchema,
  invitationStatusEnum: () => invitationStatusEnum,
  invoiceTypeEnum: () => invoiceTypeEnum,
  invoicesTable: () => invoicesTable,
  messagesTable: () => messagesTable,
  notificationsTable: () => notificationsTable,
  passwordResetTokensTable: () => passwordResetTokensTable,
  portfolioItemsTable: () => portfolioItemsTable,
  proficiencyEnum: () => proficiencyEnum,
  projectInvitationsTable: () => projectInvitationsTable,
  projectStatusEnum: () => projectStatusEnum,
  projectsTable: () => projectsTable,
  reportStatusEnum: () => reportStatusEnum,
  reportTargetTypeEnum: () => reportTargetTypeEnum,
  reportsTable: () => reportsTable,
  reviewsTable: () => reviewsTable,
  savedItemsTable: () => savedItemsTable,
  skillsTable: () => skillsTable,
  userRoleEnum: () => userRoleEnum,
  usersTable: () => usersTable,
  walletTransactionsTable: () => walletTransactionsTable,
  walletTxCategoryEnum: () => walletTxCategoryEnum,
  walletTxTypeEnum: () => walletTxTypeEnum,
  walletsTable: () => walletsTable,
  withdrawalRequestsTable: () => withdrawalRequestsTable,
  withdrawalStatusEnum: () => withdrawalStatusEnum
});
var init_schema = __esm({
  "../../lib/db/src/schema/index.ts"() {
    "use strict";
    init_users();
    init_freelancer_profiles();
    init_skills();
    init_portfolio();
    init_projects();
    init_applications();
    init_reviews();
    init_saved_items();
    init_messages();
    init_notifications();
    init_password_reset_tokens();
    init_reports();
    init_project_invitations();
    init_wallets();
    init_escrow_transactions();
    init_wallet_transactions();
    init_withdrawal_requests();
    init_invoices();
  }
});

// ../../lib/db/src/index.ts
var src_exports = {};
__export(src_exports, {
  applicationStatusEnum: () => applicationStatusEnum,
  applicationsTable: () => applicationsTable,
  availabilityEnum: () => availabilityEnum,
  conversationsTable: () => conversationsTable,
  db: () => db,
  escrowStatusEnum: () => escrowStatusEnum,
  escrowTransactionsTable: () => escrowTransactionsTable,
  freelancerProfilesTable: () => freelancerProfilesTable,
  freelancerSkillsTable: () => freelancerSkillsTable,
  insertApplicationSchema: () => insertApplicationSchema,
  insertFreelancerProfileSchema: () => insertFreelancerProfileSchema,
  insertFreelancerSkillSchema: () => insertFreelancerSkillSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPortfolioItemSchema: () => insertPortfolioItemSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertReportSchema: () => insertReportSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertSavedItemSchema: () => insertSavedItemSchema,
  insertSkillSchema: () => insertSkillSchema,
  insertUserSchema: () => insertUserSchema,
  invitationStatusEnum: () => invitationStatusEnum,
  invoiceTypeEnum: () => invoiceTypeEnum,
  invoicesTable: () => invoicesTable,
  messagesTable: () => messagesTable,
  notificationsTable: () => notificationsTable,
  passwordResetTokensTable: () => passwordResetTokensTable,
  pool: () => pool,
  portfolioItemsTable: () => portfolioItemsTable,
  proficiencyEnum: () => proficiencyEnum,
  projectInvitationsTable: () => projectInvitationsTable,
  projectStatusEnum: () => projectStatusEnum,
  projectsTable: () => projectsTable,
  reportStatusEnum: () => reportStatusEnum,
  reportTargetTypeEnum: () => reportTargetTypeEnum,
  reportsTable: () => reportsTable,
  reviewsTable: () => reviewsTable,
  savedItemsTable: () => savedItemsTable,
  skillsTable: () => skillsTable,
  userRoleEnum: () => userRoleEnum,
  usersTable: () => usersTable,
  walletTransactionsTable: () => walletTransactionsTable,
  walletTxCategoryEnum: () => walletTxCategoryEnum,
  walletTxTypeEnum: () => walletTxTypeEnum,
  walletsTable: () => walletsTable,
  withdrawalRequestsTable: () => withdrawalRequestsTable,
  withdrawalStatusEnum: () => withdrawalStatusEnum
});
var import_node_postgres, import_pg, Pool, pool, db;
var init_src = __esm({
  "../../lib/db/src/index.ts"() {
    "use strict";
    import_node_postgres = require("drizzle-orm/node-postgres");
    import_pg = __toESM(require("pg"), 1);
    init_schema();
    init_schema();
    ({ Pool } = import_pg.default);
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });
  }
});

// src/lib/socket.ts
var socket_exports = {};
__export(socket_exports, {
  getOnlineUserIds: () => getOnlineUserIds,
  initSocket: () => initSocket,
  io: () => io,
  isUserOnline: () => isUserOnline
});
function getOnlineUserIds() {
  return [...onlineUsers.keys()];
}
function isUserOnline(userId) {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
}
function initSocket(httpServer2) {
  const ALLOWED_ORIGINS2 = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : null;
  io = new import_socket.Server(httpServer2, {
    cors: {
      origin: ALLOWED_ORIGINS2 ?? true,
      credentials: true
    },
    path: "/socket.io"
  });
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const cookies = {};
    cookieHeader.split(";").forEach((c) => {
      const [k, ...v] = c.trim().split("=");
      if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
    });
    const token = cookies["auth_token"];
    if (!token) return next(new Error("Not authenticated"));
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    logger.info({ userId }, "Socket connected");
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, /* @__PURE__ */ new Set());
    onlineUsers.get(userId).add(socket.id);
    socket.broadcast.emit("presence:online", { userId });
    socket.join(`user:${userId}`);
    socket.on("join:conversation", async (conversationId) => {
      try {
        const [conv] = await db.select({ p1: conversationsTable.participant1Id, p2: conversationsTable.participant2Id }).from(conversationsTable).where((0, import_drizzle_orm.eq)(conversationsTable.id, conversationId));
        if (!conv) return;
        if (conv.p1 !== userId && conv.p2 !== userId) return;
        socket.join(`conv:${conversationId}`);
      } catch (err) {
        logger.error(err, "join:conversation error");
      }
    });
    socket.on("leave:conversation", (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", { userId, conversationId });
    });
    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:stop", { userId, conversationId });
    });
    socket.on("message:send", async ({
      recipientId,
      content,
      attachmentUrl,
      attachmentName,
      attachmentType
    }) => {
      const hasContent = content?.trim();
      const hasAttachment = attachmentUrl?.trim();
      if (!hasContent && !hasAttachment) return;
      if (!recipientId) return;
      if (userId === recipientId) return;
      try {
        const [recipient] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm.eq)(usersTable.id, recipientId));
        if (!recipient) return;
        const p1 = Math.min(userId, recipientId);
        const p2 = Math.max(userId, recipientId);
        let [conv] = await db.select().from(conversationsTable).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(conversationsTable.participant1Id, p1),
            (0, import_drizzle_orm.eq)(conversationsTable.participant2Id, p2)
          )
        );
        if (!conv) {
          [conv] = await db.insert(conversationsTable).values({ participant1Id: p1, participant2Id: p2 }).returning();
        }
        const [message] = await db.insert(messagesTable).values({
          conversationId: conv.id,
          senderId: userId,
          content: content?.trim() ?? "",
          attachmentUrl: attachmentUrl ?? null,
          attachmentName: attachmentName ?? null,
          attachmentType: attachmentType ?? null
        }).returning();
        await db.update(conversationsTable).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(conversationsTable.id, conv.id));
        socket.to(`conv:${conv.id}`).emit("typing:stop", { userId, conversationId: conv.id });
        io.to(`conv:${conv.id}`).emit("message:new", {
          ...message,
          conversationId: conv.id
        });
        io.to(`user:${userId}`).to(`user:${recipientId}`).emit("conversation:updated", {
          conversationId: conv.id
        });
        const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm.eq)(usersTable.id, userId));
        const preview = hasContent ? content.length > 60 ? content.slice(0, 60) + "\u2026" : content : `\u{1F4CE} ${attachmentName ?? "file"}`;
        const [notif] = await db.insert(notificationsTable).values({
          userId: recipientId,
          type: "new_message",
          title: `New message from ${sender?.name ?? "someone"}`,
          message: preview,
          link: `/messages`
        }).returning();
        io.to(`user:${recipientId}`).emit("notification:new", notif);
      } catch (err) {
        logger.error(err, "Error handling message:send");
        socket.emit("message:error", { error: "Failed to send message" });
      }
    });
    socket.on("conversation:read", async (conversationId) => {
      try {
        await db.update(messagesTable).set({ isRead: true }).where(
          (0, import_drizzle_orm.and)(
            (0, import_drizzle_orm.eq)(messagesTable.conversationId, conversationId),
            import_drizzle_orm.sql`${messagesTable.senderId} != ${userId}`
          )
        );
        io.to(`conv:${conversationId}`).emit("conversation:seen", {
          conversationId,
          byUserId: userId
        });
      } catch (err) {
        logger.error(err, "Error marking messages read");
      }
    });
    socket.on("presence:query", (userIds) => {
      const result = {};
      for (const uid of userIds) {
        result[uid] = isUserOnline(uid);
      }
      socket.emit("presence:status", result);
    });
    socket.on("disconnect", () => {
      logger.info({ userId }, "Socket disconnected");
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("presence:offline", { userId });
        }
      }
    });
  });
  return io;
}
var import_socket, import_drizzle_orm, io, onlineUsers;
var init_socket = __esm({
  "src/lib/socket.ts"() {
    "use strict";
    import_socket = require("socket.io");
    init_auth();
    init_logger();
    init_src();
    import_drizzle_orm = require("drizzle-orm");
    onlineUsers = /* @__PURE__ */ new Map();
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_http = __toESM(require("http"));
var import_path2 = __toESM(require("path"));
var import_express20 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_compression = __toESM(require("compression"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_pino_http = __toESM(require("pino-http"));
var import_express_rate_limit2 = __toESM(require("express-rate-limit"));
init_logger();
init_socket();
init_socket();

// src/routes/auth.ts
var import_express = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_crypto = __toESM(require("crypto"));
var import_drizzle_orm2 = require("drizzle-orm");
init_src();

// ../../lib/api-zod/src/generated/api.ts
var zod = __toESM(require("zod"), 1);
var HealthCheckResponse = zod.object({
  "status": zod.string()
});
var registerBodyPasswordMin = 6;
var RegisterBody = zod.object({
  "email": zod.string().email(),
  "password": zod.string().min(registerBodyPasswordMin),
  "name": zod.string().min(1),
  "role": zod.enum(["freelancer", "client"]),
  "university": zod.string().optional()
});
var LoginBody = zod.object({
  "email": zod.string().email(),
  "password": zod.string()
});
var LoginResponse = zod.object({
  "user": zod.object({
    "id": zod.number(),
    "email": zod.string(),
    "name": zod.string(),
    "role": zod.enum(["freelancer", "client"]),
    "university": zod.string().nullish(),
    "avatarUrl": zod.string().nullish(),
    "createdAt": zod.coerce.date()
  }),
  "token": zod.string()
});
var LogoutResponse = zod.object({
  "message": zod.string()
});
var GetMeResponse = zod.object({
  "id": zod.number(),
  "email": zod.string(),
  "name": zod.string(),
  "role": zod.enum(["freelancer", "client"]),
  "university": zod.string().nullish(),
  "avatarUrl": zod.string().nullish(),
  "createdAt": zod.coerce.date()
});
var GetUserParams = zod.object({
  "id": zod.coerce.number()
});
var GetUserResponse = zod.object({
  "id": zod.number(),
  "email": zod.string(),
  "name": zod.string(),
  "role": zod.enum(["freelancer", "client"]),
  "university": zod.string().nullish(),
  "avatarUrl": zod.string().nullish(),
  "createdAt": zod.coerce.date()
});
var UpdateUserParams = zod.object({
  "id": zod.coerce.number()
});
var UpdateUserBody = zod.object({
  "name": zod.string().optional(),
  "university": zod.string().optional(),
  "avatarUrl": zod.string().optional()
});
var UpdateUserResponse = zod.object({
  "id": zod.number(),
  "email": zod.string(),
  "name": zod.string(),
  "role": zod.enum(["freelancer", "client"]),
  "university": zod.string().nullish(),
  "avatarUrl": zod.string().nullish(),
  "createdAt": zod.coerce.date()
});
var listFreelancersQueryLimitDefault = 20;
var listFreelancersQueryOffsetDefault = 0;
var ListFreelancersQueryParams = zod.object({
  "skill": zod.coerce.string().optional(),
  "search": zod.coerce.string().optional(),
  "limit": zod.coerce.number().default(listFreelancersQueryLimitDefault),
  "offset": zod.coerce.number().default(listFreelancersQueryOffsetDefault)
});
var ListFreelancersResponseItem = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "user": zod.object({
    "id": zod.number(),
    "email": zod.string(),
    "name": zod.string(),
    "role": zod.enum(["freelancer", "client"]),
    "university": zod.string().nullish(),
    "avatarUrl": zod.string().nullish(),
    "createdAt": zod.coerce.date()
  }).optional(),
  "headline": zod.string(),
  "bio": zod.string(),
  "hourlyRate": zod.number(),
  "availabilityStatus": zod.enum(["available", "busy", "unavailable"]).optional(),
  "totalEarnings": zod.number().optional(),
  "completedProjects": zod.number().optional(),
  "averageRating": zod.number().nullish(),
  "totalReviews": zod.number().optional(),
  "skills": zod.array(zod.object({
    "id": zod.number(),
    "skillId": zod.number(),
    "skillName": zod.string(),
    "skillCategory": zod.string().optional(),
    "proficiencyLevel": zod.enum(["beginner", "intermediate", "advanced", "expert"])
  })).optional(),
  "portfolio": zod.array(zod.object({
    "id": zod.number(),
    "title": zod.string(),
    "description": zod.string(),
    "imageUrl": zod.string().nullish(),
    "projectUrl": zod.string().nullish(),
    "tags": zod.array(zod.string()).optional(),
    "createdAt": zod.coerce.date()
  })).optional(),
  "createdAt": zod.coerce.date()
});
var ListFreelancersResponse = zod.array(ListFreelancersResponseItem);
var GetFreelancerParams = zod.object({
  "id": zod.coerce.number()
});
var GetFreelancerResponse = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "user": zod.object({
    "id": zod.number(),
    "email": zod.string(),
    "name": zod.string(),
    "role": zod.enum(["freelancer", "client"]),
    "university": zod.string().nullish(),
    "avatarUrl": zod.string().nullish(),
    "createdAt": zod.coerce.date()
  }).optional(),
  "headline": zod.string(),
  "bio": zod.string(),
  "hourlyRate": zod.number(),
  "availabilityStatus": zod.enum(["available", "busy", "unavailable"]).optional(),
  "totalEarnings": zod.number().optional(),
  "completedProjects": zod.number().optional(),
  "averageRating": zod.number().nullish(),
  "totalReviews": zod.number().optional(),
  "skills": zod.array(zod.object({
    "id": zod.number(),
    "skillId": zod.number(),
    "skillName": zod.string(),
    "skillCategory": zod.string().optional(),
    "proficiencyLevel": zod.enum(["beginner", "intermediate", "advanced", "expert"])
  })).optional(),
  "portfolio": zod.array(zod.object({
    "id": zod.number(),
    "title": zod.string(),
    "description": zod.string(),
    "imageUrl": zod.string().nullish(),
    "projectUrl": zod.string().nullish(),
    "tags": zod.array(zod.string()).optional(),
    "createdAt": zod.coerce.date()
  })).optional(),
  "createdAt": zod.coerce.date()
});
var GetMyFreelancerProfileResponse = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "user": zod.object({
    "id": zod.number(),
    "email": zod.string(),
    "name": zod.string(),
    "role": zod.enum(["freelancer", "client"]),
    "university": zod.string().nullish(),
    "avatarUrl": zod.string().nullish(),
    "createdAt": zod.coerce.date()
  }).optional(),
  "headline": zod.string(),
  "bio": zod.string(),
  "hourlyRate": zod.number(),
  "availabilityStatus": zod.enum(["available", "busy", "unavailable"]).optional(),
  "totalEarnings": zod.number().optional(),
  "completedProjects": zod.number().optional(),
  "averageRating": zod.number().nullish(),
  "totalReviews": zod.number().optional(),
  "skills": zod.array(zod.object({
    "id": zod.number(),
    "skillId": zod.number(),
    "skillName": zod.string(),
    "skillCategory": zod.string().optional(),
    "proficiencyLevel": zod.enum(["beginner", "intermediate", "advanced", "expert"])
  })).optional(),
  "portfolio": zod.array(zod.object({
    "id": zod.number(),
    "title": zod.string(),
    "description": zod.string(),
    "imageUrl": zod.string().nullish(),
    "projectUrl": zod.string().nullish(),
    "tags": zod.array(zod.string()).optional(),
    "createdAt": zod.coerce.date()
  })).optional(),
  "createdAt": zod.coerce.date()
});
var CreateFreelancerProfileBody = zod.object({
  "headline": zod.string(),
  "bio": zod.string(),
  "hourlyRate": zod.number(),
  "availabilityStatus": zod.enum(["available", "busy", "unavailable"]).optional()
});
var UpdateFreelancerProfileBody = zod.object({
  "headline": zod.string().optional(),
  "bio": zod.string().optional(),
  "hourlyRate": zod.number().optional(),
  "availabilityStatus": zod.enum(["available", "busy", "unavailable"]).optional()
});
var UpdateFreelancerProfileResponse = zod.object({
  "id": zod.number(),
  "userId": zod.number(),
  "user": zod.object({
    "id": zod.number(),
    "email": zod.string(),
    "name": zod.string(),
    "role": zod.enum(["freelancer", "client"]),
    "university": zod.string().nullish(),
    "avatarUrl": zod.string().nullish(),
    "createdAt": zod.coerce.date()
  }).optional(),
  "headline": zod.string(),
  "bio": zod.string(),
  "hourlyRate": zod.number(),
  "availabilityStatus": zod.enum(["available", "busy", "unavailable"]).optional(),
  "totalEarnings": zod.number().optional(),
  "completedProjects": zod.number().optional(),
  "averageRating": zod.number().nullish(),
  "totalReviews": zod.number().optional(),
  "skills": zod.array(zod.object({
    "id": zod.number(),
    "skillId": zod.number(),
    "skillName": zod.string(),
    "skillCategory": zod.string().optional(),
    "proficiencyLevel": zod.enum(["beginner", "intermediate", "advanced", "expert"])
  })).optional(),
  "portfolio": zod.array(zod.object({
    "id": zod.number(),
    "title": zod.string(),
    "description": zod.string(),
    "imageUrl": zod.string().nullish(),
    "projectUrl": zod.string().nullish(),
    "tags": zod.array(zod.string()).optional(),
    "createdAt": zod.coerce.date()
  })).optional(),
  "createdAt": zod.coerce.date()
});
var ListSkillsResponseItem = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "category": zod.string()
});
var ListSkillsResponse = zod.array(ListSkillsResponseItem);
var ListMySkillsResponseItem = zod.object({
  "id": zod.number(),
  "skillId": zod.number(),
  "skillName": zod.string(),
  "skillCategory": zod.string().optional(),
  "proficiencyLevel": zod.enum(["beginner", "intermediate", "advanced", "expert"])
});
var ListMySkillsResponse = zod.array(ListMySkillsResponseItem);
var AddSkillBody = zod.object({
  "skillId": zod.number(),
  "proficiencyLevel": zod.enum(["beginner", "intermediate", "advanced", "expert"])
});
var RemoveSkillParams = zod.object({
  "skillId": zod.coerce.number()
});
var RemoveSkillResponse = zod.object({
  "message": zod.string()
});
var ListMyPortfolioResponseItem = zod.object({
  "id": zod.number(),
  "title": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().nullish(),
  "projectUrl": zod.string().nullish(),
  "tags": zod.array(zod.string()).optional(),
  "createdAt": zod.coerce.date()
});
var ListMyPortfolioResponse = zod.array(ListMyPortfolioResponseItem);
var AddPortfolioItemBody = zod.object({
  "title": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().optional(),
  "projectUrl": zod.string().optional(),
  "tags": zod.array(zod.string()).optional()
});
var DeletePortfolioItemParams = zod.object({
  "itemId": zod.coerce.number()
});
var DeletePortfolioItemResponse = zod.object({
  "message": zod.string()
});
var GetFreelancerPortfolioParams = zod.object({
  "id": zod.coerce.number()
});
var GetFreelancerPortfolioResponseItem = zod.object({
  "id": zod.number(),
  "title": zod.string(),
  "description": zod.string(),
  "imageUrl": zod.string().nullish(),
  "projectUrl": zod.string().nullish(),
  "tags": zod.array(zod.string()).optional(),
  "createdAt": zod.coerce.date()
});
var GetFreelancerPortfolioResponse = zod.array(GetFreelancerPortfolioResponseItem);
var listProjectsQueryLimitDefault = 20;
var listProjectsQueryOffsetDefault = 0;
var ListProjectsQueryParams = zod.object({
  "category": zod.coerce.string().optional(),
  "search": zod.coerce.string().optional(),
  "status": zod.coerce.string().optional(),
  "limit": zod.coerce.number().default(listProjectsQueryLimitDefault),
  "offset": zod.coerce.number().default(listProjectsQueryOffsetDefault)
});
var ListProjectsResponseItem = zod.object({
  "id": zod.number(),
  "title": zod.string(),
  "description": zod.string(),
  "category": zod.string(),
  "budgetMin": zod.number(),
  "budgetMax": zod.number(),
  "timelineWeeks": zod.number().nullish(),
  "status": zod.enum(["open", "in_progress", "completed", "cancelled"]),
  "clientId": zod.number(),
  "clientName": zod.string().nullish(),
  "requiredSkills": zod.array(zod.string()).optional(),
  "applicationCount": zod.number().optional(),
  "createdAt": zod.coerce.date()
});
var ListProjectsResponse = zod.array(ListProjectsResponseItem);
var CreateProjectBody = zod.object({
  "title": zod.string(),
  "description": zod.string(),
  "category": zod.string(),
  "budgetMin": zod.number(),
  "budgetMax": zod.number(),
  "timelineWeeks": zod.number().optional(),
  "requiredSkills": zod.array(zod.string()).optional()
});
var GetProjectParams = zod.object({
  "id": zod.coerce.number()
});
var GetProjectResponse = zod.object({
  "id": zod.number(),
  "title": zod.string(),
  "description": zod.string(),
  "category": zod.string(),
  "budgetMin": zod.number(),
  "budgetMax": zod.number(),
  "timelineWeeks": zod.number().nullish(),
  "status": zod.enum(["open", "in_progress", "completed", "cancelled"]),
  "clientId": zod.number(),
  "clientName": zod.string().nullish(),
  "requiredSkills": zod.array(zod.string()).optional(),
  "applicationCount": zod.number().optional(),
  "createdAt": zod.coerce.date()
});
var UpdateProjectParams = zod.object({
  "id": zod.coerce.number()
});
var UpdateProjectBody = zod.object({
  "title": zod.string().optional(),
  "description": zod.string().optional(),
  "category": zod.string().optional(),
  "budgetMin": zod.number().optional(),
  "budgetMax": zod.number().optional(),
  "timelineWeeks": zod.number().optional(),
  "status": zod.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  "requiredSkills": zod.array(zod.string()).optional()
});
var UpdateProjectResponse = zod.object({
  "id": zod.number(),
  "title": zod.string(),
  "description": zod.string(),
  "category": zod.string(),
  "budgetMin": zod.number(),
  "budgetMax": zod.number(),
  "timelineWeeks": zod.number().nullish(),
  "status": zod.enum(["open", "in_progress", "completed", "cancelled"]),
  "clientId": zod.number(),
  "clientName": zod.string().nullish(),
  "requiredSkills": zod.array(zod.string()).optional(),
  "applicationCount": zod.number().optional(),
  "createdAt": zod.coerce.date()
});
var DeleteProjectParams = zod.object({
  "id": zod.coerce.number()
});
var DeleteProjectResponse = zod.object({
  "message": zod.string()
});
var ListMyProjectsResponseItem = zod.object({
  "id": zod.number(),
  "title": zod.string(),
  "description": zod.string(),
  "category": zod.string(),
  "budgetMin": zod.number(),
  "budgetMax": zod.number(),
  "timelineWeeks": zod.number().nullish(),
  "status": zod.enum(["open", "in_progress", "completed", "cancelled"]),
  "clientId": zod.number(),
  "clientName": zod.string().nullish(),
  "requiredSkills": zod.array(zod.string()).optional(),
  "applicationCount": zod.number().optional(),
  "createdAt": zod.coerce.date()
});
var ListMyProjectsResponse = zod.array(ListMyProjectsResponseItem);
var ApplyToProjectBody = zod.object({
  "projectId": zod.number(),
  "coverLetter": zod.string(),
  "proposedRate": zod.number()
});
var ListMyApplicationsResponseItem = zod.object({
  "id": zod.number(),
  "projectId": zod.number(),
  "projectTitle": zod.string().nullish(),
  "freelancerId": zod.number(),
  "freelancerName": zod.string().nullish(),
  "freelancerHeadline": zod.string().nullish(),
  "coverLetter": zod.string(),
  "proposedRate": zod.number(),
  "status": zod.enum(["pending", "accepted", "rejected"]),
  "createdAt": zod.coerce.date()
});
var ListMyApplicationsResponse = zod.array(ListMyApplicationsResponseItem);
var ListProjectApplicationsParams = zod.object({
  "projectId": zod.coerce.number()
});
var ListProjectApplicationsResponseItem = zod.object({
  "id": zod.number(),
  "projectId": zod.number(),
  "projectTitle": zod.string().nullish(),
  "freelancerId": zod.number(),
  "freelancerName": zod.string().nullish(),
  "freelancerHeadline": zod.string().nullish(),
  "coverLetter": zod.string(),
  "proposedRate": zod.number(),
  "status": zod.enum(["pending", "accepted", "rejected"]),
  "createdAt": zod.coerce.date()
});
var ListProjectApplicationsResponse = zod.array(ListProjectApplicationsResponseItem);
var UpdateApplicationStatusParams = zod.object({
  "id": zod.coerce.number()
});
var UpdateApplicationStatusBody = zod.object({
  "status": zod.enum(["accepted", "rejected"])
});
var UpdateApplicationStatusResponse = zod.object({
  "id": zod.number(),
  "projectId": zod.number(),
  "projectTitle": zod.string().nullish(),
  "freelancerId": zod.number(),
  "freelancerName": zod.string().nullish(),
  "freelancerHeadline": zod.string().nullish(),
  "coverLetter": zod.string(),
  "proposedRate": zod.number(),
  "status": zod.enum(["pending", "accepted", "rejected"]),
  "createdAt": zod.coerce.date()
});
var GetFreelancerDashboardResponse = zod.object({
  "totalEarnings": zod.number(),
  "activeApplications": zod.number(),
  "acceptedApplications": zod.number(),
  "profileViews": zod.number(),
  "averageRating": zod.number().nullable(),
  "recentApplications": zod.array(zod.object({
    "id": zod.number(),
    "projectId": zod.number(),
    "projectTitle": zod.string().nullish(),
    "freelancerId": zod.number(),
    "freelancerName": zod.string().nullish(),
    "freelancerHeadline": zod.string().nullish(),
    "coverLetter": zod.string(),
    "proposedRate": zod.number(),
    "status": zod.enum(["pending", "accepted", "rejected"]),
    "createdAt": zod.coerce.date()
  }))
});
var GetClientDashboardResponse = zod.object({
  "totalProjectsPosted": zod.number(),
  "openProjects": zod.number(),
  "totalApplicationsReceived": zod.number(),
  "totalSpent": zod.number(),
  "recentProjects": zod.array(zod.object({
    "id": zod.number(),
    "title": zod.string(),
    "description": zod.string(),
    "category": zod.string(),
    "budgetMin": zod.number(),
    "budgetMax": zod.number(),
    "timelineWeeks": zod.number().nullish(),
    "status": zod.enum(["open", "in_progress", "completed", "cancelled"]),
    "clientId": zod.number(),
    "clientName": zod.string().nullish(),
    "requiredSkills": zod.array(zod.string()).optional(),
    "applicationCount": zod.number().optional(),
    "createdAt": zod.coerce.date()
  }))
});
var GetAiRecommendationsResponseItem = zod.object({
  "project": zod.object({
    "id": zod.number(),
    "title": zod.string(),
    "description": zod.string(),
    "category": zod.string(),
    "budgetMin": zod.number(),
    "budgetMax": zod.number(),
    "timelineWeeks": zod.number().nullish(),
    "status": zod.enum(["open", "in_progress", "completed", "cancelled"]),
    "clientId": zod.number(),
    "clientName": zod.string().nullish(),
    "requiredSkills": zod.array(zod.string()).optional(),
    "applicationCount": zod.number().optional(),
    "createdAt": zod.coerce.date()
  }),
  "matchScore": zod.number(),
  "matchReasons": zod.array(zod.string())
});
var GetAiRecommendationsResponse = zod.array(GetAiRecommendationsResponseItem);

// src/routes/auth.ts
init_auth();

// src/lib/email.ts
var import_resend = require("resend");
init_logger();
var resend = process.env.RESEND_API_KEY ? new import_resend.Resend(process.env.RESEND_API_KEY) : null;
var FROM_EMAIL = process.env.FROM_EMAIL ?? "SkillMarket AI <noreply@skillmarketai.com>";
function getBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (req?.get && req?.protocol) return `${req.protocol}://${req.get("host")}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}
async function sendVerificationEmail(to, name, token, req) {
  const baseUrl = getBaseUrl(req);
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  if (!resend) {
    logger.info({ verifyUrl }, "Email provider not configured \u2014 verification URL logged for dev");
    return;
  }
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center">
            <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;margin-bottom:12px">S</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">SkillMarket AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700">Verify your email address</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6">Hi ${name}, thanks for joining! Please verify your email to unlock all features including posting projects, applying for work, and sending messages.</p>
            <div style="text-align:center;margin:32px 0">
              <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:.01em">Verify my email</a>
            </div>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px">Or copy this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:12px;color:#9ca3af;word-break:break-all;background:#f9fafb;padding:10px 14px;border-radius:8px">${verifyUrl}</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6;padding-top:20px">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify your SkillMarket AI email address",
      html
    });
    logger.info({ to }, "Verification email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send verification email");
  }
}

// src/routes/auth.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"));
var router = (0, import_express.Router)();
var resendLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many resend requests. Please wait a minute before trying again." }
});
function validatePasswordStrength(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}
router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const { email, password, name, role, university } = parsed.data;
  const pwError = validatePasswordStrength(password);
  if (pwError) {
    res.status(400).json({ error: pwError });
    return;
  }
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where((0, import_drizzle_orm2.eq)(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }
  const passwordHash = await import_bcryptjs.default.hash(password, 12);
  const emailVerificationToken = import_crypto.default.randomBytes(32).toString("hex");
  const now = /* @__PURE__ */ new Date();
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    name,
    role,
    university: university ?? null,
    emailVerificationToken,
    emailVerificationSentAt: now
  }).returning();
  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  setTokenCookie(res, token);
  sendVerificationEmail(email, name, emailVerificationToken, req).catch(() => {
  });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt }
  });
});
router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm2.eq)(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await import_bcryptjs.default.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  setTokenCookie(res, token);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt }
  });
});
router.post("/logout", (_req, res) => {
  clearTokenCookie(res);
  res.json({ message: "Logged out" });
});
router.get("/verify-email", async (req, res) => {
  const token = req.query.token;
  if (!token) {
    res.status(400).json({ error: "Token required" });
    return;
  }
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, emailVerificationSentAt: usersTable.emailVerificationSentAt }).from(usersTable).where((0, import_drizzle_orm2.eq)(usersTable.emailVerificationToken, token));
  if (!user) {
    res.status(400).json({ error: "Invalid or expired verification link. Please request a new one." });
    return;
  }
  if (user.emailVerificationSentAt) {
    const expiresAt = new Date(user.emailVerificationSentAt.getTime() + 24 * 60 * 60 * 1e3);
    if (/* @__PURE__ */ new Date() > expiresAt) {
      res.status(400).json({ error: "This verification link has expired. Please request a new one.", code: "TOKEN_EXPIRED" });
      return;
    }
  }
  await db.update(usersTable).set({ emailVerified: true, emailVerificationToken: null, emailVerificationSentAt: null }).where((0, import_drizzle_orm2.eq)(usersTable.id, user.id));
  res.json({ message: "Email verified successfully", email: user.email });
});
router.post("/resend-verification", requireAuth, resendLimiter, async (req, res) => {
  const [user] = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    emailVerified: usersTable.emailVerified,
    emailVerificationSentAt: usersTable.emailVerificationSentAt
  }).from(usersTable).where((0, import_drizzle_orm2.eq)(usersTable.id, req.user.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.emailVerified) {
    res.json({ message: "Email is already verified." });
    return;
  }
  if (user.emailVerificationSentAt) {
    const secondsSinceLast = (Date.now() - user.emailVerificationSentAt.getTime()) / 1e3;
    if (secondsSinceLast < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLast);
      res.status(429).json({ error: `Please wait ${waitSeconds} seconds before requesting another verification email.` });
      return;
    }
  }
  const emailVerificationToken = import_crypto.default.randomBytes(32).toString("hex");
  const now = /* @__PURE__ */ new Date();
  await db.update(usersTable).set({ emailVerificationToken, emailVerificationSentAt: now }).where((0, import_drizzle_orm2.eq)(usersTable.id, user.id));
  sendVerificationEmail(user.email, user.name, emailVerificationToken, req).catch(() => {
  });
  res.json({ message: "Verification email sent. Please check your inbox." });
});
router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm2.eq)(usersTable.id, req.user.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt });
});
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email }).from(usersTable).where((0, import_drizzle_orm2.eq)(usersTable.email, email.toLowerCase().trim()));
  if (!user) {
    res.json({ message: "If that email is registered, a reset link has been sent." });
    return;
  }
  await db.delete(passwordResetTokensTable).where((0, import_drizzle_orm2.eq)(passwordResetTokensTable.userId, user.id));
  const token = import_crypto.default.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
  await db.insert(passwordResetTokensTable).values({ userId: user.id, token, expiresAt });
  res.json({ token, message: "Reset link generated." });
});
router.get("/verify-reset-token/:token", async (req, res) => {
  const { token } = req.params;
  if (!token) {
    res.status(400).json({ valid: false, reason: "missing" });
    return;
  }
  const [row] = await db.select({ id: passwordResetTokensTable.id, userId: passwordResetTokensTable.userId, expiresAt: passwordResetTokensTable.expiresAt, usedAt: passwordResetTokensTable.usedAt }).from(passwordResetTokensTable).where((0, import_drizzle_orm2.eq)(passwordResetTokensTable.token, token));
  if (!row) {
    res.json({ valid: false, reason: "invalid" });
    return;
  }
  if (row.usedAt) {
    res.json({ valid: false, reason: "invalid" });
    return;
  }
  if (/* @__PURE__ */ new Date() > row.expiresAt) {
    res.json({ valid: false, reason: "expired" });
    return;
  }
  const [user] = await db.select({ email: usersTable.email }).from(usersTable).where((0, import_drizzle_orm2.eq)(usersTable.id, row.userId));
  res.json({ valid: true, email: user?.email ?? "" });
});
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }
  const pwError = validatePasswordStrength(password);
  if (pwError) {
    res.status(400).json({ error: pwError });
    return;
  }
  const now = /* @__PURE__ */ new Date();
  const [row] = await db.select().from(passwordResetTokensTable).where((0, import_drizzle_orm2.and)((0, import_drizzle_orm2.eq)(passwordResetTokensTable.token, token), (0, import_drizzle_orm2.gt)(passwordResetTokensTable.expiresAt, now)));
  if (!row) {
    res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
    return;
  }
  if (row.usedAt) {
    res.status(400).json({ error: "This reset link has already been used." });
    return;
  }
  const passwordHash = await import_bcryptjs.default.hash(password, 12);
  await Promise.all([
    db.update(usersTable).set({ passwordHash }).where((0, import_drizzle_orm2.eq)(usersTable.id, row.userId)),
    db.update(passwordResetTokensTable).set({ usedAt: now }).where((0, import_drizzle_orm2.eq)(passwordResetTokensTable.id, row.id))
  ]);
  res.json({ message: "Password reset successfully." });
});
var auth_default = router;

// src/routes/users.ts
var import_express2 = require("express");
var import_drizzle_orm3 = require("drizzle-orm");
init_src();
init_auth();
init_socket();
var router2 = (0, import_express2.Router)();
function isValidAvatarUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
router2.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm3.eq)(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    university: user.university,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    companyName: user.companyName,
    companyDescription: user.companyDescription,
    companyLogoUrl: user.companyLogoUrl,
    website: user.website,
    isOnline: isUserOnline(user.id),
    createdAt: user.createdAt
  });
});
router2.get("/:id/client-profile", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm3.eq)(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.role !== "client") {
    res.status(404).json({ error: "Not a client" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    companyName: user.companyName,
    companyDescription: user.companyDescription,
    companyLogoUrl: user.companyLogoUrl,
    website: user.website,
    isOnline: isUserOnline(user.id),
    createdAt: user.createdAt
  });
});
router2.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (req.user.userId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  if (parsed.data.avatarUrl && !isValidAvatarUrl(parsed.data.avatarUrl)) {
    res.status(400).json({ error: "avatarUrl must be a valid https:// URL" });
    return;
  }
  const updates = {};
  if (parsed.data.name !== void 0) updates.name = parsed.data.name;
  if (parsed.data.university !== void 0) updates.university = parsed.data.university;
  if (parsed.data.avatarUrl !== void 0) updates.avatarUrl = parsed.data.avatarUrl;
  const body = req.body;
  if (body.companyName !== void 0) updates.companyName = body.companyName || null;
  if (body.companyDescription !== void 0) updates.companyDescription = body.companyDescription || null;
  if (body.companyLogoUrl !== void 0) {
    if (body.companyLogoUrl && !isValidAvatarUrl(body.companyLogoUrl)) {
      res.status(400).json({ error: "companyLogoUrl must be a valid https:// URL" });
      return;
    }
    updates.companyLogoUrl = body.companyLogoUrl || null;
  }
  if (body.website !== void 0) {
    if (body.website && !isValidAvatarUrl(body.website)) {
      res.status(400).json({ error: "website must be a valid https:// URL" });
      return;
    }
    updates.website = body.website || null;
  }
  if (Object.keys(updates).length === 0) {
    const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm3.eq)(usersTable.id, id));
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, companyName: user.companyName, companyDescription: user.companyDescription, companyLogoUrl: user.companyLogoUrl, website: user.website, createdAt: user.createdAt });
    return;
  }
  const [updated] = await db.update(usersTable).set(updates).where((0, import_drizzle_orm3.eq)(usersTable.id, id)).returning();
  res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, university: updated.university, avatarUrl: updated.avatarUrl, emailVerified: updated.emailVerified, companyName: updated.companyName, companyDescription: updated.companyDescription, companyLogoUrl: updated.companyLogoUrl, website: updated.website, createdAt: updated.createdAt });
});
router2.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (req.user.userId !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(usersTable).where((0, import_drizzle_orm3.eq)(usersTable.id, id));
  res.json({ message: "Account deleted" });
});
var users_default = router2;

// src/routes/freelancers.ts
var import_express3 = require("express");
var import_drizzle_orm4 = require("drizzle-orm");
init_src();
init_auth();
var router3 = (0, import_express3.Router)();
function buildProfile(profile, user, skills, portfolio, matchScore) {
  return {
    id: profile.id,
    userId: profile.userId,
    user: { id: user.id, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, emailVerified: user.emailVerified, createdAt: user.createdAt },
    headline: profile.headline,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate,
    availabilityStatus: profile.availabilityStatus,
    totalEarnings: profile.totalEarnings,
    completedProjects: profile.completedProjects,
    averageRating: profile.averageRating,
    totalReviews: profile.totalReviews,
    profileViews: profile.profileViews,
    skills,
    portfolio,
    createdAt: profile.createdAt,
    ...matchScore !== void 0 ? { matchScore } : {}
  };
}
async function attachSkillsAndPortfolio(profileIds) {
  if (profileIds.length === 0) return { skillsMap: /* @__PURE__ */ new Map(), portfolioMap: /* @__PURE__ */ new Map() };
  const [allSkills, allPortfolio] = await Promise.all([
    db.select({
      id: freelancerSkillsTable.id,
      freelancerProfileId: freelancerSkillsTable.freelancerProfileId,
      skillId: freelancerSkillsTable.skillId,
      skillName: skillsTable.name,
      skillCategory: skillsTable.category,
      proficiencyLevel: freelancerSkillsTable.proficiencyLevel
    }).from(freelancerSkillsTable).innerJoin(skillsTable, (0, import_drizzle_orm4.eq)(freelancerSkillsTable.skillId, skillsTable.id)).where((0, import_drizzle_orm4.inArray)(freelancerSkillsTable.freelancerProfileId, profileIds)),
    db.select().from(portfolioItemsTable).where((0, import_drizzle_orm4.inArray)(portfolioItemsTable.freelancerProfileId, profileIds))
  ]);
  const skillsMap = /* @__PURE__ */ new Map();
  const portfolioMap = /* @__PURE__ */ new Map();
  for (const s of allSkills) {
    if (!skillsMap.has(s.freelancerProfileId)) skillsMap.set(s.freelancerProfileId, []);
    skillsMap.get(s.freelancerProfileId).push(s);
  }
  for (const p of allPortfolio) {
    if (!portfolioMap.has(p.freelancerProfileId)) portfolioMap.set(p.freelancerProfileId, []);
    portfolioMap.get(p.freelancerProfileId).push(p);
  }
  return { skillsMap, portfolioMap };
}
function computeMatchScore(freelancerSkillNames, requiredSkills, averageRating, availabilityStatus) {
  const normalizedRequired = requiredSkills.map((s) => s.toLowerCase().trim());
  const normalizedFreelancer = freelancerSkillNames.map((s) => s.toLowerCase().trim());
  let skillScore = 0;
  if (normalizedRequired.length > 0) {
    const matches = normalizedRequired.filter(
      (req) => normalizedFreelancer.some((fs2) => fs2.includes(req) || req.includes(fs2))
    ).length;
    skillScore = Math.round(matches / normalizedRequired.length * 70);
  } else {
    skillScore = 70;
  }
  const ratingScore = averageRating ? Math.round(averageRating / 5 * 20) : 10;
  let availScore = 0;
  if (availabilityStatus === "available") availScore = 10;
  else if (availabilityStatus === "part-time") availScore = 5;
  return Math.min(100, skillScore + ratingScore + availScore);
}
router3.get("/me", requireAuth, async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm4.eq)(usersTable.id, req.user.userId));
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio([profile.id]);
  res.json(buildProfile(profile, user, skillsMap.get(profile.id) ?? [], portfolioMap.get(profile.id) ?? []));
});
router3.post("/me", requireAuth, requireRole("freelancer"), async (req, res) => {
  const existing = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (existing.length > 0) {
    res.status(409).json({ error: "Freelancer profile already exists" });
    return;
  }
  const parsed = CreateFreelancerProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const [profile] = await db.insert(freelancerProfilesTable).values({
    userId: req.user.userId,
    headline: parsed.data.headline,
    bio: parsed.data.bio,
    hourlyRate: parsed.data.hourlyRate,
    availabilityStatus: parsed.data.availabilityStatus ?? "available"
  }).returning();
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm4.eq)(usersTable.id, req.user.userId));
  res.status(201).json(buildProfile(profile, user, [], []));
});
router3.patch("/me", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile found" });
    return;
  }
  const parsed = UpdateFreelancerProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const updates = {};
  if (parsed.data.headline !== void 0) updates.headline = parsed.data.headline;
  if (parsed.data.bio !== void 0) updates.bio = parsed.data.bio;
  if (parsed.data.hourlyRate !== void 0) updates.hourlyRate = parsed.data.hourlyRate;
  if (parsed.data.availabilityStatus !== void 0) updates.availabilityStatus = parsed.data.availabilityStatus;
  const [updated] = Object.keys(updates).length > 0 ? await db.update(freelancerProfilesTable).set(updates).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.id, profile.id)).returning() : [profile];
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm4.eq)(usersTable.id, req.user.userId));
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio([profile.id]);
  res.json(buildProfile(updated, user, skillsMap.get(profile.id) ?? [], portfolioMap.get(profile.id) ?? []));
});
router3.get("/me/skills", requireAuth, async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  const skills = await db.select({ id: freelancerSkillsTable.id, skillId: freelancerSkillsTable.skillId, skillName: skillsTable.name, skillCategory: skillsTable.category, proficiencyLevel: freelancerSkillsTable.proficiencyLevel }).from(freelancerSkillsTable).innerJoin(skillsTable, (0, import_drizzle_orm4.eq)(freelancerSkillsTable.skillId, skillsTable.id)).where((0, import_drizzle_orm4.eq)(freelancerSkillsTable.freelancerProfileId, profile.id));
  res.json(skills);
});
router3.post("/me/skills", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  const parsed = AddSkillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const [skill] = await db.insert(freelancerSkillsTable).values({
    freelancerProfileId: profile.id,
    skillId: parsed.data.skillId,
    proficiencyLevel: parsed.data.proficiencyLevel
  }).onConflictDoNothing().returning();
  if (!skill) {
    res.status(409).json({ error: "Skill already added" });
    return;
  }
  const [skillData] = await db.select().from(skillsTable).where((0, import_drizzle_orm4.eq)(skillsTable.id, skill.skillId));
  res.status(201).json({ id: skill.id, skillId: skill.skillId, skillName: skillData.name, skillCategory: skillData.category, proficiencyLevel: skill.proficiencyLevel });
});
router3.delete("/me/skills/:skillId", requireAuth, requireRole("freelancer"), async (req, res) => {
  const skillId = parseInt(req.params.skillId, 10);
  if (isNaN(skillId)) {
    res.status(400).json({ error: "Invalid skillId" });
    return;
  }
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  await db.delete(freelancerSkillsTable).where(
    import_drizzle_orm4.sql`${freelancerSkillsTable.freelancerProfileId} = ${profile.id} AND ${freelancerSkillsTable.skillId} = ${skillId}`
  );
  res.json({ message: "Skill removed" });
});
router3.get("/me/portfolio", requireAuth, async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  const portfolio = await db.select().from(portfolioItemsTable).where((0, import_drizzle_orm4.eq)(portfolioItemsTable.freelancerProfileId, profile.id));
  res.json(portfolio);
});
router3.post("/me/portfolio", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  const parsed = AddPortfolioItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const [item] = await db.insert(portfolioItemsTable).values({
    freelancerProfileId: profile.id,
    title: parsed.data.title,
    description: parsed.data.description,
    imageUrl: parsed.data.imageUrl ?? null,
    projectUrl: parsed.data.projectUrl ?? null,
    tags: parsed.data.tags ?? []
  }).returning();
  res.status(201).json(item);
});
router3.delete("/me/portfolio/:itemId", requireAuth, requireRole("freelancer"), async (req, res) => {
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(itemId)) {
    res.status(400).json({ error: "Invalid itemId" });
    return;
  }
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  await db.delete(portfolioItemsTable).where(
    import_drizzle_orm4.sql`${portfolioItemsTable.id} = ${itemId} AND ${portfolioItemsTable.freelancerProfileId} = ${profile.id}`
  );
  res.json({ message: "Portfolio item deleted" });
});
router3.get("/", optionalAuth, async (req, res) => {
  const skill = req.query.skill;
  const search = req.query.search;
  const projectId = req.query.projectId ? parseInt(req.query.projectId, 10) : void 0;
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const offset = parseInt(req.query.offset || "0", 10);
  let requiredSkills = [];
  if (projectId && !isNaN(projectId)) {
    const [project] = await db.select({ requiredSkills: projectsTable.requiredSkills }).from(projectsTable).where((0, import_drizzle_orm4.eq)(projectsTable.id, projectId));
    if (project?.requiredSkills) requiredSkills = project.requiredSkills;
  }
  let profileIds = null;
  if (skill) {
    const matchingSkills = await db.select({ id: skillsTable.id }).from(skillsTable).where((0, import_drizzle_orm4.ilike)(skillsTable.name, `%${skill}%`));
    if (matchingSkills.length === 0) {
      res.json([]);
      return;
    }
    const skillIds = matchingSkills.map((s) => s.id);
    const matched = await db.select({ freelancerProfileId: freelancerSkillsTable.freelancerProfileId }).from(freelancerSkillsTable).where((0, import_drizzle_orm4.inArray)(freelancerSkillsTable.skillId, skillIds));
    profileIds = [...new Set(matched.map((p) => p.freelancerProfileId))];
    if (profileIds.length === 0) {
      res.json([]);
      return;
    }
  }
  let query = db.select({
    profile: freelancerProfilesTable,
    user: { id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, university: usersTable.university, avatarUrl: usersTable.avatarUrl, emailVerified: usersTable.emailVerified, createdAt: usersTable.createdAt }
  }).from(freelancerProfilesTable).innerJoin(usersTable, (0, import_drizzle_orm4.eq)(freelancerProfilesTable.userId, usersTable.id)).$dynamic();
  const conditions = [];
  if (profileIds !== null) conditions.push((0, import_drizzle_orm4.inArray)(freelancerProfilesTable.id, profileIds));
  if (search) conditions.push((0, import_drizzle_orm4.or)((0, import_drizzle_orm4.ilike)(usersTable.name, `%${search}%`), (0, import_drizzle_orm4.ilike)(freelancerProfilesTable.headline, `%${search}%`), (0, import_drizzle_orm4.ilike)(freelancerProfilesTable.bio, `%${search}%`)));
  if (conditions.length === 1) query = query.where(conditions[0]);
  else if (conditions.length === 2) query = query.where(import_drizzle_orm4.sql`${conditions[0]} AND ${conditions[1]}`);
  const profiles = await query.limit(limit).offset(offset);
  if (profiles.length === 0) {
    res.json([]);
    return;
  }
  const pIds = profiles.map(({ profile }) => profile.id);
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio(pIds);
  const shouldComputeScore = projectId && !isNaN(projectId);
  const result = profiles.map(({ profile, user }) => {
    const freelancerSkills = skillsMap.get(profile.id) ?? [];
    const skillNames = freelancerSkills.map((s) => s.skillName);
    const matchScore = shouldComputeScore ? computeMatchScore(skillNames, requiredSkills, profile.averageRating, profile.availabilityStatus) : void 0;
    return buildProfile(
      profile,
      user,
      freelancerSkills,
      portfolioMap.get(profile.id) ?? [],
      matchScore
    );
  });
  if (shouldComputeScore) {
    result.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }
  res.json(result);
});
router3.get("/:id", optionalAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [profile] = await db.select().from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.id, id));
  if (!profile) {
    res.status(404).json({ error: "Freelancer not found" });
    return;
  }
  const isOwner = req.user?.userId === profile.userId;
  if (!isOwner) {
    await db.update(freelancerProfilesTable).set({ profileViews: import_drizzle_orm4.sql`${freelancerProfilesTable.profileViews} + 1` }).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.id, id));
  }
  const [user] = await db.select().from(usersTable).where((0, import_drizzle_orm4.eq)(usersTable.id, profile.userId));
  const { skillsMap, portfolioMap } = await attachSkillsAndPortfolio([profile.id]);
  const returnedViews = isOwner ? profile.profileViews ?? 0 : (profile.profileViews ?? 0) + 1;
  res.json(buildProfile({ ...profile, profileViews: returnedViews }, user, skillsMap.get(profile.id) ?? [], portfolioMap.get(profile.id) ?? []));
});
router3.get("/:id/portfolio", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm4.eq)(freelancerProfilesTable.id, id));
  if (!profile) {
    res.status(404).json({ error: "Freelancer not found" });
    return;
  }
  const portfolio = await db.select().from(portfolioItemsTable).where((0, import_drizzle_orm4.eq)(portfolioItemsTable.freelancerProfileId, profile.id));
  res.json(portfolio);
});
var freelancers_default = router3;

// src/routes/skills.ts
var import_express4 = require("express");
init_src();
var router4 = (0, import_express4.Router)();
router4.get("/", async (_req, res) => {
  const skills = await db.select().from(skillsTable).orderBy(skillsTable.category, skillsTable.name);
  res.json(skills);
});
var skills_default = router4;

// src/routes/portfolio.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
var portfolio_default = router5;

// src/routes/projects.ts
var import_express7 = require("express");

// src/routes/payments.ts
var import_express6 = require("express");
var import_drizzle_orm5 = require("drizzle-orm");
init_src();
init_auth();

// src/lib/paystack.ts
init_logger();
var PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
var BASE = "https://api.paystack.co";
var paystackEnabled = !!PAYSTACK_SECRET;
async function request(method, path3, body) {
  if (!PAYSTACK_SECRET) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured. Add it to your Replit secrets.");
  }
  const res = await fetch(`${BASE}${path3}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message ?? "Paystack request failed");
  return data.data;
}
async function initializePayment(opts) {
  return request("POST", "/transaction/initialize", {
    email: opts.email,
    amount: Math.round(opts.amountNGN * 100),
    // kobo
    reference: opts.reference,
    callback_url: opts.callbackUrl,
    metadata: opts.metadata ?? {}
  });
}
async function verifyPayment(reference) {
  return request("GET", `/transaction/verify/${reference}`);
}
async function initiateRefund(transactionId, amountNGN) {
  return request("POST", "/refund", {
    transaction: transactionId,
    ...amountNGN !== void 0 ? { amount: Math.round(amountNGN * 100) } : {}
  });
}
function generateReference(prefix = "SKM") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}
function generateInvoiceNumber() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `INV-${y}${m}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// src/routes/payments.ts
init_logger();
var router6 = (0, import_express6.Router)();
async function getOrCreateWallet(userId) {
  const [existing] = await db.select().from(walletsTable).where((0, import_drizzle_orm5.eq)(walletsTable.userId, userId));
  if (existing) return existing;
  const [wallet] = await db.insert(walletsTable).values({ userId }).returning();
  return wallet;
}
async function recordWalletTransaction(opts) {
  const [wallet] = await db.select().from(walletsTable).where((0, import_drizzle_orm5.eq)(walletsTable.id, opts.walletId));
  const balanceBefore = parseFloat(wallet.balance);
  const balanceAfter = opts.type === "credit" ? balanceBefore + opts.amount : balanceBefore - opts.amount;
  if (opts.type === "debit" && balanceAfter < 0) {
    throw new Error("Insufficient wallet balance");
  }
  await Promise.all([
    db.update(walletsTable).set({ balance: String(balanceAfter) }).where((0, import_drizzle_orm5.eq)(walletsTable.id, opts.walletId)),
    db.insert(walletTransactionsTable).values({
      walletId: opts.walletId,
      userId: opts.userId,
      type: opts.type,
      category: opts.category,
      amount: String(opts.amount),
      balanceBefore: String(balanceBefore),
      balanceAfter: String(balanceAfter),
      reference: opts.reference,
      description: opts.description,
      escrowTransactionId: opts.escrowTransactionId ?? null
    })
  ]);
  return { balanceBefore, balanceAfter };
}
router6.post("/initialize", requireAuth, requireRole("client"), async (req, res) => {
  const { projectId } = req.body;
  if (!projectId || isNaN(Number(projectId))) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const clientId = req.user.userId;
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm5.eq)(projectsTable.id, Number(projectId)));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.clientId !== clientId) {
    res.status(403).json({ error: "You do not own this project" });
    return;
  }
  if (project.status !== "in_progress") {
    res.status(400).json({ error: "Escrow can only be funded for in-progress projects" });
    return;
  }
  const [acceptedApp] = await db.select().from(applicationsTable).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(applicationsTable.projectId, project.id), (0, import_drizzle_orm5.eq)(applicationsTable.status, "accepted")));
  if (!acceptedApp) {
    res.status(400).json({ error: "No accepted application found for this project" });
    return;
  }
  const [existing] = await db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.projectId, project.id));
  if (existing && ["funded", "in_escrow", "released"].includes(existing.status)) {
    res.status(409).json({ error: "Escrow already funded for this project", escrow: existing });
    return;
  }
  const [client] = await db.select({ email: usersTable.email }).from(usersTable).where((0, import_drizzle_orm5.eq)(usersTable.id, clientId));
  const amount = parseFloat(String(acceptedApp.proposedRate));
  const reference = generateReference("ESC");
  let authUrl = "";
  let accessCode = "";
  let escrowRecord;
  if (!paystackEnabled) {
    if (existing) {
      [escrowRecord] = await db.update(escrowTransactionsTable).set({ paystackReference: reference, status: "pending" }).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.id, existing.id)).returning();
    } else {
      [escrowRecord] = await db.insert(escrowTransactionsTable).values({
        projectId: project.id,
        clientId,
        freelancerId: acceptedApp.freelancerId,
        amount: String(amount),
        status: "pending",
        paystackReference: reference
      }).returning();
    }
    res.json({
      authorizationUrl: null,
      reference,
      amount,
      devMode: true,
      message: "PAYSTACK_SECRET_KEY not set \u2014 use POST /api/payments/verify with this reference to simulate funding.",
      escrow: escrowRecord
    });
    return;
  }
  const appBaseUrl = process.env.APP_URL ?? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
  const callbackUrl = `${appBaseUrl}/payment/callback`;
  const paystackData = await initializePayment({
    email: client.email,
    amountNGN: amount,
    reference,
    callbackUrl,
    metadata: { projectId: project.id, clientId, freelancerId: acceptedApp.freelancerId, projectTitle: project.title }
  });
  authUrl = paystackData.authorization_url;
  accessCode = paystackData.access_code;
  if (existing) {
    [escrowRecord] = await db.update(escrowTransactionsTable).set({ paystackReference: reference, paystackAccessCode: accessCode, paystackAuthorizationUrl: authUrl, status: "pending" }).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.id, existing.id)).returning();
  } else {
    [escrowRecord] = await db.insert(escrowTransactionsTable).values({
      projectId: project.id,
      clientId,
      freelancerId: acceptedApp.freelancerId,
      amount: String(amount),
      status: "pending",
      paystackReference: reference,
      paystackAccessCode: accessCode,
      paystackAuthorizationUrl: authUrl
    }).returning();
  }
  res.json({ authorizationUrl: authUrl, reference, amount, escrow: escrowRecord });
});
router6.post("/verify", requireAuth, async (req, res) => {
  const { reference } = req.body;
  if (!reference) {
    res.status(400).json({ error: "reference is required" });
    return;
  }
  const [escrow] = await db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.paystackReference, reference));
  if (!escrow) {
    res.status(404).json({ error: "Escrow transaction not found" });
    return;
  }
  if (escrow.clientId !== req.user.userId && !req.user.role) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (["funded", "in_escrow", "released"].includes(escrow.status)) {
    res.json({ message: "Escrow already funded", escrow });
    return;
  }
  let verifiedAmount = parseFloat(String(escrow.amount));
  if (!paystackEnabled) {
    logger.info({ reference }, "Dev mode: simulating payment verification");
  } else {
    const verification = await verifyPayment(reference);
    if (verification.status !== "success") {
      res.status(400).json({ error: `Payment not successful: ${verification.gateway_response}` });
      return;
    }
    verifiedAmount = verification.amount / 100;
    await db.update(escrowTransactionsTable).set({ paystackTransactionId: String(verification.id) }).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.id, escrow.id));
  }
  const now = /* @__PURE__ */ new Date();
  await db.update(escrowTransactionsTable).set({ status: "in_escrow", fundedAt: now }).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.id, escrow.id));
  const clientWallet = await getOrCreateWallet(escrow.clientId);
  const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm5.eq)(projectsTable.id, escrow.projectId));
  await recordWalletTransaction({
    walletId: clientWallet.id,
    userId: escrow.clientId,
    type: "debit",
    category: "escrow_fund",
    amount: verifiedAmount,
    description: `Escrow funded for project: ${project?.title ?? `#${escrow.projectId}`}`,
    reference,
    escrowTransactionId: escrow.id
  }).catch(() => {
  });
  const invoiceNumber = generateInvoiceNumber();
  await db.insert(invoicesTable).values({
    invoiceNumber,
    escrowTransactionId: escrow.id,
    projectId: escrow.projectId,
    clientId: escrow.clientId,
    freelancerId: escrow.freelancerId,
    amount: String(verifiedAmount),
    type: "escrow_funded",
    paystackReference: reference
  }).catch(() => {
  });
  await Promise.all([
    db.insert(notificationsTable).values({
      userId: escrow.clientId,
      type: "payment",
      title: "Payment successful \u{1F4B3}",
      message: `Escrow of \u20A6${verifiedAmount.toLocaleString()} funded for "${project?.title}"`,
      link: `/wallet`
    }),
    db.insert(notificationsTable).values({
      userId: escrow.freelancerId,
      type: "payment",
      title: "Payment secured in escrow \u{1F512}",
      message: `Your payment of \u20A6${verifiedAmount.toLocaleString()} for "${project?.title}" is safely held in escrow`,
      link: `/wallet`
    })
  ]).catch(() => {
  });
  const [updated] = await db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.id, escrow.id));
  res.json({ message: "Payment verified and escrow funded", escrow: updated, invoiceNumber });
});
router6.get("/escrow/:projectId", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid projectId" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm5.eq)(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const uid = req.user.userId;
  const [acceptedApp] = await db.select().from(applicationsTable).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(applicationsTable.projectId, projectId), (0, import_drizzle_orm5.eq)(applicationsTable.status, "accepted")));
  if (project.clientId !== uid && acceptedApp?.freelancerId !== uid) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [escrow] = await db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.projectId, projectId));
  if (!escrow) {
    res.json({ exists: false, status: null, amount: acceptedApp?.proposedRate ?? null });
    return;
  }
  const [invoice] = await db.select().from(invoicesTable).where((0, import_drizzle_orm5.and)((0, import_drizzle_orm5.eq)(invoicesTable.escrowTransactionId, escrow.id), (0, import_drizzle_orm5.eq)(invoicesTable.type, "escrow_funded")));
  res.json({ exists: true, escrow, invoiceNumber: invoice?.invoiceNumber ?? null });
});
router6.post("/release/:projectId", requireAuth, requireRole("client"), async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid projectId" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm5.eq)(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.clientId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (project.status !== "completed") {
    res.status(400).json({ error: "Project must be marked completed before releasing payment" });
    return;
  }
  await releaseEscrow(projectId);
  const [escrow] = await db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.projectId, projectId));
  res.json({ message: "Payment released to freelancer", escrow });
});
router6.post("/refund/:projectId", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid projectId" });
    return;
  }
  const uid = req.user.userId;
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm5.eq)(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where((0, import_drizzle_orm5.eq)(usersTable.id, uid));
  if (project.clientId !== uid && !user?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [escrow] = await db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.projectId, projectId));
  if (!escrow) {
    res.status(404).json({ error: "No escrow found for this project" });
    return;
  }
  if (!["funded", "in_escrow"].includes(escrow.status)) {
    res.status(400).json({ error: "Escrow cannot be refunded in its current state" });
    return;
  }
  const amount = parseFloat(String(escrow.amount));
  const now = /* @__PURE__ */ new Date();
  if (paystackEnabled && escrow.paystackTransactionId) {
    await initiateRefund(escrow.paystackTransactionId, amount).catch((err) => {
      logger.warn({ err }, "Paystack refund initiation failed \u2014 proceeding with internal record");
    });
  }
  await db.update(escrowTransactionsTable).set({ status: "refunded", refundedAt: now }).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.id, escrow.id));
  const clientWallet = await getOrCreateWallet(escrow.clientId);
  const [proj] = await db.select({ title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm5.eq)(projectsTable.id, projectId));
  const ref = generateReference("REF");
  await recordWalletTransaction({
    walletId: clientWallet.id,
    userId: escrow.clientId,
    type: "credit",
    category: "refund",
    amount,
    description: `Refund for project: ${proj?.title ?? `#${projectId}`}`,
    reference: ref,
    escrowTransactionId: escrow.id
  }).catch(() => {
  });
  const invoiceNumber = generateInvoiceNumber();
  await db.insert(invoicesTable).values({
    invoiceNumber,
    escrowTransactionId: escrow.id,
    projectId,
    clientId: escrow.clientId,
    freelancerId: escrow.freelancerId,
    amount: String(amount),
    type: "refund",
    paystackReference: escrow.paystackReference ?? ref
  }).catch(() => {
  });
  await db.insert(notificationsTable).values({
    userId: escrow.clientId,
    type: "payment",
    title: "Refund processed",
    message: `Your payment of \u20A6${amount.toLocaleString()} for "${proj?.title}" has been refunded`,
    link: `/wallet`
  }).catch(() => {
  });
  res.json({ message: "Refund processed", invoiceNumber });
});
async function releaseEscrow(projectId) {
  const [escrow] = await db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.projectId, projectId));
  if (!escrow || !["funded", "in_escrow"].includes(escrow.status)) return;
  const amount = parseFloat(String(escrow.amount));
  const now = /* @__PURE__ */ new Date();
  const ref = generateReference("REL");
  await db.update(escrowTransactionsTable).set({ status: "released", releasedAt: now }).where((0, import_drizzle_orm5.eq)(escrowTransactionsTable.id, escrow.id));
  const [proj] = await db.select({ title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm5.eq)(projectsTable.id, projectId));
  const freelancerWallet = await getOrCreateWallet(escrow.freelancerId);
  await recordWalletTransaction({
    walletId: freelancerWallet.id,
    userId: escrow.freelancerId,
    type: "credit",
    category: "escrow_release",
    amount,
    description: `Payment released for project: ${proj?.title ?? `#${projectId}`}`,
    reference: ref,
    escrowTransactionId: escrow.id
  }).catch((err) => logger.error({ err }, "Failed to credit freelancer wallet on escrow release"));
  const invoiceNumber = generateInvoiceNumber();
  await db.insert(invoicesTable).values({
    invoiceNumber,
    escrowTransactionId: escrow.id,
    projectId,
    clientId: escrow.clientId,
    freelancerId: escrow.freelancerId,
    amount: String(amount),
    type: "escrow_released",
    paystackReference: escrow.paystackReference
  }).catch(() => {
  });
  await Promise.all([
    db.insert(notificationsTable).values({
      userId: escrow.freelancerId,
      type: "payment",
      title: "Payment received! \u{1F4B0}",
      message: `\u20A6${amount.toLocaleString()} has been credited to your wallet for "${proj?.title}"`,
      link: `/wallet`
    }),
    db.insert(notificationsTable).values({
      userId: escrow.clientId,
      type: "payment",
      title: "Payment released",
      message: `Payment of \u20A6${amount.toLocaleString()} released to freelancer for "${proj?.title}"`,
      link: `/wallet`
    })
  ]).catch(() => {
  });
}
var payments_default = router6;

// src/routes/projects.ts
var import_drizzle_orm6 = require("drizzle-orm");
init_src();
init_auth();
var router7 = (0, import_express7.Router)();
async function enrichProjects(projects) {
  if (projects.length === 0) return [];
  const clientIds = [...new Set(projects.map((p) => p.clientId))];
  const projectIds = projects.map((p) => p.id);
  const [clients, appCounts] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm6.inArray)(usersTable.id, clientIds)),
    db.select({ projectId: applicationsTable.projectId, count: import_drizzle_orm6.sql`count(*)` }).from(applicationsTable).where((0, import_drizzle_orm6.inArray)(applicationsTable.projectId, projectIds)).groupBy(applicationsTable.projectId)
  ]);
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const countMap = new Map(appCounts.map((a) => [a.projectId, Number(a.count)]));
  return projects.map((p) => ({
    ...p,
    clientName: clientMap.get(p.clientId) ?? null,
    applicationCount: countMap.get(p.id) ?? 0
  }));
}
router7.get("/my", requireAuth, requireRole("client"), async (req, res) => {
  const projects = await db.select().from(projectsTable).where((0, import_drizzle_orm6.eq)(projectsTable.clientId, req.user.userId)).orderBy(import_drizzle_orm6.sql`${projectsTable.createdAt} DESC`);
  res.json(await enrichProjects(projects));
});
router7.get("/", async (req, res) => {
  const category = req.query.category;
  const search = req.query.search;
  const status = req.query.status;
  const budgetMin = req.query.budgetMin ? parseFloat(req.query.budgetMin) : void 0;
  const budgetMax = req.query.budgetMax ? parseFloat(req.query.budgetMax) : void 0;
  const skills = req.query.skills;
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const offset = parseInt(req.query.offset || "0", 10);
  let query = db.select().from(projectsTable).$dynamic();
  const conditions = [];
  if (category) conditions.push((0, import_drizzle_orm6.ilike)(projectsTable.category, `%${category}%`));
  if (search) conditions.push((0, import_drizzle_orm6.or)((0, import_drizzle_orm6.ilike)(projectsTable.title, `%${search}%`), (0, import_drizzle_orm6.ilike)(projectsTable.description, `%${search}%`)));
  if (status) conditions.push((0, import_drizzle_orm6.eq)(projectsTable.status, status));
  if (!isNaN(budgetMin) && budgetMin !== void 0) conditions.push((0, import_drizzle_orm6.gte)(projectsTable.budgetMax, budgetMin));
  if (!isNaN(budgetMax) && budgetMax !== void 0) conditions.push((0, import_drizzle_orm6.lte)(projectsTable.budgetMin, budgetMax));
  if (skills) {
    const skillList = skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (skillList.length > 0) {
      const skillConditions = skillList.map(
        (s) => import_drizzle_orm6.sql`EXISTS (SELECT 1 FROM unnest(${projectsTable.requiredSkills}) AS skill WHERE lower(skill) LIKE ${`%${s}%`})`
      );
      conditions.push(skillConditions.length === 1 ? skillConditions[0] : (0, import_drizzle_orm6.or)(...skillConditions));
    }
  }
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : (0, import_drizzle_orm6.and)(...conditions));
  }
  const projects = await query.orderBy(import_drizzle_orm6.sql`${projectsTable.createdAt} DESC`).limit(limit).offset(offset);
  res.json(await enrichProjects(projects));
});
router7.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  if (parsed.data.budgetMin > parsed.data.budgetMax) {
    res.status(400).json({ error: "budgetMin must be \u2264 budgetMax" });
    return;
  }
  const [project] = await db.insert(projectsTable).values({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    budgetMin: parsed.data.budgetMin,
    budgetMax: parsed.data.budgetMax,
    timelineWeeks: parsed.data.timelineWeeks ?? null,
    requiredSkills: parsed.data.requiredSkills ?? [],
    clientId: req.user.userId
  }).returning();
  const [client] = await db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm6.eq)(usersTable.id, req.user.userId));
  res.status(201).json({ ...project, clientName: client?.name ?? null, applicationCount: 0 });
});
router7.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm6.eq)(projectsTable.id, id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [[client], [appCount]] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm6.eq)(usersTable.id, project.clientId)),
    db.select({ count: import_drizzle_orm6.sql`count(*)` }).from(applicationsTable).where((0, import_drizzle_orm6.eq)(applicationsTable.projectId, id))
  ]);
  res.json({ ...project, clientName: client?.name ?? null, applicationCount: Number(appCount?.count ?? 0) });
});
router7.patch("/:id", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm6.eq)(projectsTable.id, id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.clientId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const updates = {};
  if (parsed.data.title !== void 0) updates.title = parsed.data.title;
  if (parsed.data.description !== void 0) updates.description = parsed.data.description;
  if (parsed.data.category !== void 0) updates.category = parsed.data.category;
  if (parsed.data.budgetMin !== void 0) updates.budgetMin = parsed.data.budgetMin;
  if (parsed.data.budgetMax !== void 0) updates.budgetMax = parsed.data.budgetMax;
  if (parsed.data.timelineWeeks !== void 0) updates.timelineWeeks = parsed.data.timelineWeeks;
  if (parsed.data.status !== void 0) updates.status = parsed.data.status;
  if (parsed.data.requiredSkills !== void 0) updates.requiredSkills = parsed.data.requiredSkills;
  const budgetMin = updates.budgetMin ?? project.budgetMin;
  const budgetMax = updates.budgetMax ?? project.budgetMax;
  if (budgetMin > budgetMax) {
    res.status(400).json({ error: "budgetMin must be \u2264 budgetMax" });
    return;
  }
  const [updated] = Object.keys(updates).length > 0 ? await db.update(projectsTable).set(updates).where((0, import_drizzle_orm6.eq)(projectsTable.id, id)).returning() : [project];
  const [[client], [appCount]] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm6.eq)(usersTable.id, updated.clientId)),
    db.select({ count: import_drizzle_orm6.sql`count(*)` }).from(applicationsTable).where((0, import_drizzle_orm6.eq)(applicationsTable.projectId, id))
  ]);
  res.json({ ...updated, clientName: client?.name ?? null, applicationCount: Number(appCount?.count ?? 0) });
});
router7.patch("/:id/complete", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm6.eq)(projectsTable.id, id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.clientId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (project.status !== "in_progress") {
    res.status(400).json({ error: "Only in-progress projects can be marked complete" });
    return;
  }
  const [updated] = await db.update(projectsTable).set({ status: "completed" }).where((0, import_drizzle_orm6.eq)(projectsTable.id, id)).returning();
  const [acceptedApp] = await db.select({ freelancerId: applicationsTable.freelancerId, proposedRate: applicationsTable.proposedRate }).from(applicationsTable).where((0, import_drizzle_orm6.and)((0, import_drizzle_orm6.eq)(applicationsTable.projectId, id), (0, import_drizzle_orm6.eq)(applicationsTable.status, "accepted")));
  if (acceptedApp) {
    const [fp] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm6.eq)(freelancerProfilesTable.userId, acceptedApp.freelancerId));
    if (fp) {
      await db.update(freelancerProfilesTable).set({
        completedProjects: import_drizzle_orm6.sql`${freelancerProfilesTable.completedProjects} + 1`,
        totalEarnings: import_drizzle_orm6.sql`${freelancerProfilesTable.totalEarnings} + ${acceptedApp.proposedRate}`
      }).where((0, import_drizzle_orm6.eq)(freelancerProfilesTable.id, fp.id));
    }
    await db.insert(notificationsTable).values({
      userId: acceptedApp.freelancerId,
      type: "project_completed",
      title: "Project completed! \u{1F3C6}",
      message: `"${project.title}" has been marked complete by the client`,
      link: `/applications`
    }).catch(() => {
    });
    await db.insert(notificationsTable).values({
      userId: req.user.userId,
      type: "project_completed",
      title: "Project completed",
      message: `Great work! You can now leave a review for the freelancer`,
      link: `/freelancers`
    }).catch(() => {
    });
  }
  releaseEscrow(id).catch(() => {
  });
  const [[client], [appCount]] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm6.eq)(usersTable.id, updated.clientId)),
    db.select({ count: import_drizzle_orm6.sql`count(*)` }).from(applicationsTable).where((0, import_drizzle_orm6.eq)(applicationsTable.projectId, id))
  ]);
  res.json({ ...updated, clientName: client?.name ?? null, applicationCount: Number(appCount?.count ?? 0) });
});
router7.delete("/:id", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [project] = await db.select({ clientId: projectsTable.clientId }).from(projectsTable).where((0, import_drizzle_orm6.eq)(projectsTable.id, id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.clientId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(projectsTable).where((0, import_drizzle_orm6.eq)(projectsTable.id, id));
  res.json({ message: "Project deleted" });
});
router7.get("/:projectId/applications", requireAuth, requireRole("client"), async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid projectId" });
    return;
  }
  const [project] = await db.select({ clientId: projectsTable.clientId, title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm6.eq)(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.clientId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const applications = await db.select().from(applicationsTable).where((0, import_drizzle_orm6.eq)(applicationsTable.projectId, projectId)).orderBy(import_drizzle_orm6.sql`${applicationsTable.createdAt} DESC`);
  if (applications.length === 0) {
    res.json([]);
    return;
  }
  const freelancerIds = [...new Set(applications.map((a) => a.freelancerId))];
  const [freelancers, freelancerProfiles] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm6.inArray)(usersTable.id, freelancerIds)),
    db.select({ id: freelancerProfilesTable.id, userId: freelancerProfilesTable.userId, headline: freelancerProfilesTable.headline }).from(freelancerProfilesTable).where((0, import_drizzle_orm6.inArray)(freelancerProfilesTable.userId, freelancerIds))
  ]);
  const nameMap = new Map(freelancers.map((f) => [f.id, f.name]));
  const profileMap = new Map(freelancerProfiles.map((f) => [f.userId, { headline: f.headline, profileId: f.id }]));
  const result = applications.map((app2) => ({
    ...app2,
    freelancerName: nameMap.get(app2.freelancerId) ?? null,
    freelancerHeadline: profileMap.get(app2.freelancerId)?.headline ?? null,
    freelancerProfileId: profileMap.get(app2.freelancerId)?.profileId ?? null,
    projectTitle: project.title
  }));
  res.json(result);
});
var projects_default = router7;

// src/routes/applications.ts
var import_express8 = require("express");
var import_drizzle_orm7 = require("drizzle-orm");
init_src();
init_auth();
var router8 = (0, import_express8.Router)();
async function attachProjectTitles(applications) {
  if (applications.length === 0) return [];
  const projectIds = [...new Set(applications.map((a) => a.projectId))];
  const projects = await db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm7.inArray)(projectsTable.id, projectIds));
  const titleMap = new Map(projects.map((p) => [p.id, p.title]));
  return applications.map((app2) => ({
    ...app2,
    projectTitle: titleMap.get(app2.projectId) ?? null,
    freelancerName: null,
    freelancerHeadline: null
  }));
}
router8.get("/my", requireAuth, requireRole("freelancer"), async (req, res) => {
  const applications = await db.select().from(applicationsTable).where((0, import_drizzle_orm7.eq)(applicationsTable.freelancerId, req.user.userId)).orderBy(import_drizzle_orm7.sql`${applicationsTable.createdAt} DESC`);
  res.json(await attachProjectTitles(applications));
});
router8.post("/", requireAuth, requireRole("freelancer"), async (req, res) => {
  const parsed = ApplyToProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  if (parsed.data.proposedRate <= 0) {
    res.status(400).json({ error: "proposedRate must be positive" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm7.eq)(projectsTable.id, parsed.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.status !== "open") {
    res.status(400).json({ error: "Project is not accepting applications" });
    return;
  }
  if (project.clientId === req.user.userId) {
    res.status(400).json({ error: "You cannot apply to your own project" });
    return;
  }
  const existing = await db.select({ id: applicationsTable.id }).from(applicationsTable).where((0, import_drizzle_orm7.and)(
    (0, import_drizzle_orm7.eq)(applicationsTable.projectId, parsed.data.projectId),
    (0, import_drizzle_orm7.eq)(applicationsTable.freelancerId, req.user.userId)
  ));
  if (existing.length > 0) {
    res.status(409).json({ error: "Already applied to this project" });
    return;
  }
  const [app2] = await db.insert(applicationsTable).values({
    projectId: parsed.data.projectId,
    freelancerId: req.user.userId,
    coverLetter: parsed.data.coverLetter,
    proposedRate: parsed.data.proposedRate
  }).returning();
  await db.insert(notificationsTable).values({
    userId: project.clientId,
    type: "new_application",
    title: "New application received",
    message: `Someone applied to your project "${project.title}"`,
    link: `/projects/${project.id}`
  }).catch(() => {
  });
  res.status(201).json({ ...app2, projectTitle: project.title, freelancerName: null, freelancerHeadline: null });
});
router8.delete("/:id", requireAuth, requireRole("freelancer"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [app2] = await db.select().from(applicationsTable).where((0, import_drizzle_orm7.eq)(applicationsTable.id, id));
  if (!app2) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (app2.freelancerId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (app2.status !== "pending") {
    res.status(400).json({ error: "Can only withdraw pending applications" });
    return;
  }
  await db.delete(applicationsTable).where((0, import_drizzle_orm7.eq)(applicationsTable.id, id));
  res.json({ message: "Application withdrawn" });
});
router8.patch("/:id/status", requireAuth, requireRole("client"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const [app2] = await db.select().from(applicationsTable).where((0, import_drizzle_orm7.eq)(applicationsTable.id, id));
  if (!app2) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const [project] = await db.select().from(projectsTable).where((0, import_drizzle_orm7.eq)(projectsTable.id, app2.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.clientId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (app2.status === parsed.data.status) {
    const [freelancer2] = await db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm7.eq)(usersTable.id, app2.freelancerId));
    const [fp2] = await db.select({ headline: freelancerProfilesTable.headline }).from(freelancerProfilesTable).where((0, import_drizzle_orm7.eq)(freelancerProfilesTable.userId, app2.freelancerId));
    res.json({ ...app2, projectTitle: project.title, freelancerName: freelancer2?.name ?? null, freelancerHeadline: fp2?.headline ?? null });
    return;
  }
  const [updated] = await db.update(applicationsTable).set({ status: parsed.data.status }).where((0, import_drizzle_orm7.eq)(applicationsTable.id, id)).returning();
  if (parsed.data.status === "accepted") {
    await db.update(projectsTable).set({ status: "in_progress" }).where((0, import_drizzle_orm7.eq)(projectsTable.id, project.id));
    const siblingPendingIds = await db.select({ id: applicationsTable.id, freelancerId: applicationsTable.freelancerId }).from(applicationsTable).where((0, import_drizzle_orm7.and)(
      (0, import_drizzle_orm7.eq)(applicationsTable.projectId, project.id),
      (0, import_drizzle_orm7.eq)(applicationsTable.status, "pending"),
      (0, import_drizzle_orm7.ne)(applicationsTable.id, id)
    ));
    if (siblingPendingIds.length > 0) {
      await db.update(applicationsTable).set({ status: "rejected" }).where((0, import_drizzle_orm7.inArray)(applicationsTable.id, siblingPendingIds.map((s) => s.id)));
      const notifValues = siblingPendingIds.map((s) => ({
        userId: s.freelancerId,
        type: "application_rejected",
        title: "Application update",
        message: `Your application to "${project.title}" was not selected`,
        link: `/applications`
      }));
      await db.insert(notificationsTable).values(notifValues).catch(() => {
      });
    }
    await db.insert(notificationsTable).values({
      userId: app2.freelancerId,
      type: "application_accepted",
      title: "Application accepted! \u{1F389}",
      message: `Your application to "${project.title}" was accepted`,
      link: `/applications`
    }).catch(() => {
    });
  } else if (parsed.data.status === "rejected") {
    await db.insert(notificationsTable).values({
      userId: app2.freelancerId,
      type: "application_rejected",
      title: "Application update",
      message: `Your application to "${project.title}" was not selected`,
      link: `/applications`
    }).catch(() => {
    });
  }
  const [freelancer] = await db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm7.eq)(usersTable.id, app2.freelancerId));
  const [fp] = await db.select({ headline: freelancerProfilesTable.headline }).from(freelancerProfilesTable).where((0, import_drizzle_orm7.eq)(freelancerProfilesTable.userId, app2.freelancerId));
  res.json({ ...updated, projectTitle: project.title, freelancerName: freelancer?.name ?? null, freelancerHeadline: fp?.headline ?? null });
});
var applications_default = router8;

// src/routes/dashboard.ts
var import_express9 = require("express");
var import_drizzle_orm8 = require("drizzle-orm");
init_src();
init_auth();
var router9 = (0, import_express9.Router)();
var PROFICIENCY_WEIGHT = {
  beginner: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 1
};
function proficiencyLabel(weight) {
  return Object.entries(PROFICIENCY_WEIGHT).find(([, v]) => v === weight)?.[0] ?? "intermediate";
}
function scoreFreelancerForProject(opts) {
  const { freelancerSkills, requiredSkills, averageRating, completedProjects, availabilityStatus, hourlyRate, budgetMin, budgetMax } = opts;
  const reasons = [];
  const skillMap = new Map(
    freelancerSkills.map((s) => [s.name.toLowerCase(), PROFICIENCY_WEIGHT[s.proficiencyLevel] ?? 0.5])
  );
  const required = requiredSkills.map((s) => s.toLowerCase().trim());
  let skillScore = 0;
  if (required.length > 0) {
    const matched = required.filter((r) => skillMap.has(r));
    if (matched.length === 0) return { score: 0, reasons: [] };
    const weightedMatch = matched.reduce((sum, r) => sum + (skillMap.get(r) ?? 0.5), 0);
    const maxWeight = required.length;
    skillScore = Math.round(weightedMatch / maxWeight * 50);
    const matchedLabels = matched.map((r) => {
      const w = skillMap.get(r) ?? 0.5;
      return `${r} (${proficiencyLabel(w)})`;
    });
    reasons.push(`Skills: ${matchedLabels.join(", ")}`);
    if (matched.length < required.length) {
      reasons.push(`${matched.length}/${required.length} required skills matched`);
    }
  } else {
    skillScore = 40;
    reasons.push("No specific skills required");
  }
  let ratingScore = 10;
  if (averageRating !== null && averageRating > 0) {
    ratingScore = Math.round(averageRating / 5 * 20);
    reasons.push(`${averageRating.toFixed(1)}\u2605 rating`);
  }
  const capAt = 15;
  const completedScore = Math.round(Math.min(completedProjects, capAt) / capAt * 15);
  if (completedProjects > 0) {
    reasons.push(`${completedProjects} completed project${completedProjects !== 1 ? "s" : ""}`);
  }
  let availScore = 0;
  if (availabilityStatus === "available") {
    availScore = 10;
    reasons.push("Available now");
  } else if (availabilityStatus === "busy") {
    availScore = 4;
    reasons.push("Currently busy");
  }
  let rateScore = 0;
  if (budgetMax > 0) {
    const effectiveBudgetPerHr = budgetMax / 40;
    if (hourlyRate <= budgetMax && hourlyRate >= budgetMin * 0.5) {
      rateScore = 5;
      reasons.push(`Rate fits budget (\u20A6${hourlyRate}/hr)`);
    } else if (hourlyRate <= budgetMax * 1.2) {
      rateScore = 2;
      reasons.push(`Rate close to budget (\u20A6${hourlyRate}/hr)`);
    }
    void effectiveBudgetPerHr;
  }
  const score = Math.min(100, skillScore + ratingScore + completedScore + availScore + rateScore);
  return { score, reasons };
}
function scoreProjectForFreelancer(opts) {
  const { freelancerSkills, freelancerCompletedProjects, freelancerRating, freelancerAvailability, freelancerHourlyRate, project } = opts;
  const reasons = [];
  const required = (project.requiredSkills ?? []).map((s) => s.toLowerCase().trim());
  let skillScore = 0;
  if (required.length > 0) {
    const matched = required.filter((r) => freelancerSkills.has(r));
    if (matched.length === 0) return { score: 0, reasons: [] };
    const weightedMatch = matched.reduce((sum, r) => sum + (freelancerSkills.get(r) ?? 0.5), 0);
    skillScore = Math.round(weightedMatch / required.length * 50);
    const matchedLabels = matched.map((r) => {
      const w = freelancerSkills.get(r) ?? 0.5;
      return `${r} (${proficiencyLabel(w)})`;
    });
    reasons.push(`Skills: ${matchedLabels.join(", ")}`);
    if (matched.length < required.length) {
      reasons.push(`${matched.length}/${required.length} required skills matched`);
    }
  } else {
    skillScore = 40;
  }
  let ratingScore = 10;
  if (freelancerRating !== null && freelancerRating > 0) {
    ratingScore = Math.round(freelancerRating / 5 * 20);
    reasons.push(`${freelancerRating.toFixed(1)}\u2605 rating`);
  }
  const capAt = 15;
  const completedScore = Math.round(Math.min(freelancerCompletedProjects, capAt) / capAt * 15);
  if (freelancerCompletedProjects > 0) {
    reasons.push(`${freelancerCompletedProjects} completed project${freelancerCompletedProjects !== 1 ? "s" : ""}`);
  }
  let availScore = 0;
  if (freelancerAvailability === "available") {
    availScore = 10;
    reasons.push("Available now");
  } else if (freelancerAvailability === "busy") {
    availScore = 4;
    reasons.push("Currently busy");
  }
  let rateScore = 0;
  if (project.budgetMax > 0 && freelancerHourlyRate <= project.budgetMax) {
    rateScore = 5;
    reasons.push(`Rate fits budget (\u20A6${freelancerHourlyRate}/hr)`);
  } else if (project.budgetMax > 0 && freelancerHourlyRate <= project.budgetMax * 1.3) {
    rateScore = 2;
    reasons.push(`Rate close to budget (\u20A6${freelancerHourlyRate}/hr)`);
  }
  const score = Math.min(100, skillScore + ratingScore + completedScore + availScore + rateScore);
  return { score, reasons };
}
router9.get("/freelancer", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where((0, import_drizzle_orm8.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  const allApps = await db.select().from(applicationsTable).where((0, import_drizzle_orm8.eq)(applicationsTable.freelancerId, req.user.userId));
  const activeApplications = allApps.filter((a) => a.status === "pending").length;
  const acceptedApplications = allApps.filter((a) => a.status === "accepted").length;
  const recentApplications = await db.select().from(applicationsTable).where((0, import_drizzle_orm8.eq)(applicationsTable.freelancerId, req.user.userId)).orderBy(import_drizzle_orm8.sql`${applicationsTable.createdAt} DESC`).limit(10);
  const projectIds = [...new Set(recentApplications.map((a) => a.projectId))];
  const projects = projectIds.length > 0 ? await db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm8.inArray)(projectsTable.id, projectIds)) : [];
  const titleMap = new Map(projects.map((p) => [p.id, p.title]));
  const recentWithTitles = recentApplications.map((app2) => ({
    ...app2,
    projectTitle: titleMap.get(app2.projectId) ?? null,
    freelancerName: null,
    freelancerHeadline: null
  }));
  res.json({
    totalEarnings: profile.totalEarnings,
    activeApplications,
    acceptedApplications,
    profileViews: profile.profileViews,
    averageRating: profile.averageRating,
    recentApplications: recentWithTitles
  });
});
router9.get("/client", requireAuth, requireRole("client"), async (req, res) => {
  const allProjects = await db.select().from(projectsTable).where((0, import_drizzle_orm8.eq)(projectsTable.clientId, req.user.userId));
  const totalProjectsPosted = allProjects.length;
  const openProjects = allProjects.filter((p) => p.status === "open").length;
  let totalApplicationsReceived = 0;
  let totalSpent = 0;
  if (allProjects.length > 0) {
    const projectIds = allProjects.map((p) => p.id);
    const allApps = await db.select({
      projectId: applicationsTable.projectId,
      status: applicationsTable.status,
      proposedRate: applicationsTable.proposedRate
    }).from(applicationsTable).where((0, import_drizzle_orm8.inArray)(applicationsTable.projectId, projectIds));
    totalApplicationsReceived = allApps.length;
    totalSpent = allApps.filter((a) => a.status === "accepted").reduce((sum, a) => sum + a.proposedRate, 0);
  }
  const recentProjects = await db.select().from(projectsTable).where((0, import_drizzle_orm8.eq)(projectsTable.clientId, req.user.userId)).orderBy(import_drizzle_orm8.sql`${projectsTable.createdAt} DESC`).limit(10);
  let recentWithCounts = [];
  if (recentProjects.length > 0) {
    const recentIds = recentProjects.map((p) => p.id);
    const appCounts = await db.select({
      projectId: applicationsTable.projectId,
      count: import_drizzle_orm8.sql`count(*)`
    }).from(applicationsTable).where((0, import_drizzle_orm8.inArray)(applicationsTable.projectId, recentIds)).groupBy(applicationsTable.projectId);
    const countMap = new Map(appCounts.map((a) => [a.projectId, Number(a.count)]));
    recentWithCounts = recentProjects.map((p) => ({ ...p, clientName: null, applicationCount: countMap.get(p.id) ?? 0 }));
  }
  res.json({ totalProjectsPosted, openProjects, totalApplicationsReceived, totalSpent, recentProjects: recentWithCounts });
});
router9.get("/ai-recommendations", requireAuth, requireRole("freelancer"), async (req, res) => {
  const [profile] = await db.select().from(freelancerProfilesTable).where((0, import_drizzle_orm8.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  const mySkills = await db.select({
    name: skillsTable.name,
    proficiencyLevel: freelancerSkillsTable.proficiencyLevel
  }).from(freelancerSkillsTable).innerJoin(skillsTable, (0, import_drizzle_orm8.eq)(freelancerSkillsTable.skillId, skillsTable.id)).where((0, import_drizzle_orm8.eq)(freelancerSkillsTable.freelancerProfileId, profile.id));
  const skillMap = new Map(
    mySkills.map((s) => [s.name.toLowerCase(), PROFICIENCY_WEIGHT[s.proficiencyLevel] ?? 0.5])
  );
  if (skillMap.size === 0) {
    res.json([]);
    return;
  }
  const myApplications = await db.select({ projectId: applicationsTable.projectId }).from(applicationsTable).where((0, import_drizzle_orm8.eq)(applicationsTable.freelancerId, req.user.userId));
  const appliedProjectIds = new Set(myApplications.map((a) => a.projectId));
  const openProjects = await db.select({
    project: projectsTable,
    clientName: usersTable.name
  }).from(projectsTable).innerJoin(usersTable, (0, import_drizzle_orm8.eq)(projectsTable.clientId, usersTable.id)).where((0, import_drizzle_orm8.and)(
    (0, import_drizzle_orm8.eq)(projectsTable.status, "open"),
    (0, import_drizzle_orm8.ne)(projectsTable.clientId, req.user.userId)
  )).orderBy(import_drizzle_orm8.sql`${projectsTable.createdAt} DESC`).limit(80);
  const projectIds = openProjects.map((r) => r.project.id);
  const appCounts = projectIds.length > 0 ? await db.select({
    projectId: applicationsTable.projectId,
    count: import_drizzle_orm8.sql`count(*)`
  }).from(applicationsTable).where((0, import_drizzle_orm8.inArray)(applicationsTable.projectId, projectIds)).groupBy(applicationsTable.projectId) : [];
  const countMap = new Map(appCounts.map((a) => [a.projectId, Number(a.count)]));
  const scored = openProjects.filter((r) => !appliedProjectIds.has(r.project.id)).map((r) => {
    const { score, reasons } = scoreProjectForFreelancer({
      freelancerSkills: skillMap,
      freelancerCompletedProjects: profile.completedProjects,
      freelancerRating: profile.averageRating,
      freelancerAvailability: profile.availabilityStatus,
      freelancerHourlyRate: profile.hourlyRate,
      project: r.project
    });
    if (score === 0) return null;
    return {
      project: {
        ...r.project,
        clientName: r.clientName,
        applicationCount: countMap.get(r.project.id) ?? 0
      },
      matchScore: score,
      matchReasons: reasons
    };
  }).filter(Boolean);
  scored.sort((a, b) => b.matchScore - a.matchScore);
  res.json(scored.slice(0, 20));
});
router9.get("/ai-freelancers", requireAuth, requireRole("client"), async (req, res) => {
  const clientProjects = await db.select().from(projectsTable).where((0, import_drizzle_orm8.and)((0, import_drizzle_orm8.eq)(projectsTable.clientId, req.user.userId), (0, import_drizzle_orm8.eq)(projectsTable.status, "open"))).orderBy(import_drizzle_orm8.sql`${projectsTable.createdAt} DESC`).limit(5);
  if (clientProjects.length === 0) {
    res.json([]);
    return;
  }
  const allRequiredSkillNames = new Set(
    clientProjects.flatMap((p) => (p.requiredSkills ?? []).map((s) => s.toLowerCase().trim()))
  );
  const freelancerProfiles = await db.select({
    profile: freelancerProfilesTable,
    user: {
      id: usersTable.id,
      name: usersTable.name,
      avatarUrl: usersTable.avatarUrl,
      university: usersTable.university
    }
  }).from(freelancerProfilesTable).innerJoin(usersTable, (0, import_drizzle_orm8.eq)(freelancerProfilesTable.userId, usersTable.id)).where(import_drizzle_orm8.sql`${freelancerProfilesTable.availabilityStatus} IN ('available', 'busy')`).limit(100);
  if (freelancerProfiles.length === 0) {
    res.json([]);
    return;
  }
  const profileIds = freelancerProfiles.map((f) => f.profile.id);
  const allSkills = await db.select({
    freelancerProfileId: freelancerSkillsTable.freelancerProfileId,
    skillName: skillsTable.name,
    proficiencyLevel: freelancerSkillsTable.proficiencyLevel
  }).from(freelancerSkillsTable).innerJoin(skillsTable, (0, import_drizzle_orm8.eq)(freelancerSkillsTable.skillId, skillsTable.id)).where((0, import_drizzle_orm8.inArray)(freelancerSkillsTable.freelancerProfileId, profileIds));
  const skillsByProfile = /* @__PURE__ */ new Map();
  for (const s of allSkills) {
    if (!skillsByProfile.has(s.freelancerProfileId)) skillsByProfile.set(s.freelancerProfileId, []);
    skillsByProfile.get(s.freelancerProfileId).push({ name: s.skillName, proficiencyLevel: s.proficiencyLevel });
  }
  const relevantFreelancers = freelancerProfiles.filter((f) => {
    const skills = skillsByProfile.get(f.profile.id) ?? [];
    return skills.some((s) => allRequiredSkillNames.has(s.name.toLowerCase().trim()));
  });
  const projectRecommendations = clientProjects.map((project) => {
    const required = (project.requiredSkills ?? []).map((s) => s.toLowerCase().trim());
    const scored = relevantFreelancers.map((f) => {
      const fSkills = skillsByProfile.get(f.profile.id) ?? [];
      const fSkillMap = new Map(fSkills.map((s) => [s.name.toLowerCase(), PROFICIENCY_WEIGHT[s.proficiencyLevel] ?? 0.5]));
      const { score, reasons } = scoreFreelancerForProject({
        freelancerSkills: fSkills,
        requiredSkills: required,
        averageRating: f.profile.averageRating,
        completedProjects: f.profile.completedProjects,
        availabilityStatus: f.profile.availabilityStatus,
        hourlyRate: f.profile.hourlyRate,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax
      });
      if (score === 0) return null;
      return {
        freelancer: {
          id: f.profile.id,
          userId: f.profile.userId,
          user: f.user,
          headline: f.profile.headline,
          bio: f.profile.bio,
          hourlyRate: f.profile.hourlyRate,
          availabilityStatus: f.profile.availabilityStatus,
          completedProjects: f.profile.completedProjects,
          averageRating: f.profile.averageRating,
          totalReviews: f.profile.totalReviews,
          skills: (skillsByProfile.get(f.profile.id) ?? []).map((s) => ({
            skillName: s.name,
            proficiencyLevel: s.proficiencyLevel
          }))
        },
        matchScore: score,
        matchReasons: reasons
      };
    }).filter(Boolean);
    scored.sort((a, b) => b.matchScore - a.matchScore);
    return {
      project: {
        id: project.id,
        title: project.title,
        category: project.category,
        requiredSkills: project.requiredSkills,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax
      },
      recommendations: scored.slice(0, 5)
    };
  }).filter((p) => p.recommendations.length > 0);
  res.json(projectRecommendations);
});
var dashboard_default = router9;

// src/routes/reviews.ts
var import_express10 = require("express");
var import_drizzle_orm9 = require("drizzle-orm");
init_src();
init_auth();
var import_zod = require("zod");
var router10 = (0, import_express10.Router)();
var CreateReviewBody = import_zod.z.object({
  freelancerProfileId: import_zod.z.number().int().positive(),
  projectId: import_zod.z.number().int().positive().optional(),
  rating: import_zod.z.number().min(1).max(5),
  comment: import_zod.z.string().max(2e3).optional()
});
router10.get("/freelancer/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const reviews = await db.select().from(reviewsTable).where((0, import_drizzle_orm9.eq)(reviewsTable.freelancerProfileId, id)).orderBy(import_drizzle_orm9.sql`${reviewsTable.createdAt} DESC`);
  if (reviews.length === 0) {
    res.json([]);
    return;
  }
  const reviewerIds = [...new Set(reviews.map((r) => r.reviewerId))];
  const reviewers = await db.select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl }).from(usersTable).where((0, import_drizzle_orm9.inArray)(usersTable.id, reviewerIds));
  const reviewerMap = new Map(reviewers.map((r) => [r.id, r]));
  const result = reviews.map((r) => ({
    ...r,
    reviewerName: reviewerMap.get(r.reviewerId)?.name ?? null,
    reviewerAvatar: reviewerMap.get(r.reviewerId)?.avatarUrl ?? null
  }));
  res.json(result);
});
router10.get("/can-review/:freelancerProfileId", requireAuth, requireRole("client"), async (req, res) => {
  const freelancerProfileId = parseInt(req.params.freelancerProfileId, 10);
  if (isNaN(freelancerProfileId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [fp] = await db.select({ userId: freelancerProfilesTable.userId }).from(freelancerProfilesTable).where((0, import_drizzle_orm9.eq)(freelancerProfilesTable.id, freelancerProfileId));
  if (!fp) {
    res.json({ canReview: false, reason: "Freelancer not found" });
    return;
  }
  const eligibleWork = await db.select({ id: applicationsTable.id, projectId: applicationsTable.projectId }).from(applicationsTable).innerJoin(projectsTable, (0, import_drizzle_orm9.eq)(applicationsTable.projectId, projectsTable.id)).where((0, import_drizzle_orm9.and)(
    (0, import_drizzle_orm9.eq)(applicationsTable.freelancerId, fp.userId),
    (0, import_drizzle_orm9.eq)(applicationsTable.status, "accepted"),
    (0, import_drizzle_orm9.eq)(projectsTable.clientId, req.user.userId)
  )).limit(1);
  if (eligibleWork.length === 0) {
    res.json({ canReview: false, reason: "You can only review freelancers you have worked with" });
    return;
  }
  const alreadyReviewed = await db.select({ id: reviewsTable.id }).from(reviewsTable).where((0, import_drizzle_orm9.and)(
    (0, import_drizzle_orm9.eq)(reviewsTable.freelancerProfileId, freelancerProfileId),
    (0, import_drizzle_orm9.eq)(reviewsTable.reviewerId, req.user.userId),
    (0, import_drizzle_orm9.eq)(reviewsTable.projectId, eligibleWork[0].projectId)
  )).limit(1);
  res.json({
    canReview: alreadyReviewed.length === 0,
    alreadyReviewed: alreadyReviewed.length > 0,
    projectId: eligibleWork[0].projectId,
    reason: alreadyReviewed.length > 0 ? "You have already reviewed this freelancer for this project" : null
  });
});
router10.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const [fp] = await db.select({ id: freelancerProfilesTable.id, userId: freelancerProfilesTable.userId }).from(freelancerProfilesTable).where((0, import_drizzle_orm9.eq)(freelancerProfilesTable.id, parsed.data.freelancerProfileId));
  if (!fp) {
    res.status(404).json({ error: "Freelancer profile not found" });
    return;
  }
  const eligibleWork = await db.select({ id: applicationsTable.id }).from(applicationsTable).innerJoin(projectsTable, (0, import_drizzle_orm9.eq)(applicationsTable.projectId, projectsTable.id)).where((0, import_drizzle_orm9.and)(
    (0, import_drizzle_orm9.eq)(applicationsTable.freelancerId, fp.userId),
    (0, import_drizzle_orm9.eq)(applicationsTable.status, "accepted"),
    (0, import_drizzle_orm9.eq)(projectsTable.clientId, req.user.userId)
  )).limit(1);
  if (eligibleWork.length === 0) {
    res.status(403).json({ error: "You can only review freelancers you have worked with on a completed project" });
    return;
  }
  const [review] = await db.insert(reviewsTable).values({
    freelancerProfileId: parsed.data.freelancerProfileId,
    reviewerId: req.user.userId,
    projectId: parsed.data.projectId ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null
  }).onConflictDoNothing().returning();
  if (!review) {
    res.status(409).json({ error: "You have already reviewed this freelancer for this project" });
    return;
  }
  const [stats] = await db.select({
    avg: import_drizzle_orm9.sql`AVG(${reviewsTable.rating})`,
    count: import_drizzle_orm9.sql`COUNT(*)`
  }).from(reviewsTable).where((0, import_drizzle_orm9.eq)(reviewsTable.freelancerProfileId, parsed.data.freelancerProfileId));
  await db.update(freelancerProfilesTable).set({
    averageRating: Math.round(Number(stats.avg) * 10) / 10,
    totalReviews: Number(stats.count)
  }).where((0, import_drizzle_orm9.eq)(freelancerProfilesTable.id, parsed.data.freelancerProfileId));
  await db.insert(notificationsTable).values({
    userId: fp.userId,
    type: "review_received",
    title: "You received a new review!",
    message: `A client left you a ${parsed.data.rating}-star review`,
    link: `/freelancers/${parsed.data.freelancerProfileId}`
  }).catch(() => {
  });
  res.status(201).json(review);
});
var reviews_default = router10;

// src/routes/messages.ts
var import_express11 = require("express");
var import_drizzle_orm10 = require("drizzle-orm");
init_src();
init_auth();
var import_zod2 = require("zod");
var router11 = (0, import_express11.Router)();
var SendMessageBody = import_zod2.z.object({
  recipientId: import_zod2.z.number().int().positive(),
  content: import_zod2.z.string().min(1).max(2e3),
  attachmentUrl: import_zod2.z.string().optional().nullable(),
  attachmentName: import_zod2.z.string().optional().nullable(),
  attachmentType: import_zod2.z.string().optional().nullable()
});
router11.get("/conversations", requireAuth, async (req, res) => {
  const uid = req.user.userId;
  const conversations = await db.select().from(conversationsTable).where((0, import_drizzle_orm10.or)((0, import_drizzle_orm10.eq)(conversationsTable.participant1Id, uid), (0, import_drizzle_orm10.eq)(conversationsTable.participant2Id, uid))).orderBy(import_drizzle_orm10.sql`${conversationsTable.lastMessageAt} DESC`);
  if (conversations.length === 0) {
    res.json([]);
    return;
  }
  const otherIds = conversations.map((c) => c.participant1Id === uid ? c.participant2Id : c.participant1Id);
  const uniqueOtherIds = [...new Set(otherIds)];
  const conversationIds = conversations.map((c) => c.id);
  const [otherUsers, lastMessages, unreadCounts] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name, avatarUrl: usersTable.avatarUrl, role: usersTable.role }).from(usersTable).where((0, import_drizzle_orm10.inArray)(usersTable.id, uniqueOtherIds)),
    db.select().from(messagesTable).where((0, import_drizzle_orm10.inArray)(messagesTable.conversationId, conversationIds)).orderBy(import_drizzle_orm10.sql`${messagesTable.conversationId}, ${messagesTable.createdAt} DESC`),
    db.select({
      conversationId: messagesTable.conversationId,
      count: import_drizzle_orm10.sql`count(*)`
    }).from(messagesTable).where((0, import_drizzle_orm10.and)(
      (0, import_drizzle_orm10.inArray)(messagesTable.conversationId, conversationIds),
      (0, import_drizzle_orm10.eq)(messagesTable.isRead, false),
      import_drizzle_orm10.sql`${messagesTable.senderId} != ${uid}`
    )).groupBy(messagesTable.conversationId)
  ]);
  const userMap = new Map(otherUsers.map((u) => [u.id, u]));
  const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, Number(u.count)]));
  const lastMsgMap = /* @__PURE__ */ new Map();
  for (const msg of lastMessages) {
    if (!lastMsgMap.has(msg.conversationId)) lastMsgMap.set(msg.conversationId, msg);
  }
  const result = conversations.map((c, i) => ({
    ...c,
    otherUser: userMap.get(otherIds[i]) ?? null,
    lastMessage: lastMsgMap.get(c.id) ?? null,
    unreadCount: unreadMap.get(c.id) ?? 0
  }));
  res.json(result);
});
router11.get("/:conversationId", requireAuth, async (req, res) => {
  const conversationId = parseInt(req.params.conversationId, 10);
  if (isNaN(conversationId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const uid = req.user.userId;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const [conv] = await db.select().from(conversationsTable).where((0, import_drizzle_orm10.eq)(conversationsTable.id, conversationId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (conv.participant1Id !== uid && conv.participant2Id !== uid) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.update(messagesTable).set({ isRead: true }).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(messagesTable.conversationId, conversationId), import_drizzle_orm10.sql`${messagesTable.senderId} != ${uid}`));
  const messages = await db.select().from(messagesTable).where((0, import_drizzle_orm10.eq)(messagesTable.conversationId, conversationId)).orderBy(import_drizzle_orm10.sql`${messagesTable.createdAt} ASC`).limit(limit).offset(offset);
  res.json(messages);
});
router11.post("/", requireAuth, async (req, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const uid = req.user.userId;
  const { recipientId, content, attachmentUrl, attachmentName, attachmentType } = parsed.data;
  if (uid === recipientId) {
    res.status(400).json({ error: "Cannot message yourself" });
    return;
  }
  const [recipient] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm10.eq)(usersTable.id, recipientId));
  if (!recipient) {
    res.status(404).json({ error: "Recipient not found" });
    return;
  }
  const p1 = Math.min(uid, recipientId);
  const p2 = Math.max(uid, recipientId);
  let [conv] = await db.select().from(conversationsTable).where((0, import_drizzle_orm10.and)((0, import_drizzle_orm10.eq)(conversationsTable.participant1Id, p1), (0, import_drizzle_orm10.eq)(conversationsTable.participant2Id, p2)));
  if (!conv) {
    [conv] = await db.insert(conversationsTable).values({ participant1Id: p1, participant2Id: p2 }).returning();
  }
  const [message] = await db.insert(messagesTable).values({
    conversationId: conv.id,
    senderId: uid,
    content,
    attachmentUrl: attachmentUrl ?? null,
    attachmentName: attachmentName ?? null,
    attachmentType: attachmentType ?? null
  }).returning();
  await db.update(conversationsTable).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm10.eq)(conversationsTable.id, conv.id));
  const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm10.eq)(usersTable.id, uid));
  const hasContent = content?.trim();
  const preview = hasContent ? content.length > 60 ? content.slice(0, 60) + "\u2026" : content : `\u{1F4CE} ${attachmentName ?? "file"}`;
  await db.insert(notificationsTable).values({
    userId: recipientId,
    type: "new_message",
    title: `New message from ${sender?.name ?? "someone"}`,
    message: preview,
    link: `/messages`
  }).catch(() => {
  });
  const fullMessage = { ...message, conversationId: conv.id };
  try {
    const { io: io2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
    if (io2) {
      io2.to(`conv:${conv.id}`).emit("message:new", fullMessage);
      io2.to(`user:${uid}`).to(`user:${recipientId}`).emit("conversation:updated", { conversationId: conv.id });
      const [notif] = await db.select().from(notificationsTable).where((0, import_drizzle_orm10.eq)(notificationsTable.userId, recipientId)).orderBy(import_drizzle_orm10.sql`${notificationsTable.createdAt} DESC`).limit(1);
      if (notif) io2.to(`user:${recipientId}`).emit("notification:new", notif);
    }
  } catch {
  }
  res.status(201).json(fullMessage);
});
var messages_default = router11;

// src/routes/notifications.ts
var import_express12 = require("express");
var import_drizzle_orm11 = require("drizzle-orm");
init_src();
init_auth();
var router12 = (0, import_express12.Router)();
router12.get("/", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const notifications = await db.select().from(notificationsTable).where((0, import_drizzle_orm11.eq)(notificationsTable.userId, req.user.userId)).orderBy(import_drizzle_orm11.sql`${notificationsTable.createdAt} DESC`).limit(limit).offset(offset);
  res.json(notifications);
});
router12.patch("/read-all", requireAuth, async (req, res) => {
  await db.update(notificationsTable).set({ isRead: true }).where((0, import_drizzle_orm11.eq)(notificationsTable.userId, req.user.userId));
  res.json({ message: "All notifications marked as read" });
});
router12.patch("/:id/read", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [notif] = await db.select({ userId: notificationsTable.userId }).from(notificationsTable).where((0, import_drizzle_orm11.eq)(notificationsTable.id, id));
  if (!notif) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (notif.userId !== req.user.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.update(notificationsTable).set({ isRead: true }).where((0, import_drizzle_orm11.eq)(notificationsTable.id, id));
  res.json({ message: "Marked as read" });
});
var notifications_default = router12;

// src/routes/saved.ts
var import_express13 = require("express");
var import_drizzle_orm12 = require("drizzle-orm");
init_src();
init_auth();
var import_zod3 = require("zod");
var router13 = (0, import_express13.Router)();
var SaveBody = import_zod3.z.object({
  itemType: import_zod3.z.enum(["project", "freelancer"]),
  itemId: import_zod3.z.number().int().positive()
});
var DeleteQuerySchema = import_zod3.z.object({
  itemType: import_zod3.z.enum(["project", "freelancer"]),
  itemId: import_zod3.z.coerce.number().int().positive()
});
router13.get("/projects", requireAuth, async (req, res) => {
  const saved = await db.select().from(savedItemsTable).where((0, import_drizzle_orm12.and)((0, import_drizzle_orm12.eq)(savedItemsTable.userId, req.user.userId), (0, import_drizzle_orm12.eq)(savedItemsTable.itemType, "project")));
  const projectIds = saved.map((s) => s.itemId);
  if (projectIds.length === 0) {
    res.json([]);
    return;
  }
  const [projects, clients, appCounts] = await Promise.all([
    db.select().from(projectsTable).where((0, import_drizzle_orm12.inArray)(projectsTable.id, projectIds)),
    db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm12.inArray)(
      usersTable.id,
      (await db.select({ clientId: projectsTable.clientId }).from(projectsTable).where((0, import_drizzle_orm12.inArray)(projectsTable.id, projectIds))).map((p) => p.clientId)
    )),
    db.select({ projectId: applicationsTable.projectId, count: import_drizzle_orm12.sql`count(*)` }).from(applicationsTable).where((0, import_drizzle_orm12.inArray)(applicationsTable.projectId, projectIds)).groupBy(applicationsTable.projectId)
  ]);
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const countMap = new Map(appCounts.map((a) => [a.projectId, Number(a.count)]));
  const result = projects.map((p) => ({
    ...p,
    clientName: clientMap.get(p.clientId) ?? null,
    applicationCount: countMap.get(p.id) ?? 0
  }));
  res.json(result);
});
router13.get("/freelancers", requireAuth, async (req, res) => {
  const saved = await db.select().from(savedItemsTable).where((0, import_drizzle_orm12.and)((0, import_drizzle_orm12.eq)(savedItemsTable.userId, req.user.userId), (0, import_drizzle_orm12.eq)(savedItemsTable.itemType, "freelancer")));
  const profileIds = saved.map((s) => s.itemId);
  if (profileIds.length === 0) {
    res.json([]);
    return;
  }
  const profiles = await db.select().from(freelancerProfilesTable).where((0, import_drizzle_orm12.inArray)(freelancerProfilesTable.id, profileIds));
  const userIds = profiles.map((p) => p.userId);
  const users = userIds.length > 0 ? await db.select().from(usersTable).where((0, import_drizzle_orm12.inArray)(usersTable.id, userIds)) : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const result = profiles.map((p) => ({ ...p, user: userMap.get(p.userId) ?? null }));
  res.json(result);
});
router13.post("/", requireAuth, async (req, res) => {
  const parsed = SaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  await db.insert(savedItemsTable).values({
    userId: req.user.userId,
    itemType: parsed.data.itemType,
    itemId: parsed.data.itemId
  }).onConflictDoNothing();
  res.status(201).json({ message: "Saved" });
});
router13.delete("/", requireAuth, async (req, res) => {
  const parsed = DeleteQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "itemType and itemId are required query parameters" });
    return;
  }
  await db.delete(savedItemsTable).where(
    (0, import_drizzle_orm12.and)(
      (0, import_drizzle_orm12.eq)(savedItemsTable.userId, req.user.userId),
      (0, import_drizzle_orm12.eq)(savedItemsTable.itemType, parsed.data.itemType),
      (0, import_drizzle_orm12.eq)(savedItemsTable.itemId, parsed.data.itemId)
    )
  );
  res.json({ message: "Removed from saved" });
});
router13.get("/check", requireAuth, async (req, res) => {
  const itemType = req.query.itemType;
  const itemId = parseInt(req.query.itemId, 10);
  if (!itemType || isNaN(itemId)) {
    res.status(400).json({ error: "itemType and itemId required" });
    return;
  }
  const [saved] = await db.select({ id: savedItemsTable.id }).from(savedItemsTable).where((0, import_drizzle_orm12.and)((0, import_drizzle_orm12.eq)(savedItemsTable.userId, req.user.userId), (0, import_drizzle_orm12.eq)(savedItemsTable.itemType, itemType), (0, import_drizzle_orm12.eq)(savedItemsTable.itemId, itemId)));
  res.json({ saved: !!saved });
});
var saved_default = router13;

// src/routes/admin.ts
var import_express14 = require("express");
var import_drizzle_orm13 = require("drizzle-orm");
init_src();
init_auth();
var router14 = (0, import_express14.Router)();
function requireAdmin(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  (async () => {
    const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where((0, import_drizzle_orm13.eq)(usersTable.id, req.user.userId));
    if (!user?.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  })().catch(next);
}
router14.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  const [[users], [projects], [applications], [reviews]] = await Promise.all([
    db.select({ count: import_drizzle_orm13.sql`count(*)` }).from(usersTable),
    db.select({ count: import_drizzle_orm13.sql`count(*)` }).from(projectsTable),
    db.select({ count: import_drizzle_orm13.sql`count(*)` }).from(applicationsTable),
    db.select({ count: import_drizzle_orm13.sql`count(*)` }).from(reviewsTable)
  ]);
  const projectsByStatus = await db.select({ status: projectsTable.status, count: import_drizzle_orm13.sql`count(*)` }).from(projectsTable).groupBy(projectsTable.status);
  const usersByRole = await db.select({ role: usersTable.role, count: import_drizzle_orm13.sql`count(*)` }).from(usersTable).groupBy(usersTable.role);
  res.json({
    totalUsers: Number(users?.count ?? 0),
    totalProjects: Number(projects?.count ?? 0),
    totalApplications: Number(applications?.count ?? 0),
    totalReviews: Number(reviews?.count ?? 0),
    projectsByStatus,
    usersByRole
  });
});
router14.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const search = (req.query.search || "").toLowerCase();
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    university: usersTable.university,
    isAdmin: usersTable.isAdmin,
    isSuspended: usersTable.isSuspended,
    isBanned: usersTable.isBanned,
    emailVerified: usersTable.emailVerified,
    createdAt: usersTable.createdAt
  }).from(usersTable).orderBy((0, import_drizzle_orm13.desc)(usersTable.createdAt)).limit(limit).offset(offset);
  const filtered = search ? users.filter((u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) : users;
  res.json(filtered);
});
router14.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { isAdmin, isSuspended, isBanned, emailVerified } = req.body;
  const updates = {};
  if (isAdmin !== void 0) updates.isAdmin = isAdmin;
  if (isSuspended !== void 0) updates.isSuspended = isSuspended;
  if (isBanned !== void 0) updates.isBanned = isBanned;
  if (emailVerified !== void 0) updates.emailVerified = emailVerified;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [updated] = await db.update(usersTable).set(updates).where((0, import_drizzle_orm13.eq)(usersTable.id, id)).returning({
    id: usersTable.id,
    email: usersTable.email,
    name: usersTable.name,
    role: usersTable.role,
    isAdmin: usersTable.isAdmin,
    isSuspended: usersTable.isSuspended,
    isBanned: usersTable.isBanned,
    emailVerified: usersTable.emailVerified
  });
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(updated);
});
router14.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (id === req.user.userId) {
    res.status(400).json({ error: "Cannot delete yourself" });
    return;
  }
  await db.delete(usersTable).where((0, import_drizzle_orm13.eq)(usersTable.id, id));
  res.json({ message: "User deleted" });
});
router14.get("/projects", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const projects = await db.select({
    id: projectsTable.id,
    title: projectsTable.title,
    status: projectsTable.status,
    category: projectsTable.category,
    clientId: projectsTable.clientId,
    budgetMin: projectsTable.budgetMin,
    budgetMax: projectsTable.budgetMax,
    createdAt: projectsTable.createdAt
  }).from(projectsTable).orderBy((0, import_drizzle_orm13.desc)(projectsTable.createdAt)).limit(limit).offset(offset);
  res.json(projects);
});
router14.delete("/projects/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(projectsTable).where((0, import_drizzle_orm13.eq)(projectsTable.id, id));
  res.json({ message: "Project deleted" });
});
router14.get("/freelancers", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const profiles = await db.select({
    id: freelancerProfilesTable.id,
    userId: freelancerProfilesTable.userId,
    headline: freelancerProfilesTable.headline,
    hourlyRate: freelancerProfilesTable.hourlyRate,
    averageRating: freelancerProfilesTable.averageRating,
    completedProjects: freelancerProfilesTable.completedProjects,
    totalEarnings: freelancerProfilesTable.totalEarnings,
    isVerified: freelancerProfilesTable.isVerified,
    createdAt: freelancerProfilesTable.createdAt
  }).from(freelancerProfilesTable).orderBy((0, import_drizzle_orm13.desc)(freelancerProfilesTable.createdAt)).limit(limit).offset(offset);
  if (profiles.length === 0) {
    res.json([]);
    return;
  }
  const userIds = profiles.map((p) => p.userId);
  const users = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, avatarUrl: usersTable.avatarUrl }).from(usersTable).where((0, import_drizzle_orm13.inArray)(usersTable.id, userIds));
  const userMap = new Map(users.map((u) => [u.id, u]));
  res.json(profiles.map((p) => ({
    ...p,
    user: userMap.get(p.userId) ?? null
  })));
});
router14.patch("/freelancers/:id/verify", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { isVerified } = req.body;
  if (typeof isVerified !== "boolean") {
    res.status(400).json({ error: "isVerified must be boolean" });
    return;
  }
  const [updated] = await db.update(freelancerProfilesTable).set({ isVerified }).where((0, import_drizzle_orm13.eq)(freelancerProfilesTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Freelancer profile not found" });
    return;
  }
  res.json(updated);
});
router14.get("/reports", requireAuth, requireAdmin, async (req, res) => {
  const status = req.query.status;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  let query = db.select({
    report: reportsTable,
    reporterName: usersTable.name
  }).from(reportsTable).innerJoin(usersTable, (0, import_drizzle_orm13.eq)(reportsTable.reporterId, usersTable.id)).$dynamic();
  if (status && ["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
    query = query.where((0, import_drizzle_orm13.eq)(reportsTable.status, status));
  }
  const reports = await query.orderBy((0, import_drizzle_orm13.desc)(reportsTable.createdAt)).limit(limit).offset(offset);
  res.json(reports.map(({ report, reporterName }) => ({ ...report, reporterName })));
});
router14.patch("/reports/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { status, adminNote } = req.body;
  const updates = {};
  if (status && ["reviewed", "resolved", "dismissed"].includes(status)) {
    updates.status = status;
    if (status === "resolved" || status === "dismissed") updates.resolvedAt = /* @__PURE__ */ new Date();
  }
  if (adminNote !== void 0) updates.adminNote = adminNote;
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [updated] = await db.update(reportsTable).set(updates).where((0, import_drizzle_orm13.eq)(reportsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(updated);
});
router14.get("/reports/summary", requireAuth, requireAdmin, async (_req, res) => {
  const counts = await db.select({ status: reportsTable.status, count: import_drizzle_orm13.sql`count(*)` }).from(reportsTable).groupBy(reportsTable.status);
  res.json(counts);
});
router14.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where((0, import_drizzle_orm13.eq)(usersTable.id, req.user.userId));
  res.json({ isAdmin: user?.isAdmin ?? false });
});
router14.get("/payments/escrow", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const escrows = await db.select().from(escrowTransactionsTable).orderBy((0, import_drizzle_orm13.desc)(escrowTransactionsTable.createdAt)).limit(limit).offset(offset);
  const projectIds = [...new Set(escrows.map((e) => e.projectId))];
  const clientIds = [...new Set(escrows.map((e) => e.clientId))];
  const freelancerIds = [...new Set(escrows.map((e) => e.freelancerId))];
  const allUserIds = [.../* @__PURE__ */ new Set([...clientIds, ...freelancerIds])];
  const [projects, users] = await Promise.all([
    projectIds.length > 0 ? db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable) : Promise.resolve([]),
    allUserIds.length > 0 ? db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable) : Promise.resolve([])
  ]);
  const projMap = new Map(projects.map((p) => [p.id, p.title]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const enriched = escrows.map((e) => ({
    ...e,
    projectTitle: projMap.get(e.projectId) ?? null,
    clientName: userMap.get(e.clientId)?.name ?? null,
    freelancerName: userMap.get(e.freelancerId)?.name ?? null
  }));
  res.json(enriched);
});
router14.get("/payments/transactions", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const txns = await db.select().from(walletTransactionsTable).orderBy((0, import_drizzle_orm13.desc)(walletTransactionsTable.createdAt)).limit(limit).offset(offset);
  res.json(txns);
});
router14.get("/payments/withdrawals", requireAuth, requireAdmin, async (_req, res) => {
  const requests = await db.select().from(withdrawalRequestsTable).orderBy((0, import_drizzle_orm13.desc)(withdrawalRequestsTable.createdAt)).limit(200);
  const userIds = [...new Set(requests.map((r) => r.userId))];
  const users = userIds.length > 0 ? await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable) : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const enriched = requests.map((r) => ({
    ...r,
    userName: userMap.get(r.userId)?.name ?? null,
    userEmail: userMap.get(r.userId)?.email ?? null
  }));
  res.json(enriched);
});
router14.patch("/payments/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { status, adminNote } = req.body;
  if (!status || !["approved", "rejected", "completed"].includes(status)) {
    res.status(400).json({ error: "status must be approved, rejected or completed" });
    return;
  }
  const [wr] = await db.select().from(withdrawalRequestsTable).where((0, import_drizzle_orm13.eq)(withdrawalRequestsTable.id, id));
  if (!wr) {
    res.status(404).json({ error: "Withdrawal request not found" });
    return;
  }
  if (wr.status === "completed" || wr.status === "rejected") {
    res.status(400).json({ error: "Cannot update a completed or rejected request" });
    return;
  }
  if (status === "rejected") {
    const [wallet] = await db.select().from(walletsTable).where((0, import_drizzle_orm13.eq)(walletsTable.id, wr.walletId));
    if (wallet) {
      const currentBalance = parseFloat(wallet.balance);
      const refundedBalance = currentBalance + parseFloat(String(wr.amount));
      await Promise.all([
        db.update(walletsTable).set({ balance: String(refundedBalance) }).where((0, import_drizzle_orm13.eq)(walletsTable.id, wallet.id)),
        db.insert(walletTransactionsTable).values({
          walletId: wallet.id,
          userId: wr.userId,
          type: "credit",
          category: "refund",
          amount: String(wr.amount),
          balanceBefore: String(currentBalance),
          balanceAfter: String(refundedBalance),
          reference: `WDR-REJ-${wr.id}`,
          description: "Withdrawal request rejected \u2014 funds returned"
        })
      ]);
    }
  }
  const [updated] = await db.update(withdrawalRequestsTable).set({
    status,
    adminNote: adminNote ?? null,
    processedAt: /* @__PURE__ */ new Date()
  }).where((0, import_drizzle_orm13.eq)(withdrawalRequestsTable.id, id)).returning();
  res.json(updated);
});
var admin_default = router14;

// src/routes/reports.ts
var import_express15 = require("express");
var import_drizzle_orm14 = require("drizzle-orm");
init_src();
init_auth();
var router15 = (0, import_express15.Router)();
var VALID_REASONS = [
  "spam",
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "scam",
  "other"
];
router15.post("/", requireAuth, async (req, res) => {
  const { targetType, targetId, reason, description } = req.body;
  if (!["user", "project", "message"].includes(targetType)) {
    res.status(400).json({ error: "Invalid targetType" });
    return;
  }
  if (!targetId || isNaN(Number(targetId))) {
    res.status(400).json({ error: "Invalid targetId" });
    return;
  }
  if (!VALID_REASONS.includes(reason)) {
    res.status(400).json({ error: "Invalid reason" });
    return;
  }
  if (targetType === "user" && targetId === req.user.userId) {
    res.status(400).json({ error: "Cannot report yourself" });
    return;
  }
  const existing = await db.select({ id: reportsTable.id }).from(reportsTable).where(
    (0, import_drizzle_orm14.and)(
      (0, import_drizzle_orm14.eq)(reportsTable.reporterId, req.user.userId),
      (0, import_drizzle_orm14.eq)(reportsTable.targetType, targetType),
      (0, import_drizzle_orm14.eq)(reportsTable.targetId, Number(targetId))
    )
  ).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "You have already reported this" });
    return;
  }
  const [report] = await db.insert(reportsTable).values({
    reporterId: req.user.userId,
    targetType,
    targetId: Number(targetId),
    reason,
    description: description?.trim() || null
  }).returning();
  res.status(201).json({ id: report.id, message: "Report submitted. Our team will review it shortly." });
});
router15.get("/admin", requireAuth, async (req, res) => {
  const [me] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where((0, import_drizzle_orm14.eq)(usersTable.id, req.user.userId));
  if (!me?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const status = req.query.status;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  let query = db.select({
    report: reportsTable,
    reporterName: usersTable.name
  }).from(reportsTable).innerJoin(usersTable, (0, import_drizzle_orm14.eq)(reportsTable.reporterId, usersTable.id)).$dynamic();
  if (status) {
    query = query.where(
      (0, import_drizzle_orm14.eq)(reportsTable.status, status)
    );
  }
  const reports = await query.orderBy(import_drizzle_orm14.sql`${reportsTable.createdAt} DESC`).limit(limit).offset(offset);
  res.json(
    reports.map(({ report, reporterName }) => ({ ...report, reporterName }))
  );
});
router15.patch("/admin/:id", requireAuth, async (req, res) => {
  const [me] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where((0, import_drizzle_orm14.eq)(usersTable.id, req.user.userId));
  if (!me?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { status, adminNote } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (adminNote !== void 0) updates.adminNote = adminNote;
  if (status === "resolved" || status === "dismissed") {
    updates.resolvedAt = /* @__PURE__ */ new Date();
  }
  const [updated] = await db.update(reportsTable).set(updates).where((0, import_drizzle_orm14.eq)(reportsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(updated);
});
var reports_default = router15;

// src/routes/uploads.ts
var import_express16 = require("express");
var import_multer = __toESM(require("multer"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
init_auth();
var router16 = (0, import_express16.Router)();
var UPLOAD_DIR = import_path.default.join(process.cwd(), "uploads");
if (!import_fs.default.existsSync(UPLOAD_DIR)) {
  import_fs.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
var ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique5 = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = import_path.default.extname(file.originalname);
    cb(null, `${unique5}${ext}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Supported: images, PDF, Word docs, text files."));
    }
  }
});
router16.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof import_multer.default.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large. Maximum size is 10MB." });
      } else {
        res.status(400).json({ error: err.message ?? "Upload failed" });
      }
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({
      url,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size
    });
  });
});
var uploads_default = router16;

// src/routes/invitations.ts
var import_express17 = require("express");
var import_drizzle_orm15 = require("drizzle-orm");
init_src();
init_auth();
var router17 = (0, import_express17.Router)();
router17.post("/", requireAuth, requireRole("client"), async (req, res) => {
  const { projectId, freelancerProfileId, message } = req.body;
  if (!projectId || !freelancerProfileId) {
    res.status(400).json({ error: "projectId and freelancerProfileId are required" });
    return;
  }
  const clientId = req.user.userId;
  const [project] = await db.select({ id: projectsTable.id, title: projectsTable.title, status: projectsTable.status }).from(projectsTable).where((0, import_drizzle_orm15.and)((0, import_drizzle_orm15.eq)(projectsTable.id, projectId), (0, import_drizzle_orm15.eq)(projectsTable.clientId, clientId)));
  if (!project) {
    res.status(404).json({ error: "Project not found or not yours" });
    return;
  }
  if (project.status !== "open") {
    res.status(400).json({ error: "Can only invite freelancers to open projects" });
    return;
  }
  const [freelancer] = await db.select({ id: freelancerProfilesTable.id, userId: freelancerProfilesTable.userId }).from(freelancerProfilesTable).where((0, import_drizzle_orm15.eq)(freelancerProfilesTable.id, freelancerProfileId));
  if (!freelancer) {
    res.status(404).json({ error: "Freelancer profile not found" });
    return;
  }
  const [existing] = await db.select({ id: projectInvitationsTable.id, status: projectInvitationsTable.status }).from(projectInvitationsTable).where(
    (0, import_drizzle_orm15.and)(
      (0, import_drizzle_orm15.eq)(projectInvitationsTable.projectId, projectId),
      (0, import_drizzle_orm15.eq)(projectInvitationsTable.freelancerProfileId, freelancerProfileId)
    )
  );
  if (existing) {
    if (existing.status === "pending") {
      res.status(409).json({ error: "An invitation is already pending for this freelancer on this project" });
      return;
    }
    await db.update(projectInvitationsTable).set({ status: "pending", message: message ?? null, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm15.eq)(projectInvitationsTable.id, existing.id));
    res.json({ id: existing.id, status: "pending", message: "Invitation re-sent" });
    return;
  }
  const [invite] = await db.insert(projectInvitationsTable).values({ projectId, clientId, freelancerProfileId, message: message ?? null }).returning();
  const [client] = await db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm15.eq)(usersTable.id, clientId));
  await db.insert(notificationsTable).values({
    userId: freelancer.userId,
    type: "project_invitation",
    title: "You've been invited to a project",
    message: `${client?.name ?? "A client"} invited you to work on "${project.title}"`,
    link: `/invitations`
  });
  res.status(201).json(invite);
});
router17.get("/", requireAuth, async (req, res) => {
  const { userId, role } = req.user;
  if (role === "freelancer") {
    const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm15.eq)(freelancerProfilesTable.userId, userId));
    if (!profile) {
      res.json([]);
      return;
    }
    const invites = await db.select({
      id: projectInvitationsTable.id,
      status: projectInvitationsTable.status,
      message: projectInvitationsTable.message,
      createdAt: projectInvitationsTable.createdAt,
      projectId: projectInvitationsTable.projectId,
      projectTitle: projectsTable.title,
      projectCategory: projectsTable.category,
      projectBudgetMin: projectsTable.budgetMin,
      projectBudgetMax: projectsTable.budgetMax,
      projectStatus: projectsTable.status,
      clientId: projectInvitationsTable.clientId,
      clientName: usersTable.name
    }).from(projectInvitationsTable).innerJoin(projectsTable, (0, import_drizzle_orm15.eq)(projectInvitationsTable.projectId, projectsTable.id)).innerJoin(usersTable, (0, import_drizzle_orm15.eq)(projectInvitationsTable.clientId, usersTable.id)).where((0, import_drizzle_orm15.eq)(projectInvitationsTable.freelancerProfileId, profile.id)).orderBy(import_drizzle_orm15.sql`${projectInvitationsTable.createdAt} DESC`);
    res.json(invites);
    return;
  }
  if (role === "client") {
    const invites = await db.select({
      id: projectInvitationsTable.id,
      status: projectInvitationsTable.status,
      message: projectInvitationsTable.message,
      createdAt: projectInvitationsTable.createdAt,
      projectId: projectInvitationsTable.projectId,
      projectTitle: projectsTable.title,
      freelancerProfileId: projectInvitationsTable.freelancerProfileId,
      freelancerName: usersTable.name,
      freelancerAvatarUrl: usersTable.avatarUrl
    }).from(projectInvitationsTable).innerJoin(projectsTable, (0, import_drizzle_orm15.eq)(projectInvitationsTable.projectId, projectsTable.id)).innerJoin(freelancerProfilesTable, (0, import_drizzle_orm15.eq)(projectInvitationsTable.freelancerProfileId, freelancerProfilesTable.id)).innerJoin(usersTable, (0, import_drizzle_orm15.eq)(freelancerProfilesTable.userId, usersTable.id)).where((0, import_drizzle_orm15.eq)(projectInvitationsTable.clientId, userId)).orderBy(import_drizzle_orm15.sql`${projectInvitationsTable.createdAt} DESC`);
    res.json(invites);
    return;
  }
  res.json([]);
});
router17.patch("/:id", requireAuth, requireRole("freelancer"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { status } = req.body;
  if (status !== "accepted" && status !== "declined") {
    res.status(400).json({ error: "status must be 'accepted' or 'declined'" });
    return;
  }
  const [profile] = await db.select({ id: freelancerProfilesTable.id }).from(freelancerProfilesTable).where((0, import_drizzle_orm15.eq)(freelancerProfilesTable.userId, req.user.userId));
  if (!profile) {
    res.status(403).json({ error: "Freelancer profile not found" });
    return;
  }
  const [invite] = await db.select().from(projectInvitationsTable).where((0, import_drizzle_orm15.and)((0, import_drizzle_orm15.eq)(projectInvitationsTable.id, id), (0, import_drizzle_orm15.eq)(projectInvitationsTable.freelancerProfileId, profile.id)));
  if (!invite) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  if (invite.status !== "pending") {
    res.status(400).json({ error: "Invitation is no longer pending" });
    return;
  }
  const [updated] = await db.update(projectInvitationsTable).set({ status }).where((0, import_drizzle_orm15.eq)(projectInvitationsTable.id, id)).returning();
  const [project] = await db.select({ title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm15.eq)(projectsTable.id, invite.projectId));
  const [freelancerUser] = await db.select({ name: usersTable.name }).from(usersTable).where((0, import_drizzle_orm15.eq)(usersTable.id, req.user.userId));
  await db.insert(notificationsTable).values({
    userId: invite.clientId,
    type: "invitation_response",
    title: status === "accepted" ? "Invitation accepted!" : "Invitation declined",
    message: `${freelancerUser?.name ?? "A freelancer"} ${status === "accepted" ? "accepted" : "declined"} your invitation to "${project?.title ?? "your project"}"`,
    link: `/my-projects`
  });
  res.json(updated);
});
router17.get("/check", requireAuth, requireRole("client"), async (req, res) => {
  const projectId = parseInt(req.query.projectId, 10);
  const freelancerProfileId = parseInt(req.query.freelancerProfileId, 10);
  if (isNaN(projectId) || isNaN(freelancerProfileId)) {
    res.json({ invited: false });
    return;
  }
  const [existing] = await db.select({ id: projectInvitationsTable.id, status: projectInvitationsTable.status }).from(projectInvitationsTable).where(
    (0, import_drizzle_orm15.and)(
      (0, import_drizzle_orm15.eq)(projectInvitationsTable.projectId, projectId),
      (0, import_drizzle_orm15.eq)(projectInvitationsTable.freelancerProfileId, freelancerProfileId)
    )
  );
  res.json({ invited: !!existing, status: existing?.status ?? null });
});
var invitations_default = router17;

// src/routes/wallet.ts
var import_express18 = require("express");
var import_drizzle_orm16 = require("drizzle-orm");
init_src();
init_auth();
var import_zod4 = require("zod");
var router18 = (0, import_express18.Router)();
async function getOrCreateWallet2(userId) {
  const [existing] = await db.select().from(walletsTable).where((0, import_drizzle_orm16.eq)(walletsTable.userId, userId));
  if (existing) return existing;
  const [wallet] = await db.insert(walletsTable).values({ userId }).returning();
  return wallet;
}
router18.get("/", requireAuth, async (req, res) => {
  const wallet = await getOrCreateWallet2(req.user.userId);
  const transactions = await db.select().from(walletTransactionsTable).where((0, import_drizzle_orm16.eq)(walletTransactionsTable.walletId, wallet.id)).orderBy((0, import_drizzle_orm16.desc)(walletTransactionsTable.createdAt)).limit(5);
  res.json({ wallet, recentTransactions: transactions });
});
router18.get("/transactions", requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const offset = parseInt(req.query.offset || "0", 10);
  const wallet = await getOrCreateWallet2(req.user.userId);
  const transactions = await db.select().from(walletTransactionsTable).where((0, import_drizzle_orm16.eq)(walletTransactionsTable.walletId, wallet.id)).orderBy((0, import_drizzle_orm16.desc)(walletTransactionsTable.createdAt)).limit(limit).offset(offset);
  const escrowIds = transactions.filter((t) => t.escrowTransactionId).map((t) => t.escrowTransactionId);
  let projectTitleMap = /* @__PURE__ */ new Map();
  if (escrowIds.length > 0) {
    const escrows = await db.select({ id: escrowTransactionsTable.id, projectId: escrowTransactionsTable.projectId }).from(escrowTransactionsTable);
    const projectIds = escrows.map((e) => e.projectId);
    if (projectIds.length > 0) {
      const projects = await db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable);
      const projMap = new Map(projects.map((p) => [p.id, p.title]));
      const escrowMap = new Map(escrows.map((e) => [e.id, e.projectId]));
      projectTitleMap = new Map(
        [...escrowMap.entries()].map(([escrowId, projId]) => [escrowId, projMap.get(projId) ?? ""])
      );
    }
  }
  const enriched = transactions.map((t) => ({
    ...t,
    projectTitle: t.escrowTransactionId ? projectTitleMap.get(t.escrowTransactionId) ?? null : null
  }));
  res.json({ wallet, transactions: enriched, total: transactions.length });
});
var WithdrawBody = import_zod4.z.object({
  amount: import_zod4.z.number().positive("Amount must be positive"),
  bankName: import_zod4.z.string().min(2, "Bank name required"),
  accountNumber: import_zod4.z.string().min(6, "Account number required").max(20),
  accountName: import_zod4.z.string().min(2, "Account name required"),
  note: import_zod4.z.string().max(500).optional()
});
router18.post("/withdraw", requireAuth, async (req, res) => {
  const parsed = WithdrawBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const uid = req.user.userId;
  const wallet = await getOrCreateWallet2(uid);
  const balance = parseFloat(wallet.balance);
  const { amount, bankName, accountNumber, accountName, note } = parsed.data;
  if (amount > balance) {
    res.status(400).json({ error: `Insufficient balance. Available: \u20A6${balance.toLocaleString()}` });
    return;
  }
  const [pending] = await db.select({ id: withdrawalRequestsTable.id }).from(withdrawalRequestsTable).where((0, import_drizzle_orm16.and)((0, import_drizzle_orm16.eq)(withdrawalRequestsTable.userId, uid), (0, import_drizzle_orm16.eq)(withdrawalRequestsTable.status, "pending")));
  if (pending) {
    res.status(409).json({ error: "You already have a pending withdrawal request" });
    return;
  }
  const newBalance = balance - amount;
  await db.update(walletsTable).set({ balance: String(newBalance) }).where((0, import_drizzle_orm16.eq)(walletsTable.id, wallet.id));
  const [request2] = await db.insert(withdrawalRequestsTable).values({
    walletId: wallet.id,
    userId: uid,
    amount: String(amount),
    bankName,
    accountNumber,
    accountName,
    note: note ?? null
  }).returning();
  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    userId: uid,
    type: "debit",
    category: "withdrawal",
    amount: String(amount),
    balanceBefore: String(balance),
    balanceAfter: String(newBalance),
    reference: `WDR-${request2.id}`,
    description: `Withdrawal request to ${bankName} (${accountNumber})`
  }).catch(() => {
  });
  res.status(201).json({ message: "Withdrawal request submitted", request: request2 });
});
router18.get("/withdrawals", requireAuth, async (req, res) => {
  const requests = await db.select().from(withdrawalRequestsTable).where((0, import_drizzle_orm16.eq)(withdrawalRequestsTable.userId, req.user.userId)).orderBy((0, import_drizzle_orm16.desc)(withdrawalRequestsTable.createdAt));
  res.json(requests);
});
router18.get("/invoices", requireAuth, async (req, res) => {
  const uid = req.user.userId;
  const role = req.user.role;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  let invoices;
  if (role === "client") {
    invoices = await db.select().from(invoicesTable).where((0, import_drizzle_orm16.eq)(invoicesTable.clientId, uid)).orderBy((0, import_drizzle_orm16.desc)(invoicesTable.createdAt)).limit(limit);
  } else {
    invoices = await db.select().from(invoicesTable).where((0, import_drizzle_orm16.eq)(invoicesTable.freelancerId, uid)).orderBy((0, import_drizzle_orm16.desc)(invoicesTable.createdAt)).limit(limit);
  }
  const projectIds = [...new Set(invoices.map((i) => i.projectId))];
  const projects = projectIds.length > 0 ? await db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable).where((0, import_drizzle_orm16.eq)(projectsTable.id, projectIds[0])) : [];
  const allProjects = await db.select({ id: projectsTable.id, title: projectsTable.title }).from(projectsTable);
  const projMap = new Map(allProjects.map((p) => [p.id, p.title]));
  const enriched = invoices.map((inv) => ({
    ...inv,
    projectTitle: projMap.get(inv.projectId) ?? null
  }));
  res.json(enriched);
});
router18.get("/invoices/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [invoice] = await db.select().from(invoicesTable).where((0, import_drizzle_orm16.eq)(invoicesTable.id, id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const uid = req.user.userId;
  const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where((0, import_drizzle_orm16.eq)(usersTable.id, uid));
  if (invoice.clientId !== uid && invoice.freelancerId !== uid && !user?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [[project], [client], [freelancer], [escrow]] = await Promise.all([
    db.select().from(projectsTable).where((0, import_drizzle_orm16.eq)(projectsTable.id, invoice.projectId)),
    db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, companyName: usersTable.companyName }).from(usersTable).where((0, import_drizzle_orm16.eq)(usersTable.id, invoice.clientId)),
    db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).where((0, import_drizzle_orm16.eq)(usersTable.id, invoice.freelancerId)),
    db.select().from(escrowTransactionsTable).where((0, import_drizzle_orm16.eq)(escrowTransactionsTable.id, invoice.escrowTransactionId))
  ]);
  res.json({ invoice, project, client, freelancer, escrow });
});
var wallet_default = router18;

// src/routes/analytics.ts
var import_express19 = require("express");
var import_drizzle_orm17 = require("drizzle-orm");
init_src();
init_auth();
var router19 = (0, import_express19.Router)();
function lastNMonths(n) {
  const months = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    months.push({ key, label });
  }
  return months;
}
function zeroFillMonths(months, data) {
  const map = new Map(data.map((d) => [d.month, d.value]));
  return months.map((m) => ({ month: m.label, value: map.get(m.key) ?? 0 }));
}
function requireAdmin2(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  (async () => {
    const [user] = await db.select({ isAdmin: usersTable.isAdmin }).from(usersTable).where((0, import_drizzle_orm17.eq)(usersTable.id, req.user.userId));
    if (!user?.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  })().catch(next);
}
router19.get("/freelancer", requireAuth, requireRole("freelancer"), async (req, res) => {
  const userId = req.user.userId;
  const [profile] = await db.select().from(freelancerProfilesTable).where((0, import_drizzle_orm17.eq)(freelancerProfilesTable.userId, userId));
  if (!profile) {
    res.status(404).json({ error: "No freelancer profile" });
    return;
  }
  const months = lastNMonths(6);
  const sixMonthsAgo = /* @__PURE__ */ new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [
    allApps,
    monthlyEarningsRaw,
    activeProjectsRaw
  ] = await Promise.all([
    db.select({ status: applicationsTable.status }).from(applicationsTable).where((0, import_drizzle_orm17.eq)(applicationsTable.freelancerId, userId)),
    // Monthly earnings from wallet credits (escrow releases)
    db.select({
      month: import_drizzle_orm17.sql`TO_CHAR(${walletTransactionsTable.createdAt}, 'YYYY-MM')`,
      value: import_drizzle_orm17.sql`COALESCE(SUM(${walletTransactionsTable.amount}::numeric), 0)`
    }).from(walletTransactionsTable).where((0, import_drizzle_orm17.and)(
      (0, import_drizzle_orm17.eq)(walletTransactionsTable.userId, userId),
      (0, import_drizzle_orm17.eq)(walletTransactionsTable.type, "credit"),
      (0, import_drizzle_orm17.eq)(walletTransactionsTable.category, "escrow_release"),
      import_drizzle_orm17.sql`${walletTransactionsTable.createdAt} >= ${sixMonthsAgo.toISOString()}`
    )).groupBy(import_drizzle_orm17.sql`TO_CHAR(${walletTransactionsTable.createdAt}, 'YYYY-MM')`),
    // Active (in_progress) projects where this freelancer was accepted
    db.select({ id: projectsTable.id }).from(projectsTable).innerJoin(applicationsTable, (0, import_drizzle_orm17.and)(
      (0, import_drizzle_orm17.eq)(applicationsTable.projectId, projectsTable.id),
      (0, import_drizzle_orm17.eq)(applicationsTable.freelancerId, userId),
      (0, import_drizzle_orm17.eq)(applicationsTable.status, "accepted")
    )).where((0, import_drizzle_orm17.eq)(projectsTable.status, "in_progress"))
  ]);
  const totalApplications = allApps.length;
  const acceptedJobs = allApps.filter((a) => a.status === "accepted").length;
  const pendingApplications = allApps.filter((a) => a.status === "pending").length;
  const acceptanceRate = totalApplications > 0 ? Math.round(acceptedJobs / totalApplications * 100) : 0;
  const monthlyEarnings = zeroFillMonths(months, monthlyEarningsRaw.map((r) => ({
    month: r.month,
    value: Number(r.value)
  })));
  res.json({
    totalEarnings: profile.totalEarnings,
    completedProjects: profile.completedProjects,
    averageRating: profile.averageRating,
    totalReviews: profile.totalReviews,
    profileViews: profile.profileViews,
    hourlyRate: profile.hourlyRate,
    availabilityStatus: profile.availabilityStatus,
    totalApplications,
    acceptedJobs,
    pendingApplications,
    acceptanceRate,
    activeProjects: activeProjectsRaw.length,
    monthlyEarnings
  });
});
router19.get("/client", requireAuth, requireRole("client"), async (req, res) => {
  const userId = req.user.userId;
  const months = lastNMonths(6);
  const sixMonthsAgo = /* @__PURE__ */ new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const allProjects = await db.select().from(projectsTable).where((0, import_drizzle_orm17.eq)(projectsTable.clientId, userId));
  const projectIds = allProjects.map((p) => p.id);
  if (projectIds.length === 0) {
    const empty = months.map((m) => ({ month: m.label, value: 0 }));
    res.json({
      totalProjectsPosted: 0,
      activeProjects: 0,
      completedProjects: 0,
      cancelledProjects: 0,
      totalSpending: 0,
      freelancersHired: 0,
      projectSuccessRate: 0,
      avgFreelancerRating: null,
      monthlySpending: empty
    });
    return;
  }
  const [allApps, spendingRaw, ratingsRaw] = await Promise.all([
    db.select({ freelancerId: applicationsTable.freelancerId, status: applicationsTable.status }).from(applicationsTable).where((0, import_drizzle_orm17.inArray)(applicationsTable.projectId, projectIds)),
    // Monthly spending from funded escrow transactions
    db.select({
      month: import_drizzle_orm17.sql`TO_CHAR(${escrowTransactionsTable.fundedAt}, 'YYYY-MM')`,
      value: import_drizzle_orm17.sql`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)`
    }).from(escrowTransactionsTable).where((0, import_drizzle_orm17.and)(
      (0, import_drizzle_orm17.inArray)(escrowTransactionsTable.projectId, projectIds),
      import_drizzle_orm17.sql`${escrowTransactionsTable.fundedAt} IS NOT NULL`,
      import_drizzle_orm17.sql`${escrowTransactionsTable.fundedAt} >= ${sixMonthsAgo.toISOString()}`
    )).groupBy(import_drizzle_orm17.sql`TO_CHAR(${escrowTransactionsTable.fundedAt}, 'YYYY-MM')`),
    // Average rating of freelancers they've reviewed
    db.select({ avg: import_drizzle_orm17.sql`COALESCE(AVG(${reviewsTable.rating}), 0)` }).from(reviewsTable).where((0, import_drizzle_orm17.eq)(reviewsTable.reviewerId, userId))
  ]);
  const activeProjects = allProjects.filter((p) => p.status === "in_progress").length;
  const completedProjects = allProjects.filter((p) => p.status === "completed").length;
  const cancelledProjects = allProjects.filter((p) => p.status === "cancelled").length;
  const billableProjects = allProjects.length - cancelledProjects;
  const projectSuccessRate = billableProjects > 0 ? Math.round(completedProjects / billableProjects * 100) : 0;
  const acceptedApps = allApps.filter((a) => a.status === "accepted");
  const freelancersHired = new Set(acceptedApps.map((a) => a.freelancerId)).size;
  const [totalSpendingRow] = await db.select({
    total: import_drizzle_orm17.sql`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)`
  }).from(escrowTransactionsTable).where((0, import_drizzle_orm17.and)(
    (0, import_drizzle_orm17.inArray)(escrowTransactionsTable.projectId, projectIds),
    import_drizzle_orm17.sql`${escrowTransactionsTable.fundedAt} IS NOT NULL`
  ));
  const monthlySpending = zeroFillMonths(months, spendingRaw.map((r) => ({
    month: r.month,
    value: Number(r.value)
  })));
  res.json({
    totalProjectsPosted: allProjects.length,
    activeProjects,
    completedProjects,
    cancelledProjects,
    totalSpending: Number(totalSpendingRow?.total ?? 0),
    freelancersHired,
    projectSuccessRate,
    avgFreelancerRating: Number(ratingsRaw[0]?.avg ?? 0) || null,
    monthlySpending
  });
});
router19.get("/admin", requireAuth, requireAdmin2, async (_req, res) => {
  const months = lastNMonths(6);
  const sixMonthsAgo = /* @__PURE__ */ new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [
    userCounts,
    projectCounts,
    revenueRow,
    monthlyUsersRaw,
    monthlyRevenueRaw,
    recentUsers,
    recentEscrows,
    topFreelancers
  ] = await Promise.all([
    // Users by role
    db.select({ role: usersTable.role, cnt: import_drizzle_orm17.sql`count(*)` }).from(usersTable).groupBy(usersTable.role),
    // Projects by status
    db.select({ status: projectsTable.status, cnt: import_drizzle_orm17.sql`count(*)` }).from(projectsTable).groupBy(projectsTable.status),
    // Total platform revenue (all released escrow)
    db.select({ total: import_drizzle_orm17.sql`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)` }).from(escrowTransactionsTable).where((0, import_drizzle_orm17.eq)(escrowTransactionsTable.status, "released")),
    // Monthly new registrations
    db.select({
      month: import_drizzle_orm17.sql`TO_CHAR(${usersTable.createdAt}, 'YYYY-MM')`,
      value: import_drizzle_orm17.sql`count(*)`
    }).from(usersTable).where(import_drizzle_orm17.sql`${usersTable.createdAt} >= ${sixMonthsAgo.toISOString()}`).groupBy(import_drizzle_orm17.sql`TO_CHAR(${usersTable.createdAt}, 'YYYY-MM')`),
    // Monthly revenue (released escrows)
    db.select({
      month: import_drizzle_orm17.sql`TO_CHAR(${escrowTransactionsTable.releasedAt}, 'YYYY-MM')`,
      value: import_drizzle_orm17.sql`COALESCE(SUM(${escrowTransactionsTable.amount}::numeric), 0)`
    }).from(escrowTransactionsTable).where((0, import_drizzle_orm17.and)(
      (0, import_drizzle_orm17.eq)(escrowTransactionsTable.status, "released"),
      import_drizzle_orm17.sql`${escrowTransactionsTable.releasedAt} IS NOT NULL`,
      import_drizzle_orm17.sql`${escrowTransactionsTable.releasedAt} >= ${sixMonthsAgo.toISOString()}`
    )).groupBy(import_drizzle_orm17.sql`TO_CHAR(${escrowTransactionsTable.releasedAt}, 'YYYY-MM')`),
    // Recent user registrations
    db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt
    }).from(usersTable).orderBy(import_drizzle_orm17.sql`${usersTable.createdAt} DESC`).limit(6),
    // Recent escrow transactions
    db.select({
      id: escrowTransactionsTable.id,
      projectId: escrowTransactionsTable.projectId,
      amount: escrowTransactionsTable.amount,
      status: escrowTransactionsTable.status,
      createdAt: escrowTransactionsTable.createdAt
    }).from(escrowTransactionsTable).orderBy(import_drizzle_orm17.sql`${escrowTransactionsTable.createdAt} DESC`).limit(6),
    // Top freelancers by earnings
    db.select({
      id: freelancerProfilesTable.id,
      userId: freelancerProfilesTable.userId,
      name: usersTable.name,
      totalEarnings: freelancerProfilesTable.totalEarnings,
      completedProjects: freelancerProfilesTable.completedProjects,
      averageRating: freelancerProfilesTable.averageRating
    }).from(freelancerProfilesTable).innerJoin(usersTable, (0, import_drizzle_orm17.eq)(freelancerProfilesTable.userId, usersTable.id)).orderBy(import_drizzle_orm17.sql`${freelancerProfilesTable.totalEarnings} DESC`).limit(5)
  ]);
  const roleMap = new Map(userCounts.map((u) => [u.role, Number(u.cnt)]));
  const statusMap = new Map(projectCounts.map((p) => [p.status, Number(p.cnt)]));
  const totalUsers = userCounts.reduce((s, u) => s + Number(u.cnt), 0);
  const totalProjects = projectCounts.reduce((s, p) => s + Number(p.cnt), 0);
  const monthlyRegistrations = zeroFillMonths(months, monthlyUsersRaw.map((r) => ({ month: r.month, value: Number(r.value) })));
  const monthlyRevenue = zeroFillMonths(months, monthlyRevenueRaw.map((r) => ({ month: r.month, value: Number(r.value) })));
  res.json({
    totalUsers,
    totalFreelancers: roleMap.get("freelancer") ?? 0,
    totalClients: roleMap.get("client") ?? 0,
    totalProjects,
    openProjects: statusMap.get("open") ?? 0,
    activeProjects: statusMap.get("in_progress") ?? 0,
    completedProjects: statusMap.get("completed") ?? 0,
    cancelledProjects: statusMap.get("cancelled") ?? 0,
    platformRevenue: Number(revenueRow[0]?.total ?? 0),
    monthlyRegistrations,
    monthlyRevenue,
    recentUsers,
    recentPayments: recentEscrows,
    topFreelancers
  });
});
var analytics_default = router19;

// src/index.ts
if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET is not set. Add it to your Replit secrets and restart.");
  process.exit(1);
}
var app = (0, import_express20.default)();
var PORT = parseInt(process.env.PORT ?? "8080", 10);
app.set("trust proxy", 1);
var ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : null;
app.use(
  (0, import_cors.default)({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS) {
        return callback(null, ALLOWED_ORIGINS.includes(origin));
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use((0, import_compression.default)());
app.use(import_express20.default.json({ limit: "1mb" }));
app.use(import_express20.default.urlencoded({ extended: true, limit: "1mb" }));
app.use((0, import_cookie_parser.default)());
app.use((0, import_pino_http.default)({ logger, autoLogging: { ignore: (req) => req.url === "/api/healthz" } }));
var registerLimiter = (0, import_express_rate_limit2.default)({
  windowMs: 15 * 60 * 1e3,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts, please try again later." }
});
var authLimiter = (0, import_express_rate_limit2.default)({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
var generalLimiter = (0, import_express_rate_limit2.default)({
  windowMs: 15 * 60 * 1e3,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/auth/register", registerLimiter);
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/auth", auth_default);
app.use("/api/users", users_default);
app.use("/api/freelancers", freelancers_default);
app.use("/api/skills", skills_default);
app.use("/api/projects", projects_default);
app.use("/api/applications", applications_default);
app.use("/api/dashboard", dashboard_default);
app.use("/api/reviews", reviews_default);
app.use("/api/messages", messages_default);
app.use("/api/notifications", notifications_default);
app.use("/api/saved", saved_default);
app.use("/api/portfolio", portfolio_default);
app.use("/api/admin", admin_default);
app.use("/api/reports", reports_default);
app.use("/api/uploads", uploads_default);
app.use("/api/invitations", invitations_default);
app.use("/api/payments", payments_default);
app.use("/api/wallet", wallet_default);
app.use("/api/analytics", analytics_default);
app.use("/uploads", import_express20.default.static(import_path2.default.join(process.cwd(), "uploads")));
app.get("/api/presence", (req, res) => {
  const ids = (req.query.ids ?? "").split(",").map(Number).filter((n) => !isNaN(n));
  const result = {};
  for (const id of ids) result[id] = isUserOnline(id);
  res.json(result);
});
app.get("/og/project/:id", async (req, res) => {
  try {
    const { db: db2, projectsTable: projectsTable2, usersTable: usersTable2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const { eq: eq18 } = await import("drizzle-orm");
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).send("Invalid id");
      return;
    }
    const [project] = await db2.select().from(projectsTable2).where(eq18(projectsTable2.id, id));
    if (!project) {
      res.status(404).send("Not found");
      return;
    }
    const [client] = await db2.select({ name: usersTable2.name }).from(usersTable2).where(eq18(usersTable2.id, project.clientId));
    const title = `${project.title} \u2014 SkillMarket AI`;
    const desc3 = project.description.slice(0, 200);
    const url = `${req.protocol}://${req.get("host")}/projects/${id}`;
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html><html><head>
      <title>${title}</title>
      <meta name="description" content="${desc3}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${desc3}">
      <meta property="og:url" content="${url}">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="SkillMarket AI">
      <meta name="twitter:card" content="summary">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${desc3}">
      <meta name="author" content="${client?.name ?? "SkillMarket AI"}">
      <link rel="canonical" href="${url}">
      <script>window.location.href="${url}"</script>
    </head><body>Redirecting to <a href="${url}">${title}</a></body></html>`);
  } catch (err) {
    logger.error(err);
    res.status(500).send("Error");
  }
});
if (process.env.NODE_ENV === "production") {
  const frontendDist = import_path2.default.join(process.cwd(), "artifacts/skillmarket/dist");
  app.use(import_express20.default.static(frontendDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(import_path2.default.join(frontendDist, "index.html"));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}
app.use((err, _req, res, _next) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});
var httpServer = import_http.default.createServer(app);
initSocket(httpServer);
httpServer.listen(PORT, "0.0.0.0", () => {
  logger.info(`API server listening on port ${PORT}`);
});
var index_default = app;
//# sourceMappingURL=index.js.map
