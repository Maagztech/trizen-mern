import * as brevo from '@getbrevo/brevo';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getBrevoClient(): brevo.TransactionalEmailsApi | null {
  if (!env.brevo.apiKey) {
    logger.warn('Brevo API key not configured, emails will be skipped');
    return null;
  }
  if (!apiInstance) {
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, env.brevo.apiKey);
  }
  return apiInstance;
}

function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px;border-radius:8px 8px 0 0;">
    <h1 style="color:white;margin:0;font-size:24px;">Service Provider Portal</h1>
  </div>
  <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    ${content}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="color:#6b7280;font-size:12px;">This is an automated message. Please do not reply.</p>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const client = getBrevoClient();
  if (!client) return;

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { email: env.brevo.senderEmail, name: env.brevo.senderName };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    await client.sendTransacEmail(sendSmtpEmail);
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
  }
}

export const emailService = {
  async sendRegistrationEmail(name: string, email: string): Promise<void> {
    const content = `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been created successfully. Complete your profile to start the onboarding process.</p>
      <a href="${env.clientUrl}/provider/dashboard" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;">Go to Dashboard</a>
    `;
    await sendEmail(email, 'Welcome to Service Provider Portal', baseTemplate('Welcome', content));
  },

  async sendApplicationSubmitted(name: string, email: string): Promise<void> {
    const content = `
      <h2>Application Submitted</h2>
      <p>Hi ${name}, your application has been submitted successfully and is pending review.</p>
      <p><strong>Status:</strong> Submitted</p>
      <a href="${env.clientUrl}/provider/dashboard" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">View Dashboard</a>
    `;
    await sendEmail(email, 'Application Submitted', baseTemplate('Application Submitted', content));
  },

  async sendUnderReview(name: string, email: string): Promise<void> {
    const content = `
      <h2>Application Under Review</h2>
      <p>Hi ${name}, your application is now being reviewed by our team.</p>
      <p><strong>Status:</strong> Under Review</p>
      <a href="${env.clientUrl}/provider/dashboard" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">View Dashboard</a>
    `;
    await sendEmail(email, 'Application Under Review', baseTemplate('Under Review', content));
  },

  async sendApproved(name: string, email: string): Promise<void> {
    const content = `
      <h2>Congratulations! 🎉</h2>
      <p>Hi ${name}, your application has been approved. You are now a verified service provider.</p>
      <p><strong>Status:</strong> Approved</p>
      <a href="${env.clientUrl}/provider/dashboard" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">View Dashboard</a>
    `;
    await sendEmail(email, 'Application Approved', baseTemplate('Approved', content));
  },

  async sendRejected(name: string, email: string, remarks: string): Promise<void> {
    const content = `
      <h2>Application Rejected</h2>
      <p>Hi ${name}, unfortunately your application was rejected.</p>
      <p><strong>Reason:</strong> ${remarks}</p>
      <p>Please update your profile and resubmit your application.</p>
      <a href="${env.clientUrl}/provider/profile" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Edit Application</a>
    `;
    await sendEmail(email, 'Application Rejected', baseTemplate('Rejected', content));
  },

  async sendResubmitted(name: string, email: string): Promise<void> {
    const content = `
      <h2>Application Resubmitted</h2>
      <p>Hi ${name}, your application has been resubmitted and is pending review.</p>
      <a href="${env.clientUrl}/provider/dashboard" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">View Dashboard</a>
    `;
    await sendEmail(email, 'Application Resubmitted', baseTemplate('Resubmitted', content));
  },

  async notifyAdminNewApplication(providerName: string, adminEmail: string): Promise<void> {
    const content = `
      <h2>New Application Received</h2>
      <p>Provider <strong>${providerName}</strong> has submitted a new application for review.</p>
      <a href="${env.clientUrl}/admin/providers" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Review Applications</a>
    `;
    await sendEmail(adminEmail, 'New Provider Application', baseTemplate('New Application', content));
  },
};
