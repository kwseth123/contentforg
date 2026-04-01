import { KnowledgeBase } from './types';
import * as db from './db';

export const DEFAULT_KB: KnowledgeBase = {
  companyName: '', tagline: '', website: '', aboutUs: '',
  products: [], differentiators: '',
  icp: { industries: [], companySize: '', personas: [] },
  competitors: [],
  brandVoice: { tone: '', wordsToUse: [], wordsToAvoid: [] },
  caseStudies: [], uploadedDocuments: [], logoPath: '',
};

export async function getKnowledgeBase(): Promise<KnowledgeBase> {
  return db.getKnowledgeBase();
}

export async function saveKnowledgeBase(kb: KnowledgeBase): Promise<void> {
  return db.saveKnowledgeBase('default', kb);
}
