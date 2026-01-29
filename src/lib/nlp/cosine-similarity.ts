import { tokenize, removeStopWords } from '@/lib/parser/text-normalizer';

export function computeCosineSimilarity(text1: string, text2: string): number {
  const tokens1 = removeStopWords(tokenize(text1));
  const tokens2 = removeStopWords(tokenize(text2));

  const vec1 = createTfIdfVector(tokens1, [tokens1, tokens2]);
  const vec2 = createTfIdfVector(tokens2, [tokens1, tokens2]);

  return cosineSimilarity(vec1, vec2);
}

function createTfIdfVector(
  tokens: string[],
  allDocuments: string[][]
): Map<string, number> {
  const tf = computeTf(tokens);
  const idf = computeIdf(tokens, allDocuments);

  const tfidf = new Map<string, number>();

  for (const [term, tfValue] of tf) {
    const idfValue = idf.get(term) || 0;
    tfidf.set(term, tfValue * idfValue);
  }

  return tfidf;
}

function computeTf(tokens: string[]): Map<string, number> {
  const termFrequency = new Map<string, number>();

  for (const token of tokens) {
    termFrequency.set(token, (termFrequency.get(token) || 0) + 1);
  }

  const maxFreq = Math.max(...termFrequency.values(), 1);

  for (const [term, freq] of termFrequency) {
    termFrequency.set(term, freq / maxFreq);
  }

  return termFrequency;
}

function computeIdf(tokens: string[], allDocuments: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const uniqueTerms = new Set(tokens);
  const numDocs = allDocuments.length;

  for (const term of uniqueTerms) {
    let docsWithTerm = 0;

    for (const doc of allDocuments) {
      if (doc.includes(term)) {
        docsWithTerm++;
      }
    }

    const idfValue = Math.log((numDocs + 1) / (docsWithTerm + 1)) + 1;
    idf.set(term, idfValue);
  }

  return idf;
}

function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const term of allTerms) {
    const v1 = vec1.get(term) || 0;
    const v2 = vec2.get(term) || 0;

    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

export function computeJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}

export function computeOverlapCoefficient(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const minSize = Math.min(set1.size, set2.size);

  if (minSize === 0) {
    return 0;
  }

  return intersection.size / minSize;
}

export function computeWeightedSimilarity(
  resumeText: string,
  jobDescriptionText: string,
  resumeKeywords: string[],
  jobKeywords: string[]
): number {
  const cosineSim = computeCosineSimilarity(resumeText, jobDescriptionText);

  const resumeKeywordsSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  const jobKeywordsSet = new Set(jobKeywords.map(k => k.toLowerCase()));
  const jaccardSim = computeJaccardSimilarity(resumeKeywordsSet, jobKeywordsSet);

  const overlapCoef = computeOverlapCoefficient(resumeKeywordsSet, jobKeywordsSet);

  const weightedSimilarity = (cosineSim * 0.3) + (jaccardSim * 0.3) + (overlapCoef * 0.4);

  return Math.min(weightedSimilarity, 1);
}
