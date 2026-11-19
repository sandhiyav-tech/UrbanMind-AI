import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { User, Issue, SafeUser } from './types';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_FILE = path.join(os.tmpdir(), 'urbanmind_issues_cache.json');
const USERS_CACHE_FILE = path.join(os.tmpdir(), 'urbanmind_users_cache.json');

function readCachedIssues(): Issue[] {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {}
  return [];
}

function writeCachedIssues(issues: Issue[]) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(issues), 'utf-8');
  } catch {}
}

function readCachedUsers(): User[] {
  try {
    if (fs.existsSync(USERS_CACHE_FILE)) {
      const content = fs.readFileSync(USERS_CACHE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {}
  return [];
}

function writeCachedUsers(users: User[]) {
  try {
    fs.writeFileSync(USERS_CACHE_FILE, JSON.stringify(users), 'utf-8');
  } catch {}
}

// Pre-computed hash for 'Demo1234' with bcrypt cost 10
const DEMO_PASSWORD_HASH = '$2a$10$bwQXLBnIsv5q1Bb9FWTWeetIBpgYtb2Ayx2p8sPsaIARJCh9SnxyO';

const DEMO_USERS: User[] = [
  {
    id: 'user_demo_citizen_01',
    name: 'Ravi Kumar (Citizen)',
    email: 'citizen@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'citizen',
    created_at: new Date('2026-02-01T10:00:00Z').toISOString(),
  },
  {
    id: 'user_demo_official_01',
    name: 'Dr. S. K. Meenakshi (GCC Official)',
    email: 'official@demo.com',
    password_hash: DEMO_PASSWORD_HASH,
    role: 'authority',
    created_at: new Date('2026-02-01T09:00:00Z').toISOString(),
  },
  {
    id: 'user_sarvesh_official',
    name: 'Sarvesh (GCC Official)',
    email: 'sarvesh@chennai.gov.in',
    password_hash: '$2a$10$wRFVcXiXwgf4tBmejRZe/OaAdtreLMAKs8vNTZeOmogV5nD.ZEcc6',
    role: 'authority',
    created_at: new Date('2026-02-01T09:00:00Z').toISOString(),
  },
  {
    id: 'user_sandhu_official',
    name: 'Sandhu (GCC Official)',
    email: 'sandhu@chennai.gov.in',
    password_hash: '$2a$10$zGVcvKX6RbhfdcNlwJydyOYK5LMzKbPk08J76Jo6pAYazoDs5XPJC',
    role: 'authority',
    created_at: new Date('2026-02-01T09:00:00Z').toISOString(),
  },
];

const INITIAL_DEMO_ISSUES: Issue[] = [
  {
    id: 'issue_tnagar_01',
    user_id: 'user_demo_citizen_01',
    user_name: 'Ravi Kumar (Citizen)',
    zone: 't_nagar',
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    note: 'Severe crater pothole causing motorcycle skids near Usman Road intersection.',
    issue_type: 'road',
    severity: 4,
    confidence: 0.94,
    priority_score: 87.2,
    priority_breakdown: {
      severity_norm: 0.75, // (4-1)/4
      confidence: 0.94,
      zone_density_norm: 0.76,
      open_issue_count_norm: 0.8,
      raw_score: 87.2,
      formula: '0.5*(0.75) + 0.2*(0.94) + 0.2*(0.76) + 0.1*(0.80) = 87.2/100',
    },
    reasoning: 'Critical asphalt structural fracture in ultra-dense commercial zone. Risk of two-wheeler transit accidents is exceptionally high.',
    recommended_actions: [
      'Deploy immediate cold-mix asphalt patch within 4 hours',
      'Erect reflective barricade on lane 2',
      'Notify GCC Zone 10 engineering squad',
    ],
    needs_human_review: true,
    status: 'analyzed',
    specialist_findings: {
      gatekeeper: { valid: true, reason: 'Valid urban infrastructure road damage clearly visible' },
      road: { severity: 4, confidence: 0.95, evidence: 'Asphalt cavity measuring ~0.8m diameter, depth >70mm with exposed aggregate', findings: 'Severe pothole hazards' },
      waste: { severity: 1, confidence: 0.15, evidence: 'Minor gravel debris around edges', findings: 'No significant solid waste' },
      water: { severity: 2, confidence: 0.40, evidence: 'Damp subsurface indicating prior seepage', findings: 'No active flooding' },
    },
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'issue_velachery_02',
    user_id: 'user_demo_citizen_01',
    user_name: 'Ravi Kumar (Citizen)',
    zone: 'velachery',
    image_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    note: 'Massive stagnant water accumulation and storm drain backflow near MRTS station.',
    issue_type: 'water',
    severity: 5,
    confidence: 0.91,
    priority_score: 91.5,
    priority_breakdown: {
      severity_norm: 1.0,
      confidence: 0.91,
      zone_density_norm: 0.35,
      open_issue_count_norm: 0.9,
      raw_score: 91.5,
      formula: '0.5*(1.00) + 0.2*(0.91) + 0.2*(0.35) + 0.1*(0.90) = 91.5/100',
    },
    reasoning: 'Severe storm drain blockage causing 300m arterial inundation. Vector-borne disease risk and severe transit paralysis.',
    recommended_actions: [
      'Dispatch high-capacity dewatering diesel pump truck immediately',
      'Desilt culvert grill at MRTS south intake',
      'Issue traffic advisory for Velachery Bypass Road',
    ],
    needs_human_review: true,
    status: 'analyzed',
    specialist_findings: {
      gatekeeper: { valid: true, reason: 'Valid urban infrastructure drainage flooding visible' },
      road: { severity: 3, confidence: 0.65, evidence: 'Submerged road surface with potential sub-base erosion', findings: 'Waterlogged pavement' },
      waste: { severity: 3, confidence: 0.70, evidence: 'Floating single-use plastics choking stormwater grating', findings: 'Waste contributing to blockage' },
      water: { severity: 5, confidence: 0.96, evidence: 'Water depth ~25cm across 2 traffic lanes, active backflow', findings: 'Critical inundation' },
    },
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'issue_tondiarpet_03',
    user_id: null,
    user_name: 'Anonymous Citizen',
    zone: 'tondiarpet',
    image_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
    note: 'Commercial garbage pile overflowing into pedestrian walkway near market yard.',
    issue_type: 'waste',
    severity: 4,
    confidence: 0.88,
    priority_score: 86.4,
    priority_breakdown: {
      severity_norm: 0.75,
      confidence: 0.88,
      zone_density_norm: 1.0,
      open_issue_count_norm: 0.7,
      raw_score: 86.4,
      formula: '0.5*(0.75) + 0.2*(0.88) + 0.2*(1.00) + 0.1*(0.70) = 86.4/100',
    },
    reasoning: 'Massive solid waste accumulation in the highest density zone (27,800/km²). Health and sanitation hazard for adjacent food vendors.',
    recommended_actions: [
      'Dispatch compactor truck and sanitary response team',
      'Sanitize area with bleaching powder spray',
      'Audit neighboring commercial establishments for waste segregation compliance',
    ],
    needs_human_review: true,
    status: 'approved',
    decision_notes: 'Approved for urgent morning sanitation round. GCC Zone 4 supervisor assigned.',
    decided_by: 'official@demo.com',
    decided_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    specialist_findings: {
      gatekeeper: { valid: true, reason: 'Valid urban solid waste mismanagement' },
      road: { severity: 1, confidence: 0.2, evidence: 'Pavement obscured by refuse', findings: 'No direct road surface damage' },
      waste: { severity: 4, confidence: 0.94, evidence: 'Estimated ~3 metric tons of unsegregated organic and plastic refuse spilling over curbside', findings: 'Severe municipal waste spill' },
      water: { severity: 2, confidence: 0.35, evidence: 'Leachate pooling near curb line', findings: 'Leachate moisture' },
    },
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'issue_adyar_04',
    user_id: 'user_demo_citizen_01',
    user_name: 'Ravi Kumar (Citizen)',
    zone: 'adyar',
    image_url: 'https://images.unsplash.com/photo-1584467746872-95ffb137bc15?auto=format&fit=crop&w=800&q=80',
    note: 'Damaged water supply pipe spitting potable water onto pavement near Kasturibai Nagar.',
    issue_type: 'water',
    severity: 3,
    confidence: 0.85,
    priority_score: 64.2,
    priority_breakdown: {
      severity_norm: 0.50,
      confidence: 0.85,
      zone_density_norm: 0.18,
      open_issue_count_norm: 0.5,
      raw_score: 64.2,
      formula: '0.5*(0.50) + 0.2*(0.85) + 0.2*(0.18) + 0.1*(0.50) = 64.2/100',
    },
    reasoning: 'Underground CMWSSB distribution pipeline breach resulting in water loss and pavement soaking.',
    recommended_actions: [
      'Inform Chennai Metro Water (CMWSSB) Area 13 engineer',
      'Isolate segment valve to prevent supply loss',
      'Excavate and replace faulty coupling',
    ],
    needs_human_review: false,
    status: 'analyzed',
    specialist_findings: {
      gatekeeper: { valid: true, reason: 'Valid urban utility waterline leak' },
      road: { severity: 2, confidence: 0.5, evidence: 'Pavement erosion starting around leak point', findings: 'Minor road surface erosion' },
      waste: { severity: 1, confidence: 0.1, evidence: 'Clean potable water stream', findings: 'No waste involved' },
      water: { severity: 3, confidence: 0.92, evidence: 'Pressurized water jet from distribution valve joint', findings: 'Active pipe fracture' },
    },
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: 'issue_annanagar_05',
    user_id: null,
    user_name: 'Anonymous Citizen',
    zone: 'anna_nagar',
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    note: 'Large longitudinal fissure and asphalt cracking on 2nd Avenue bus route.',
    issue_type: 'road',
    severity: 3,
    confidence: 0.89,
    priority_score: 69.8,
    priority_breakdown: {
      severity_norm: 0.50,
      confidence: 0.89,
      zone_density_norm: 0.45,
      open_issue_count_norm: 0.6,
      raw_score: 69.8,
      formula: '0.5*(0.50) + 0.2*(0.89) + 0.2*(0.45) + 0.1*(0.60) = 69.8/100',
    },
    reasoning: 'Structural pavement failure likely triggered by heavy bus axle loads and subgrade settlement.',
    recommended_actions: [
      'Seal cracks with hot elastomeric bitumen to prevent water ingress',
      'Schedule structural deflection survey for 2nd Avenue',
    ],
    needs_human_review: false,
    status: 'approved',
    decision_notes: 'Approved for scheduled nighttime maintenance.',
    decided_by: 'official@demo.com',
    decided_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    specialist_findings: {
      gatekeeper: { valid: true, reason: 'Valid road infrastructure damage' },
      road: { severity: 3, confidence: 0.92, evidence: 'Longitudinal cracks extending >12m with alligator patterns', findings: 'Pavement fatigue' },
      waste: { severity: 1, confidence: 0.05, evidence: 'No waste present', findings: 'Clean street' },
      water: { severity: 1, confidence: 0.1, evidence: 'Dry surface', findings: 'No water damage yet' },
    },
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'issue_guindy_06',
    user_id: null,
    user_name: 'Anonymous Citizen',
    zone: 'guindy',
    image_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    note: 'Illegal construction debris dumped along industrial estate sidewalk.',
    issue_type: 'waste',
    severity: 3,
    confidence: 0.92,
    priority_score: 64.9,
    priority_breakdown: {
      severity_norm: 0.50,
      confidence: 0.92,
      zone_density_norm: 0.24,
      open_issue_count_norm: 0.4,
      raw_score: 64.9,
      formula: '0.5*(0.50) + 0.2*(0.92) + 0.2*(0.24) + 0.1*(0.40) = 64.9/100',
    },
    reasoning: 'Construction & Demolition (C&D) waste obstructing pedestrian path and narrowing roadway.',
    recommended_actions: [
      'Issue notice to adjacent industrial unit',
      'Send JCB loader and tipper truck for C&D waste collection',
    ],
    needs_human_review: false,
    status: 'analyzed',
    specialist_findings: {
      gatekeeper: { valid: true, reason: 'Valid municipal waste violation' },
      road: { severity: 2, confidence: 0.4, evidence: 'Curb stone displaced by debris', findings: 'Curb minor damage' },
      waste: { severity: 3, confidence: 0.95, evidence: 'Concrete rubble, broken tiles, and plaster sacks blocking sidewalk', findings: 'C&D debris dumping' },
      water: { severity: 1, confidence: 0.1, evidence: 'Dry debris', findings: 'No water issue' },
    },
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

// In-Memory Global Store (survives hot reload in dev)
interface GlobalStore {
  users: Map<string, User>;
  issues: Map<string, Issue>;
  initialized: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __urbanmind_store: GlobalStore | undefined;
}

function getStore(): GlobalStore {
  if (!globalThis.__urbanmind_store) {
    globalThis.__urbanmind_store = {
      users: new Map(),
      issues: new Map(),
      initialized: false,
    };
  }

  if (!globalThis.__urbanmind_store.initialized) {
    // Seed demo users
    DEMO_USERS.forEach((u) => {
      globalThis.__urbanmind_store!.users.set(u.email.toLowerCase(), { ...u });
    });

    // Seed demo issues
    INITIAL_DEMO_ISSUES.forEach((issue) => {
      globalThis.__urbanmind_store!.issues.set(issue.id, { ...issue });
    });

    // Re-hydrate any users cached in temporary storage across warm serverless requests
    const cachedUsers = readCachedUsers();
    cachedUsers.forEach((u) => {
      globalThis.__urbanmind_store!.users.set(u.email.toLowerCase(), { ...u });
    });

    // Re-hydrate any issues cached in temporary storage across warm serverless requests
    const cached = readCachedIssues();
    cached.forEach((issue) => {
      globalThis.__urbanmind_store!.issues.set(issue.id, { ...issue });
    });

    globalThis.__urbanmind_store.initialized = true;
  }

  return globalThis.__urbanmind_store;
}

// Database helper functions with fallback
let neonSql: NeonQueryFunction<false, false> | null = null;
let postgresInitialized = false;

function getPostgresClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === '') {
    return null;
  }
  if (!neonSql) {
    neonSql = neon(dbUrl);
  }
  return neonSql;
}

async function ensurePostgresTables(sql: NeonQueryFunction<false, false>) {
  if (postgresInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        zone TEXT NOT NULL,
        image_url TEXT NOT NULL,
        note TEXT,
        issue_type TEXT NOT NULL,
        severity INTEGER NOT NULL,
        confidence REAL NOT NULL,
        priority_score REAL NOT NULL,
        priority_breakdown JSONB NOT NULL,
        reasoning TEXT NOT NULL,
        recommended_actions JSONB NOT NULL,
        needs_human_review BOOLEAN NOT NULL,
        status TEXT NOT NULL,
        decision_notes TEXT,
        decided_by TEXT,
        decided_at TIMESTAMP WITH TIME ZONE,
        specialist_findings JSONB NOT NULL,
        is_demo BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Seed demo accounts idempotently into Postgres
    for (const demoUser of DEMO_USERS) {
      await sql`
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (${demoUser.id}, ${demoUser.name}, ${demoUser.email}, ${demoUser.password_hash}, ${demoUser.role}, ${demoUser.created_at})
        ON CONFLICT (email) DO NOTHING;
      `;
    }

    postgresInitialized = true;
  } catch (err) {
    console.warn('Neon Postgres schema initialization warning (will use in-memory store):', err);
  }
}

// User CRUD
export async function getUserByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  const sql = getPostgresClient();

  if (sql) {
    try {
      await ensurePostgresTables(sql);
      const rows = (await sql`SELECT * FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1;`) as any[];
      if (rows && rows.length > 0) {
        return rows[0] as User;
      }
    } catch (err) {
      console.warn('Postgres query error, falling back to memory store:', err);
    }
  }

  const store = getStore();
  const user = store.users.get(cleanEmail);
  return user ? { ...user } : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const sql = getPostgresClient();
  if (sql) {
    try {
      await ensurePostgresTables(sql);
      const rows = (await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1;`) as any[];
      if (rows && rows.length > 0) {
        return rows[0] as User;
      }
    } catch (err) {
      console.warn('Postgres query error, falling back to memory store:', err);
    }
  }

  const store = getStore();
  const allUsers = Array.from(store.users.values());
  for (const user of allUsers) {
    if (user.id === id) return { ...user };
  }
  return null;
}

export async function createUser(user: User): Promise<SafeUser> {
  const cleanEmail = user.email.trim().toLowerCase();
  const sql = getPostgresClient();

  if (sql) {
    try {
      await ensurePostgresTables(sql);
      await sql`
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (${user.id}, ${user.name}, ${cleanEmail}, ${user.password_hash}, ${user.role}, ${user.created_at});
      `;
    } catch (err) {
      console.warn('Postgres insert error, saving to memory store:', err);
    }
  }

  const store = getStore();
  store.users.set(cleanEmail, { ...user, email: cleanEmail });
  writeCachedUsers(Array.from(store.users.values()));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = user;
  return safe;
}

// Issue CRUD
export async function getAllIssues(): Promise<Issue[]> {
  const sql = getPostgresClient();
  if (sql) {
    try {
      await ensurePostgresTables(sql);
      const rows = (await sql`SELECT * FROM issues ORDER BY priority_score DESC, created_at DESC;`) as any[];
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          priority_breakdown: typeof r.priority_breakdown === 'string' ? JSON.parse(r.priority_breakdown) : r.priority_breakdown,
          recommended_actions: typeof r.recommended_actions === 'string' ? JSON.parse(r.recommended_actions) : r.recommended_actions,
          specialist_findings: typeof r.specialist_findings === 'string' ? JSON.parse(r.specialist_findings) : r.specialist_findings,
        })) as Issue[];
      }
    } catch (err) {
      console.warn('Postgres select issues error, using memory store:', err);
    }
  }

  const store = getStore();
  const issues = Array.from(store.issues.values());
  return issues.sort((a, b) => b.priority_score - a.priority_score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getIssuesByUserId(userId: string): Promise<Issue[]> {
  const sql = getPostgresClient();
  if (sql) {
    try {
      await ensurePostgresTables(sql);
      const rows = (await sql`SELECT * FROM issues WHERE user_id = ${userId} ORDER BY created_at DESC;`) as any[];
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          priority_breakdown: typeof r.priority_breakdown === 'string' ? JSON.parse(r.priority_breakdown) : r.priority_breakdown,
          recommended_actions: typeof r.recommended_actions === 'string' ? JSON.parse(r.recommended_actions) : r.recommended_actions,
          specialist_findings: typeof r.specialist_findings === 'string' ? JSON.parse(r.specialist_findings) : r.specialist_findings,
        })) as Issue[];
      }
    } catch (err) {
      console.warn('Postgres select user issues error, using memory store:', err);
    }
  }

  const store = getStore();
  return Array.from(store.issues.values())
    .filter((i) => i.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getIssueById(id: string): Promise<Issue | null> {
  const sql = getPostgresClient();
  if (sql) {
    try {
      await ensurePostgresTables(sql);
      const rows = (await sql`SELECT * FROM issues WHERE id = ${id} LIMIT 1;`) as any[];
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          priority_breakdown: typeof r.priority_breakdown === 'string' ? JSON.parse(r.priority_breakdown) : r.priority_breakdown,
          recommended_actions: typeof r.recommended_actions === 'string' ? JSON.parse(r.recommended_actions) : r.recommended_actions,
          specialist_findings: typeof r.specialist_findings === 'string' ? JSON.parse(r.specialist_findings) : r.specialist_findings,
        } as Issue;
      }
    } catch (err) {
      console.warn('Postgres get issue error, using memory store:', err);
    }
  }

  const store = getStore();
  const issue = store.issues.get(id);
  return issue ? { ...issue } : null;
}

export async function createIssue(issue: Issue): Promise<Issue> {
  const sql = getPostgresClient();
  if (sql) {
    try {
      await ensurePostgresTables(sql);
      await sql`
        INSERT INTO issues (
          id, user_id, user_name, zone, image_url, note, issue_type, severity,
          confidence, priority_score, priority_breakdown, reasoning, recommended_actions,
          needs_human_review, status, decision_notes, decided_by, decided_at, specialist_findings,
          is_demo, created_at
        ) VALUES (
          ${issue.id}, ${issue.user_id}, ${issue.user_name || null}, ${issue.zone}, ${issue.image_url},
          ${issue.note || null}, ${issue.issue_type}, ${issue.severity}, ${issue.confidence}, ${issue.priority_score},
          ${JSON.stringify(issue.priority_breakdown)}, ${issue.reasoning}, ${JSON.stringify(issue.recommended_actions)},
          ${issue.needs_human_review}, ${issue.status}, ${issue.decision_notes || null}, ${issue.decided_by || null},
          ${issue.decided_at || null}, ${JSON.stringify(issue.specialist_findings)}, ${issue.is_demo ?? false}, ${issue.created_at}
        );
      `;
    } catch (err) {
      console.warn('Postgres insert issue error, saving to memory store:', err);
    }
  }

  const store = getStore();
  store.issues.set(issue.id, { ...issue });
  writeCachedIssues(Array.from(store.issues.values()));
  return issue;
}

export async function updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | null> {
  const existing = await getIssueById(id);
  if (!existing) return null;

  const merged: Issue = { ...existing, ...updates };

  const sql = getPostgresClient();
  if (sql) {
    try {
      await ensurePostgresTables(sql);
      await sql`
        UPDATE issues SET
          status = ${merged.status},
          decision_notes = ${merged.decision_notes || null},
          decided_by = ${merged.decided_by || null},
          decided_at = ${merged.decided_at || null},
          severity = ${merged.severity},
          recommended_actions = ${JSON.stringify(merged.recommended_actions)}
        WHERE id = ${id};
      `;
    } catch (err) {
      console.warn('Postgres update issue error, saving to memory store:', err);
    }
  }

  const store = getStore();
  store.issues.set(id, merged);
  writeCachedIssues(Array.from(store.issues.values()));
  return merged;
}

export function isUsingPostgres(): boolean {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';
}
