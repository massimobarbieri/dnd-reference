

export async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Errore caricamento JSON: ${path}`);
  return response.json();
}

export async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Errore caricamento testo: ${path}`);
  return response.text();
}

export async function loadConfig() {
  const text = await fetchText('config.yml');
  return parseSimpleYaml(text);
}

export function parseSimpleYaml(text) {
  const result = {};
  let currentSection = null;

  String(text || '')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) return;

      const sectionMatch = trimmed.match(/^([a-zA-Z0-9_]+):$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        result[currentSection] = {};
        return;
      }

      const keyValueMatch = trimmed.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (!keyValueMatch || !currentSection) return;

      const [, key, rawValue] = keyValueMatch;
      result[currentSection][key] = parseYamlScalar(rawValue);
    });

  return result;
}

export function parseYamlScalar(value) {
  const text = String(value || '').trim();

  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);

  return text;
}

export function parseMonsterImages(text) {
  const images = new Map();
  let currentId = '';

  String(text || '')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) return;
      if (trimmed === 'mostri:') return;

      const listIdMatch = trimmed.match(/^-\s*id:\s*(.+)$/);
      if (listIdMatch) {
        currentId = String(parseYamlScalar(listIdMatch[1]));
        images.set(currentId, {});
        return;
      }

      const idMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*$/);
      if (idMatch) {
        currentId = idMatch[1];
        images.set(currentId, {});
        return;
      }

      const keyValueMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (!keyValueMatch || !currentId) return;

      const [, key, rawValue] = keyValueMatch;
      images.get(currentId)[key] = parseYamlScalar(rawValue);
    });

  return images;
}
