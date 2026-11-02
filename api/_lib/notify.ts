import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { env, features } from './env.js';

let transport: nodemailer.Transporter | null = null;

export async function sendEmail(to: string, subject: string, text: string, html: string) {
  if (!features.email()) throw new Error('Email sending is not configured');
  transport ??= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  await transport.sendMail({ from: `ApplyTrack <${env.emailFrom}>`, to, subject, text, html });
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Returns the endpoints that are gone (404/410) so the caller can delete them. */
export async function sendPush(targets: PushTarget[], payload: { title: string; body: string; url: string }) {
  if (!features.push()) throw new Error('Push notifications are not configured');
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
  const gone: string[] = [];
  let sent = 0;
  await Promise.all(
    targets.map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, JSON.stringify(payload), {
          TTL: 60 * 60 * 12,
        });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) gone.push(t.endpoint);
      }
    }),
  );
  return { sent, gone };
}
