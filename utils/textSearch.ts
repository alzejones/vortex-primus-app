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
