/**
 * Normaliza texto para busca sem distinção de acentos
 * Remove diacríticos (acentos), converte para minúsculas e remove espaços extras
 * @param str - Texto a ser normalizado
 * @returns Texto normalizado para comparação
 */
export function normalizeSearch(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Preposições e artigos comuns em português a serem ignorados na busca tokenizada
 */
const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os',
  'em', 'no', 'na', 'nos', 'nas', 'com', 'para'
]);

/**
 * Verifica se um texto contém todos os tokens de uma busca (em qualquer ordem)
 * Remove preposições e artigos, normaliza acentos e case-insensitive
 * 
 * @param text - Texto onde será feita a busca
 * @param query - Termos de busca (podem conter múltiplas palavras)
 * @returns true se todas as palavras significativas da busca aparecem no texto
 * 
 * @example
 * matchesSearchTokens('Shake de Morango', 'morango shake') // true
 * matchesSearchTokens('Shake de Morango', 'shake') // true
 * matchesSearchTokens('Shake de Morango', 'chocolate') // false
 */
export function matchesSearchTokens(text: string | null | undefined, query: string | null | undefined): boolean {
  if (!text || !query) return false;

  const normalizedText = normalizeSearch(text);
  const normalizedQuery = normalizeSearch(query);

  const queryTokens = normalizedQuery
    .split(/\s+/)
    .filter(token => token.length > 0 && !STOP_WORDS.has(token));

  if (queryTokens.length === 0) return true;

  return queryTokens.every(token => normalizedText.includes(token));
}
