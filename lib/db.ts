import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

export type User = {
  id: string; // Internal User ID
  email: string;
  currentChallenge?: string;
  webAuthnUserID: string; // Base64URL string for webauthn
};

export type Passkey = {
  // SQL: Encode to base64url then store as `TEXT`. Index this column
  id: string; // Identical to credentialID
  userId: string;
  // SQL: Encode to base64url then store as `TEXT`
  credentialID: string;
  // SQL: Encode to base64url then store as `TEXT`
  publicKey: string;
  // SQL: Store as `INT`
  counter: number;
  // SQL: Store as `VARCHAR(32)`
  deviceType: 'singleDevice' | 'multiDevice';
  // SQL: Store as `BOOL`
  backedUp: boolean;
  // SQL: Store as `VARCHAR(255)` and comma-separated-values
  transports?: string[];
};

export type OTP = {
  email: string;
  code: string;
  expiresAt: number;
};

type DbSchema = {
  users: User[];
  passkeys: Passkey[];
  otps: OTP[];
};

function readDB(): DbSchema {
  if (!fs.existsSync(DB_PATH)) {
    const defaultData: DbSchema = { users: [], passkeys: [], otps: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DbSchema;
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: [], passkeys: [], otps: [] };
  }
}

function writeDB(data: DbSchema) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// User methods
export function getUserByEmail(email: string): User | undefined {
  const db = readDB();
  return db.users.find((u) => u.email === email);
}

export function getUserById(id: string): User | undefined {
  const db = readDB();
  return db.users.find((u) => u.id === id);
}

export function createUser(email: string): User {
  const db = readDB();
  if (db.users.find(u => u.email === email)) {
    throw new Error('User already exists');
  }
  const newUser: User = {
    id: crypto.randomUUID(),
    email,
    webAuthnUserID: Buffer.from(crypto.randomUUID()).toString('base64url'),
  };
  db.users.push(newUser);
  writeDB(db);
  return newUser;
}

export function updateUserChallenge(userId: string, challenge: string | undefined) {
  const db = readDB();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.currentChallenge = challenge;
    writeDB(db);
  }
}

// Passkey methods
export function getUserPasskeys(userId: string): Passkey[] {
  const db = readDB();
  return db.passkeys.filter((p) => p.userId === userId);
}

export function getPasskeyById(id: string): Passkey | undefined {
  const db = readDB();
  return db.passkeys.find((p) => p.id === id);
}

export function savePasskey(passkey: Passkey) {
  const db = readDB();
  db.passkeys.push(passkey);
  writeDB(db);
}

export function updatePasskeyCounter(passkeyId: string, counter: number) {
  const db = readDB();
  const passkey = db.passkeys.find((p) => p.id === passkeyId);
  if (passkey) {
    passkey.counter = counter;
    writeDB(db);
  }
}

// OTP methods
export function saveOTP(email: string, code: string, expirationMs: number) {
  const db = readDB();
  // Clear any existing OTP for this email
  db.otps = db.otps.filter(o => o.email !== email);
  
  db.otps.push({
    email,
    code,
    expiresAt: Date.now() + expirationMs,
  });
  writeDB(db);
}

export function verifyOTP(email: string, code: string): boolean {
  const db = readDB();
  const otpIndex = db.otps.findIndex((o) => o.email === email && o.code === code);
  
  if (otpIndex === -1) return false;
  
  const otp = db.otps[otpIndex];
  // Remove the OTP whether successful or not (prevent replay)
  db.otps.splice(otpIndex, 1);
  writeDB(db);

  if (Date.now() > otp.expiresAt) {
    return false; // Expired
  }

  return true;
}
