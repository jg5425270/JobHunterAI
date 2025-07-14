import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications table
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  platform: text("platform").notNull(), // Upwork, Freelancer, Indeed, etc.
  url: text("url"),
  description: text("description"),
  payRate: text("pay_rate"),
  location: text("location"),
  status: text("status").notNull().default("pending"), // pending, responded, interview, offer, declined
  requiresInterview: boolean("requires_interview").default(false),
  jobType: text("job_type").default("contract"), // contract, full-time, part-time, freelance
  skills: text("skills").array(), // Required skills for the job
  matchingScore: integer("matching_score").default(0), // How well user profile matches (0-100)
  appliedAt: timestamp("applied_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes"),
});

// Email tracking table
export const emailTracking = pgTable("email_tracking", {
  id: serial("id").primaryKey(),
  jobApplicationId: integer("job_application_id").references(() => jobApplications.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  messageId: text("message_id").unique(),
  subject: text("subject"),
  sender: text("sender"),
  content: text("content"),
  category: text("category"), // positive, negative, follow-up, interview, offer
  receivedAt: timestamp("received_at").defaultNow(),
  isRead: boolean("is_read").default(false),
  autoReplied: boolean("auto_replied").default(false),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  dailyTarget: integer("daily_target").default(7),
  preferredLocation: text("preferred_location").default("Remote"),
  minPayRate: integer("min_pay_rate").default(50),
  autoApplyEnabled: boolean("auto_apply_enabled").default(true),
  emailIntegrationEnabled: boolean("email_integration_enabled").default(false),
  interviewFreeOnly: boolean("interview_free_only").default(true),
  preferredJobTypes: text("preferred_job_types").array().default(['contract', 'freelance']),
  userSkills: text("user_skills").array().default([]),
  resumeText: text("resume_text"),
  coverLetterTemplate: text("cover_letter_template"),
  bankAccountDetails: jsonb("bank_account_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform credentials table (encrypted)
export const platformCredentials = pgTable("platform_credentials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // upwork, freelancer, indeed, etc.
  encryptedCredentials: text("encrypted_credentials").notNull(),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily application stats
export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  applicationsCount: integer("applications_count").default(0),
  responsesCount: integer("responses_count").default(0),
  target: integer("target").default(7),
  earnings: numeric("earnings", { precision: 10, scale: 2 }).default("0"),
});

// Contacts table for resume outreach
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  jobTitle: text("job_title"),
  industry: text("industry"),
  notes: text("notes"),
  tags: text("tags").array().default([]),
  lastContacted: timestamp("last_contacted"),
  responseReceived: boolean("response_received").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Resume templates table
export const resumeTemplates = pgTable("resume_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  industry: text("industry"),
  skills: text("skills").array().default([]),
  content: text("content").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email campaigns table
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  contactIds: integer("contact_ids").array().default([]),
  sentCount: integer("sent_count").default(0),
  responseCount: integer("response_count").default(0),
  status: text("status").default("draft"), // draft, sending, sent, completed
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertJobApplication = typeof jobApplications.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;

export type InsertEmailTracking = typeof emailTracking.$inferInsert;
export type EmailTracking = typeof emailTracking.$inferSelect;

export type InsertUserSettings = typeof userSettings.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;

export type InsertPlatformCredentials = typeof platformCredentials.$inferInsert;
export type PlatformCredentials = typeof platformCredentials.$inferSelect;

export type InsertDailyStats = typeof dailyStats.$inferInsert;
export type DailyStats = typeof dailyStats.$inferSelect;

export type InsertContact = typeof contacts.$inferInsert;
export type Contact = typeof contacts.$inferSelect;

export type InsertResumeTemplate = typeof resumeTemplates.$inferInsert;
export type ResumeTemplate = typeof resumeTemplates.$inferSelect;

export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// Insert schemas
export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  userId: true,
  appliedAt: true,
  lastUpdated: true,
});

export const insertEmailTrackingSchema = createInsertSchema(emailTracking).omit({
  id: true,
  userId: true,
  receivedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformCredentialsSchema = createInsertSchema(platformCredentials).omit({
  id: true,
  userId: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
  userId: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResumeTemplateSchema = createInsertSchema(resumeTemplates).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
