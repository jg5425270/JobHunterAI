import {
  users,
  jobApplications,
  emailTracking,
  userSettings,
  platformCredentials,
  dailyStats,
  contacts,
  resumeTemplates,
  emailCampaigns,
  type User,
  type UpsertUser,
  type JobApplication,
  type InsertJobApplication,
  type EmailTracking,
  type InsertEmailTracking,
  type UserSettings,
  type InsertUserSettings,
  type PlatformCredentials,
  type InsertPlatformCredentials,
  type DailyStats,
  type InsertDailyStats,
  type Contact,
  type InsertContact,
  type ResumeTemplate,
  type InsertResumeTemplate,
  type EmailCampaign,
  type InsertEmailCampaign,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Job application operations
  getJobApplications(userId: string): Promise<JobApplication[]>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, updates: Partial<InsertJobApplication>): Promise<JobApplication>;
  deleteJobApplication(id: number): Promise<void>;
  
  // Email tracking operations
  getEmailsForJob(jobApplicationId: number): Promise<EmailTracking[]>;
  getUnreadEmails(userId: string): Promise<EmailTracking[]>;
  createEmailTracking(email: InsertEmailTracking): Promise<EmailTracking>;
  updateEmailTracking(id: number, updates: Partial<InsertEmailTracking>): Promise<EmailTracking>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings & { userId: string }): Promise<UserSettings>;
  
  // Platform credentials operations
  getPlatformCredentials(userId: string): Promise<PlatformCredentials[]>;
  createPlatformCredentials(credentials: InsertPlatformCredentials): Promise<PlatformCredentials>;
  updatePlatformCredentials(id: number, updates: Partial<InsertPlatformCredentials>): Promise<PlatformCredentials>;
  deletePlatformCredentials(id: number): Promise<void>;
  
  // Daily stats operations
  getDailyStats(userId: string, date: string): Promise<DailyStats | undefined>;
  upsertDailyStats(stats: InsertDailyStats & { userId: string }): Promise<DailyStats>;
  getWeeklyStats(userId: string): Promise<DailyStats[]>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    todayApplications: number;
    totalApplications: number;
    responseRate: number;
    totalResponses: number;
    weeklyEarnings: number;
  }>;
  
  // Contact operations
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  
  // Resume template operations
  getResumeTemplates(userId: string): Promise<ResumeTemplate[]>;
  getResumeTemplate(id: number): Promise<ResumeTemplate | undefined>;
  createResumeTemplate(template: InsertResumeTemplate): Promise<ResumeTemplate>;
  updateResumeTemplate(id: number, updates: Partial<InsertResumeTemplate>): Promise<ResumeTemplate>;
  deleteResumeTemplate(id: number): Promise<void>;
  
  // Email campaign operations
  getEmailCampaigns(userId: string): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign>;
  deleteEmailCampaign(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Job application operations
  async getJobApplications(userId: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const [application] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));
    return application;
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [newApplication] = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    return newApplication;
  }

  async updateJobApplication(id: number, updates: Partial<InsertJobApplication>): Promise<JobApplication> {
    const [updatedApplication] = await db
      .update(jobApplications)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();
    return updatedApplication;
  }

  async deleteJobApplication(id: number): Promise<void> {
    await db.delete(jobApplications).where(eq(jobApplications.id, id));
  }

  // Email tracking operations
  async getEmailsForJob(jobApplicationId: number): Promise<EmailTracking[]> {
    return await db
      .select()
      .from(emailTracking)
      .where(eq(emailTracking.jobApplicationId, jobApplicationId))
      .orderBy(desc(emailTracking.receivedAt));
  }

  async getUnreadEmails(userId: string): Promise<EmailTracking[]> {
    return await db
      .select()
      .from(emailTracking)
      .where(and(eq(emailTracking.userId, userId), eq(emailTracking.isRead, false)))
      .orderBy(desc(emailTracking.receivedAt));
  }

  async createEmailTracking(email: InsertEmailTracking): Promise<EmailTracking> {
    const [newEmail] = await db
      .insert(emailTracking)
      .values(email)
      .returning();
    return newEmail;
  }

  async updateEmailTracking(id: number, updates: Partial<InsertEmailTracking>): Promise<EmailTracking> {
    const [updatedEmail] = await db
      .update(emailTracking)
      .set(updates)
      .where(eq(emailTracking.id, id))
      .returning();
    return updatedEmail;
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(settings: InsertUserSettings & { userId: string }): Promise<UserSettings> {
    const [upsertedSettings] = await db
      .insert(userSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedSettings;
  }

  // Platform credentials operations
  async getPlatformCredentials(userId: string): Promise<PlatformCredentials[]> {
    return await db
      .select()
      .from(platformCredentials)
      .where(eq(platformCredentials.userId, userId))
      .orderBy(desc(platformCredentials.createdAt));
  }

  async createPlatformCredentials(credentials: InsertPlatformCredentials): Promise<PlatformCredentials> {
    const [newCredentials] = await db
      .insert(platformCredentials)
      .values(credentials)
      .returning();
    return newCredentials;
  }

  async updatePlatformCredentials(id: number, updates: Partial<InsertPlatformCredentials>): Promise<PlatformCredentials> {
    const [updatedCredentials] = await db
      .update(platformCredentials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(platformCredentials.id, id))
      .returning();
    return updatedCredentials;
  }

  async deletePlatformCredentials(id: number): Promise<void> {
    await db.delete(platformCredentials).where(eq(platformCredentials.id, id));
  }

  // Daily stats operations
  async getDailyStats(userId: string, date: string): Promise<DailyStats | undefined> {
    const [stats] = await db
      .select()
      .from(dailyStats)
      .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, date)));
    return stats;
  }

  async upsertDailyStats(stats: InsertDailyStats & { userId: string }): Promise<DailyStats> {
    const [upsertedStats] = await db
      .insert(dailyStats)
      .values(stats)
      .onConflictDoUpdate({
        target: [dailyStats.userId, dailyStats.date],
        set: stats,
      })
      .returning();
    return upsertedStats;
  }

  async getWeeklyStats(userId: string): Promise<DailyStats[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    return await db
      .select()
      .from(dailyStats)
      .where(and(
        eq(dailyStats.userId, userId),
        gte(dailyStats.date, weekAgo.toISOString().split('T')[0])
      ))
      .orderBy(desc(dailyStats.date));
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    todayApplications: number;
    totalApplications: number;
    responseRate: number;
    totalResponses: number;
    weeklyEarnings: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's applications
    const todayStats = await this.getDailyStats(userId, today);
    const todayApplications = todayStats?.applicationsCount || 0;
    
    // Get total applications
    const [totalAppsResult] = await db
      .select({ count: count() })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId));
    const totalApplications = totalAppsResult.count;
    
    // Get total responses
    const [totalResponsesResult] = await db
      .select({ count: count() })
      .from(jobApplications)
      .where(and(
        eq(jobApplications.userId, userId),
        sql`${jobApplications.status} != 'pending'`
      ));
    const totalResponses = totalResponsesResult.count;
    
    // Calculate response rate
    const responseRate = totalApplications > 0 ? Math.round((totalResponses / totalApplications) * 100) : 0;
    
    // Get weekly earnings
    const weeklyStats = await this.getWeeklyStats(userId);
    const weeklyEarnings = weeklyStats.reduce((sum, stat) => sum + Number(stat.earnings || 0), 0);
    
    return {
      todayApplications,
      totalApplications,
      responseRate,
      totalResponses,
      weeklyEarnings,
    };
  }
  
  // Contact operations
  async getContacts(userId: string): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteContact(id: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Resume template operations
  async getResumeTemplates(userId: string): Promise<ResumeTemplate[]> {
    return await db
      .select()
      .from(resumeTemplates)
      .where(eq(resumeTemplates.userId, userId))
      .orderBy(desc(resumeTemplates.createdAt));
  }

  async getResumeTemplate(id: number): Promise<ResumeTemplate | undefined> {
    const [template] = await db
      .select()
      .from(resumeTemplates)
      .where(eq(resumeTemplates.id, id));
    return template;
  }

  async createResumeTemplate(template: InsertResumeTemplate): Promise<ResumeTemplate> {
    const [newTemplate] = await db
      .insert(resumeTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateResumeTemplate(id: number, updates: Partial<InsertResumeTemplate>): Promise<ResumeTemplate> {
    const [updatedTemplate] = await db
      .update(resumeTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resumeTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteResumeTemplate(id: number): Promise<void> {
    await db.delete(resumeTemplates).where(eq(resumeTemplates.id, id));
  }

  // Email campaign operations
  async getEmailCampaigns(userId: string): Promise<EmailCampaign[]> {
    return await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.userId, userId))
      .orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db
      .insert(emailCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateEmailCampaign(id: number, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign> {
    const [updatedCampaign] = await db
      .update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteEmailCampaign(id: number): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }
}

export const storage = new DatabaseStorage();
