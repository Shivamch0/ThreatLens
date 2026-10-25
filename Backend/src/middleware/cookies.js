export function parseCookies(req, _res, next) {
  req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const [name, ...value] = part.trim().split('=');
    try { return [name, decodeURIComponent(value.join('='))]; } catch { return [name, '']; }
  }));
  next();
}
