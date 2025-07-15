import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface CampaignEmailData {
  to: string;
  from: string;
  subject: string;
  template: string;
  contactName?: string;
  contactCompany?: string;
}

export class EmailService {
  private static instance: EmailService;
  private isConfigured: boolean;

  private constructor() {
    this.isConfigured = !!SENDGRID_API_KEY;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  public async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('SendGrid not configured, email not sent');
      return false;
    }

    try {
      const msg = {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  public async sendCampaignEmail(campaignData: CampaignEmailData): Promise<boolean> {
    // Replace template variables
    let processedTemplate = campaignData.template;
    if (campaignData.contactName) {
      processedTemplate = processedTemplate.replace(/\[Name\]/g, campaignData.contactName);
    }
    if (campaignData.contactCompany) {
      processedTemplate = processedTemplate.replace(/\[Company\]/g, campaignData.contactCompany);
    }

    return this.sendEmail({
      to: campaignData.to,
      from: campaignData.from,
      subject: campaignData.subject,
      text: processedTemplate,
      html: processedTemplate.replace(/\n/g, '<br>'),
    });
  }

  public async sendBulkCampaign(
    campaignData: Omit<CampaignEmailData, 'to'>,
    recipients: Array<{ email: string; name?: string; company?: string }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const emailSent = await this.sendCampaignEmail({
        ...campaignData,
        to: recipient.email,
        contactName: recipient.name,
        contactCompany: recipient.company,
      });

      if (emailSent) {
        success++;
      } else {
        failed++;
      }

      // Add a small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { success, failed };
  }
}

export default EmailService.getInstance(); 