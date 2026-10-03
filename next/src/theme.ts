export const themes = [
  { id: 'studio', name: 'studio', description: 'white, gray, blue', colors: ['#f7f8fa', '#20242d', '#3559eb'] },
  { id: 'paper', name: 'paper', description: 'ivory, gray, red', colors: ['#f5f0e7', '#34302c', '#d65338'] },
  { id: 'night', name: 'dark', description: 'charcoal, lilac, green', colors: ['#171b21', '#c6bff0', '#d1ef8a'] },
] as const;

export type Theme = (typeof themes)[number]['id'];

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('brett-theme');
    return themes.find((theme) => theme.id === saved)?.id ?? 'studio';
  } catch {
    return 'studio';
  }
}
