/** Official LINE add-friend URL from VITE_LINE_ID (e.g. @PimSuea). */
export function lineAddFriendUrl(): string {
  const raw = import.meta.env.VITE_LINE_ID || '@PimSuea';
  const id = raw.startsWith('@') ? raw : `@${raw}`;
  return `https://line.me/R/ti/p/${encodeURIComponent(id)}`;
}

export function lineDisplayId(): string {
  return import.meta.env.VITE_LINE_ID || '@PimSuea';
}
