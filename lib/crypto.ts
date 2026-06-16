import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const DEFAULT_KEY = "hellopizzasecretkeyforposcloudsync"; // 32 bytes fallback key
const KEY = process.env.SMTP_PASS_ENCRYPTION_KEY 
  ? crypto.createHash('sha256').update(process.env.SMTP_PASS_ENCRYPTION_KEY).digest() 
  : crypto.createHash('sha256').update(DEFAULT_KEY).digest();

export function encryptPassword(text: string): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (e) {
    console.error("Encryption failed:", e);
    return text;
  }
}

export function decryptPassword(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText; // not encrypted or old format
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error("Decryption failed:", e);
    return encryptedText;
  }
}
