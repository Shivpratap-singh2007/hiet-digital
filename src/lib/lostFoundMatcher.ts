// HIET Digital Campus - Intelligent Lost & Found Matching Engine
// Compares reported lost belongings with catalogued found items
// Generates algorithmic confidence score, match rationale and institutional verification disclaimers

import { LostFoundItem, LostFoundMatchSuggestion } from '../types';

// Stop words to filter out when tokenizing descriptions and titles
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 
  'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 
  'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'near', 'floor', 'room'
]);

/**
 * Extracts normalized tokens from text strings
 */
export function extractKeywords(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Normalizes campus location names to find common physical landmarks
 * e.g., "LH-201 (Block B, 2nd Floor)" and "Block B Lecture Hall 201" both share "block b" and "201"
 */
export function normalizeLocationTokens(loc?: string): string[] {
  if (!loc) return [];
  const words = loc.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const landmarks: string[] = [];
  
  if (loc.toLowerCase().includes('block a')) landmarks.push('block a');
  if (loc.toLowerCase().includes('block b')) landmarks.push('block b');
  if (loc.toLowerCase().includes('block c')) landmarks.push('block c');
  if (loc.toLowerCase().includes('library')) landmarks.push('library');
  if (loc.toLowerCase().includes('canteen')) landmarks.push('canteen');
  if (loc.toLowerCase().includes('sports') || loc.toLowerCase().includes('ground')) landmarks.push('sports ground');
  if (loc.toLowerCase().includes('drawing') || loc.toLowerCase().includes('workshop')) landmarks.push('workshop');
  if (loc.toLowerCase().includes('lab')) landmarks.push('lab');

  // Also include room numbers or specific tokens like "201", "lh-201"
  words.forEach(w => {
    if (/\d+/.test(w) || w.length > 3) {
      landmarks.push(w);
    }
  });

  return Array.from(new Set(landmarks));
}

/**
 * Computes match score and rationale between one Lost item and one Found item
 */
export function calculateItemMatch(
  lostItem: LostFoundItem, 
  foundItem: LostFoundItem
): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // 1. Category Alignment (Max 35 points)
  if (lostItem.category === foundItem.category) {
    score += 35;
    factors.push(`Matching category: ${lostItem.category}`);
  } else if (
    (lostItem.category === 'Documents' && foundItem.category === 'Documents/ID') ||
    (lostItem.category === 'Documents/ID' && foundItem.category === 'Documents')
  ) {
    score += 32;
    factors.push('Matching document & identity card category');
  } else {
    // Differing categories receive a heavy discount unless keywords match strongly
    score -= 10;
  }

  // 2. Keyword & Text Similarity (Max 30 points)
  const lostTokens = new Set([
    ...extractKeywords(lostItem.title),
    ...extractKeywords(lostItem.description),
    ...extractKeywords(lostItem.identifying_characteristics)
  ]);
  const foundTokens = new Set([
    ...extractKeywords(foundItem.title),
    ...extractKeywords(foundItem.description),
    ...extractKeywords(foundItem.identifying_characteristics)
  ]);

  const sharedTokens: string[] = [];
  lostTokens.forEach(token => {
    if (foundTokens.has(token)) {
      sharedTokens.push(token);
    }
  });

  if (sharedTokens.length > 0) {
    // 8 points per shared relevant keyword up to 30 points
    const keywordPoints = Math.min(30, sharedTokens.length * 8);
    score += keywordPoints;
    factors.push(`Shared descriptive terms: ${sharedTokens.slice(0, 4).join(', ')}`);
  }

  // 3. Location Proximity (Max 20 points)
  const lostLocs = normalizeLocationTokens(lostItem.location || lostItem.found_location);
  const foundLocs = normalizeLocationTokens(foundItem.location || foundItem.found_location);
  
  const sharedLocs = lostLocs.filter(l => foundLocs.includes(l));
  if (sharedLocs.length > 0) {
    score += 20;
    factors.push(`Compatible campus location: ${sharedLocs.slice(0, 2).join(' / ')}`);
  }

  // 4. Date Chronology and Proximity (Max 15 points)
  const lostDateStr = lostItem.item_date || lostItem.found_date || lostItem.created_at?.slice(0, 10);
  const foundDateStr = foundItem.item_date || foundItem.found_date || foundItem.created_at?.slice(0, 10);

  if (lostDateStr && foundDateStr) {
    const lostTime = new Date(lostDateStr).getTime();
    const foundTime = new Date(foundDateStr).getTime();
    const diffDays = Math.round((foundTime - lostTime) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      score += 15;
      factors.push(diffDays === 0 ? 'Found on the same calendar day' : `Found ${diffDays} day(s) after loss was reported`);
    } else if (diffDays > 3 && diffDays <= 10) {
      score += 10;
      factors.push(`Reported timeline within ${diffDays} days`);
    } else if (diffDays < 0 && Math.abs(diffDays) <= 1) {
      // Possible reporting delay or midnight discrepancy
      score += 5;
      factors.push('Close date proximity (within 24 hours)');
    } else if (diffDays < -1) {
      // Found long before lost date is improbable
      score -= 15;
    }
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  return { score: normalizedScore, factors };
}

/**
 * Finds potential matches for a target report (whether it is a lost report or found report)
 */
export function findPotentialMatches(
  targetItem: LostFoundItem,
  allItems: LostFoundItem[],
  minThreshold: number = 40
): LostFoundMatchSuggestion[] {
  // If target is a lost report, compare against found reports
  // If target is a found report, compare against lost reports
  const isTargetLost = targetItem.report_type === 'lost';
  const candidates = allItems.filter(item => {
    if (item.id === targetItem.id) return false;
    // Don't match with closed or verified returned items
    if (item.status === 'Closed' || item.status === 'Resolved' || item.status === 'Returned_to_Owner' || item.status === 'Verified_Claimed') {
      return false;
    }
    return isTargetLost ? item.report_type === 'found' : item.report_type === 'lost';
  });

  const suggestions: LostFoundMatchSuggestion[] = [];

  for (const candidate of candidates) {
    const lost = isTargetLost ? targetItem : candidate;
    const found = isTargetLost ? candidate : targetItem;

    const { score, factors } = calculateItemMatch(lost, found);

    if (score >= minThreshold) {
      suggestions.push({
        lostItem: lost,
        foundItem: found,
        matchScore: score,
        matchingFactors: factors
      });
    }
  }

  // Sort by highest confidence match
  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Finds all match suggestions relevant to reports filed by a specific user
 */
export function findUserReportMatches(
  userRollOrId: string,
  allItems: LostFoundItem[]
): LostFoundMatchSuggestion[] {
  const userItems = allItems.filter(
    i => i.reporter_id === userRollOrId || i.reporter_roll_or_emp === userRollOrId
  );

  const allSuggestions: LostFoundMatchSuggestion[] = [];
  const seenPairKeys = new Set<string>();

  for (const item of userItems) {
    const matches = findPotentialMatches(item, allItems);
    for (const m of matches) {
      const pairKey = `${m.lostItem.id}-${m.foundItem.id}`;
      if (!seenPairKeys.has(pairKey)) {
        seenPairKeys.add(pairKey);
        allSuggestions.push(m);
      }
    }
  }

  return allSuggestions.sort((a, b) => b.matchScore - a.matchScore);
}
