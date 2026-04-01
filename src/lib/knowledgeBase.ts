import fs from 'fs';
import path from 'path';
import { KnowledgeBase } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const KB_FILE = path.join(DATA_DIR, 'knowledge-base.json');

const DEFAULT_KB: KnowledgeBase = {
  companyName: '',
  tagline: '',
  website: '',
  aboutUs: '',
  products: [],
  differentiators: '',
  icp: {
    industries: [],
    companySize: '',
    personas: [],
  },
  competitors: [],
  brandVoice: {
    tone: '',
    wordsToUse: [],
    wordsToAvoid: [],
  },
  caseStudies: [],
  uploadedDocuments: [],
  logoPath: '',
};

export function getKnowledgeBase(): KnowledgeBase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(KB_FILE)) {
    fs.writeFileSync(KB_FILE, JSON.stringify(DEFAULT_KB, null, 2));
    return { ...DEFAULT_KB };
  }
  const raw = fs.readFileSync(KB_FILE, 'utf-8');
  return JSON.parse(raw);
}

export function saveKnowledgeBase(kb: KnowledgeBase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(KB_FILE, JSON.stringify(kb, null, 2));
}
