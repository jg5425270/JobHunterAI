import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertJobApplicationSchema, 
  insertEmailTrackingSchema, 
  insertUserSettingsSchema,
  insertPlatformCredentialsSchema,
  insertDailyStatsSchema,
  insertContactSchema,
  insertResumeTemplateSchema,
  insertEmailCampaignSchema
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Job applications routes
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getJobApplications(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getJobApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertJobApplicationSchema.parse(req.body);
      const application = await storage.createJobApplication({
        ...validatedData,
        userId,
      });
      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.put('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertJobApplicationSchema.partial().parse(req.body);
      const application = await storage.updateJobApplication(id, validatedData);
      res.json(application);
    } catch (error) {
      console.error("Error updating application:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  app.delete('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteJobApplication(id);
      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Email tracking routes
  app.get('/api/emails/job/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const emails = await storage.getEmailsForJob(jobId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.get('/api/emails/unread', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getUnreadEmails(userId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching unread emails:", error);
      res.status(500).json({ message: "Failed to fetch unread emails" });
    }
  });

  app.post('/api/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmailTrackingSchema.parse(req.body);
      const email = await storage.createEmailTracking({
        ...validatedData,
        userId,
      });
      res.json(email);
    } catch (error) {
      console.error("Error creating email tracking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email tracking" });
    }
  });

  app.put('/api/emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEmailTrackingSchema.partial().parse(req.body);
      const email = await storage.updateEmailTracking(id, validatedData);
      res.json(email);
    } catch (error) {
      console.error("Error updating email:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  // User settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertUserSettingsSchema.parse(req.body);
      const settings = await storage.upsertUserSettings({
        ...validatedData,
        userId,
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Platform credentials routes
  app.get('/api/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credentials = await storage.getPlatformCredentials(userId);
      // Don't return encrypted credentials in response
      const safeCredentials = credentials.map(cred => ({
        ...cred,
        encryptedCredentials: undefined,
      }));
      res.json(safeCredentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.post('/api/credentials', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platform, credentials } = req.body;
      
      if (!platform || !credentials) {
        return res.status(400).json({ message: "Platform and credentials are required" });
      }

      const encryptedCredentials = encrypt(JSON.stringify(credentials));
      
      const newCredentials = await storage.createPlatformCredentials({
        userId,
        platform,
        encryptedCredentials,
      });

      res.json({ ...newCredentials, encryptedCredentials: undefined });
    } catch (error) {
      console.error("Error creating credentials:", error);
      res.status(500).json({ message: "Failed to create credentials" });
    }
  });

  app.delete('/api/credentials/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlatformCredentials(id);
      res.json({ message: "Credentials deleted successfully" });
    } catch (error) {
      console.error("Error deleting credentials:", error);
      res.status(500).json({ message: "Failed to delete credentials" });
    }
  });

  // Daily stats routes
  app.get('/api/stats/daily/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.params.date;
      const stats = await storage.getDailyStats(userId, date);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get('/api/stats/weekly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getWeeklyStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.post('/api/stats/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDailyStatsSchema.parse(req.body);
      const stats = await storage.upsertDailyStats({
        ...validatedData,
        userId,
      });
      res.json(stats);
    } catch (error) {
      console.error("Error updating daily stats:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update daily stats" });
    }
  });

  // Export functionality
  app.get('/api/export/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getJobApplications(userId);
      
      const format = req.query.format || 'json';
      
      if (format === 'csv') {
        const csvHeaders = ['Title', 'Company', 'Platform', 'Status', 'Applied Date', 'Pay Rate', 'URL'];
        const csvRows = applications.map(app => [
          app.title,
          app.company,
          app.platform,
          app.status,
          app.appliedAt?.toISOString().split('T')[0] || '',
          app.payRate || '',
          app.url || ''
        ]);
        
        const csv = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="job_applications.csv"');
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="job_applications.json"');
        res.json(applications);
      }
    } catch (error) {
      console.error("Error exporting applications:", error);
      res.status(500).json({ message: "Failed to export applications" });
    }
  });

  // Contact routes
  app.get('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact({
        ...validatedData,
        userId,
      });
      res.json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put('/api/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContact(id);
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Resume template routes
  app.get('/api/resume-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getResumeTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching resume templates:", error);
      res.status(500).json({ message: "Failed to fetch resume templates" });
    }
  });

  app.post('/api/resume-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertResumeTemplateSchema.parse(req.body);
      const template = await storage.createResumeTemplate({
        ...validatedData,
        userId,
      });
      res.json(template);
    } catch (error) {
      console.error("Error creating resume template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create resume template" });
    }
  });

  app.put('/api/resume-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertResumeTemplateSchema.partial().parse(req.body);
      const template = await storage.updateResumeTemplate(id, validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error updating resume template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update resume template" });
    }
  });

  app.delete('/api/resume-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteResumeTemplate(id);
      res.json({ message: "Resume template deleted successfully" });
    } catch (error) {
      console.error("Error deleting resume template:", error);
      res.status(500).json({ message: "Failed to delete resume template" });
    }
  });

  // Email campaign routes
  app.get('/api/email-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getEmailCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ message: "Failed to fetch email campaigns" });
    }
  });

  app.post('/api/email-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign({
        ...validatedData,
        userId,
      });
      res.json(campaign);
    } catch (error) {
      console.error("Error creating email campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create email campaign" });
    }
  });

  // Send email campaign
  app.post('/api/email-campaigns/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getEmailCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Get contacts for this campaign
      const contacts = await Promise.all(
        (campaign.contactIds || []).map(contactId => storage.getContact(contactId))
      );
      
      const validContacts = contacts.filter(contact => contact !== undefined);
      
      if (validContacts.length === 0) {
        return res.status(400).json({ message: "No valid contacts found for this campaign" });
      }

      // Import email service
      const emailService = (await import('./emailService.js')).default;
      
      // Get user settings for sender email
      const userSettings = await storage.getUserSettings(req.user.claims.sub);
      const senderEmail = userSettings?.emailSignature?.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || 'noreply@jobflow.com';
      
      // Send emails
      const result = await emailService.sendBulkCampaign(
        {
          from: senderEmail,
          subject: campaign.subject,
          template: campaign.template,
        },
        validContacts.map(contact => ({
          email: contact!.email,
          name: contact!.name,
          company: contact!.company,
        }))
      );

      // Update campaign status
      await storage.updateEmailCampaign(id, { 
        status: 'sent',
        sentCount: result.success,
        responseCount: 0, // Will be updated when responses come in
      });

      res.json({ 
        message: "Email campaign sent successfully",
        sent: result.success,
        failed: result.failed,
        total: validContacts.length
      });
    } catch (error) {
      console.error("Error sending email campaign:", error);
      res.status(500).json({ message: "Failed to send email campaign" });
    }
  });

  // Auto-apply toggle
  app.post('/api/auto-apply/toggle', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { enabled } = req.body;
      
      await storage.upsertUserSettings({
        userId,
        autoApplyEnabled: enabled,
      });

      res.json({ message: `Auto-apply ${enabled ? 'enabled' : 'disabled'} successfully` });
    } catch (error) {
      console.error("Error toggling auto-apply:", error);
      res.status(500).json({ message: "Failed to toggle auto-apply" });
    }
  });

  // Auto-apply job search (simulated)
  app.get('/api/auto-apply/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      
      if (!settings?.autoApplyEnabled) {
        return res.status(400).json({ message: "Auto-apply is not enabled" });
      }

      // Simulate job search results based on user settings
      const simulatedJobs = [
        {
          id: 1,
          title: "React Developer",
          company: "TechCorp",
          payRate: 75,
          location: "Remote",
          description: "We need a React developer for our web application",
          requirements: ["React", "JavaScript", "Node.js"],
          isInterviewFree: true,
          matchScore: 85
        },
        {
          id: 2,
          title: "Full Stack Developer",
          company: "StartupXYZ",
          payRate: 60,
          location: "Remote",
          description: "Looking for a full-stack developer to join our team",
          requirements: ["JavaScript", "TypeScript", "PostgreSQL"],
          isInterviewFree: false,
          matchScore: 70
        }
      ];

      // Filter jobs based on user settings
      const filteredJobs = simulatedJobs.filter(job => {
        if (settings.interviewFreeOnly && !job.isInterviewFree) return false;
        if (job.payRate < (settings.minPayRate || 0)) return false;
        return true;
      });

      res.json(filteredJobs);
    } catch (error) {
      console.error("Error searching jobs:", error);
      res.status(500).json({ message: "Failed to search jobs" });
    }
  });

  // Auto-apply to job (simulated)
  app.post('/api/auto-apply/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { jobId, title, company, payRate, url } = req.body;
      
      // Create a new job application
      const application = await storage.createJobApplication({
        userId,
        title,
        company,
        platform: "Upwork",
        status: "pending",
        payRate,
        url: url || `https://upwork.com/job/${jobId}`,
        location: "Remote",
        description: "Auto-applied via JobFlow system",
        appliedAt: new Date(),
      });

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const stats = await storage.getDailyStats(userId, today);
      await storage.upsertDailyStats({
        userId,
        date: today,
        applicationsCount: (stats?.applicationsCount || 0) + 1,
        target: 7,
      });

      res.json({ 
        message: "Application submitted successfully",
        application 
      });
    } catch (error) {
      console.error("Error applying to job:", error);
      res.status(500).json({ message: "Failed to apply to job" });
    }
  });

  // Get today's stats
  app.get('/api/stats/today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const today = new Date().toISOString().split('T')[0];
      
      const stats = await storage.getDailyStats(userId, today);
      const dashboardStats = await storage.getDashboardStats(userId);
      
      res.json({
        applicationsCount: stats?.applicationsCount || 0,
        responseRate: dashboardStats.responseRate,
        totalResponses: dashboardStats.totalResponses,
        target: stats?.target || 7,
      });
    } catch (error) {
      console.error("Error fetching today's stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
