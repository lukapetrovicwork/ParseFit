export function normalizeText(text: string): string {
  let normalized = text;

  normalized = normalized
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/\u00AD/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  normalized = normalized
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u25A0\u25A1]/g, '•')
    .replace(/[►▸▹▶➤➢➣➔→⇒⟶]/g, '•')
    .replace(/[●○◆◇■□▪▫]/g, '•');

  normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  normalized = normalized.replace(/[ \t]+/g, ' ');

  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  normalized = normalized
    .split('\n')
    .map(line => line.trim())
    .join('\n');

  normalized = normalized.trim();

  return normalized;
}

export function extractBullets(text: string): string[] {
  const lines = text.split('\n');
  const bullets: string[] = [];

  const bulletPatterns = [
    /^[\u2022•\-\*\+]\s*/,
    /^[a-z]\)\s*/i,
    /^\d+[.)]\s*/,
    /^[ivxIVX]+[.)]\s*/,
    /^○\s*/,
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    for (const pattern of bulletPatterns) {
      if (pattern.test(trimmed)) {
        const bulletText = trimmed.replace(pattern, '').trim();
        if (bulletText.length > 10) {
          bullets.push(bulletText);
        }
        break;
      }
    }
  }

  return bullets;
}

export function cleanForAnalysis(text: string): string {
  let cleaned = normalizeText(text);

  cleaned = cleaned.toLowerCase();

  cleaned = cleaned.replace(/[^\w\s\-\.]/g, ' ');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function tokenize(text: string): string[] {
  const cleaned = cleanForAnalysis(text);

  const tokens = cleaned.split(/\s+/).filter(token => {
    return token.length > 1 && !/^\d+$/.test(token);
  });

  return tokens;
}

export function extractSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  return sentences.map(s => s.trim()).filter(s => s.length > 10);
}

export function removeStopWords(tokens: string[]): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'dare', 'ought', 'used', 'i', 'me', 'my', 'myself', 'we', 'our',
    'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it',
    'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'been', 'being', 'having', 'doing', 'because', 'until', 'while',
    'about', 'against', 'between', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'now', 'etc', 'eg', 'ie',
  ]);

  return tokens.filter(token => !stopWords.has(token.toLowerCase()));
}

export function extractPhrases(text: string, minWords: number = 2, maxWords: number = 4): string[] {
  const sentences = extractSentences(text);
  const phrases: string[] = [];

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(w => w.length > 0);

    for (let len = minWords; len <= maxWords && len <= words.length; len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join(' ').toLowerCase();
        if (isValidPhrase(phrase)) {
          phrases.push(phrase);
        }
      }
    }
  }

  return [...new Set(phrases)];
}

function isValidPhrase(phrase: string): boolean {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const words = phrase.split(' ');

  if (stopWords.includes(words[0]) || stopWords.includes(words[words.length - 1])) {
    return false;
  }

  const meaningfulWords = words.filter(w => !stopWords.includes(w));
  if (meaningfulWords.length < 1) {
    return false;
  }

  return true;
}
