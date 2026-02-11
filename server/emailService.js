/**
 * Email sending for verification and password reset.
 * Set SMTP in .env (e.g. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) or links are logged to console.
 */
require('dotenv').config();
const crypto = require('crypto');

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

function getSMTPConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@ecoshift.local'
  };
}

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const config = getSMTPConfig();

  // 1. Try Custom SMTP (e.g. SendGrid, Gmail)
  if (config.host && config.user && config.pass) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      auth: { user: config.user, pass: config.pass }
    });
    console.log(`[Email] Configured Custom SMTP (${config.host})`);
    return transporter;
  }

  // 2. Fallback to Ethereal (Free Test Account)
  try {
    const nodemailer = require('nodemailer');
    console.log('[Email] No SMTP credentials in .env. Attempting to create Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`[Email] Created Ethereal Account: ${testAccount.user}`);
    console.log(`[Email] View emails at: https://ethereal.email/messages`);
    return transporter;
  } catch (err) {
    console.error('[Email] Failed to create Ethereal account:', err.message);
  }

  return null; // Fallback to file logging
}

async function verifyConnection() {
  const trans = await getTransporter();
  if (trans) {
    try {
      await trans.verify();
      console.log('[Email] SMTP Connection Verified ✅');
      return true;
    } catch (error) {
      console.error('[Email] SMTP Connection Failed ❌:', error.message);
      return false;
    }
  } else {
    console.log('[Email] utilizing File Logging Mode (No SMTP/Ethereal) ⚠️');
    return false;
  }
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendMail(options) {
  const trans = await getTransporter();
  const config = getSMTPConfig();
  if (trans) {
    const info = await trans.sendMail({
      from: config.from,
      ...options
    });

    // If using Ethereal, log the preview URL
    const nodemailer = require('nodemailer');
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Preview URL: ${previewUrl}`);
    }
    return info;
  }
  // No SMTP: log for development
  console.log('[Email (no SMTP)]', options.subject);
  console.log('To:', options.to);
  console.log('Body:', options.text || options.html);
  console.log('---');

  // Append to email_logs.txt for verified testing
  const fs = require('fs');
  const path = require('path');
  const logPath = path.resolve(__dirname, '..', 'email_logs.txt');
  const logEntry = `\n--- EMAIL ---\nTo: ${options.to}\nSubject: ${options.subject}\nBody: ${options.text || options.html}\n---\n`;
  fs.appendFileSync(logPath, logEntry);
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${FRONTEND_URL}#verify-email?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: email,
    subject: 'EcoShift Hub - Verifica la tua email',
    text: `Clicca sul link per verificare la tua email: ${verifyUrl}\n\nIl link scade tra 24 ore.`,
    html: `<p>Clicca sul link per verificare la tua email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Il link scade tra 24 ore.</p>`
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${FRONTEND_URL}#reset-password?token=${encodeURIComponent(token)}`;
  await sendMail({
    to: email,
    subject: 'EcoShift Hub - Reimposta la password',
    text: `Per reimpostare la password clicca qui: ${resetUrl}\n\nIl link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email.`,
    html: `<p>Per reimpostare la password clicca sul link:</p><p><a href="${resetUrl}">Reimposta password</a></p><p>Il link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email.</p>`
  });
}

module.exports = {
  generateToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifyConnection,
  sendMail,
  FRONTEND_URL
};
