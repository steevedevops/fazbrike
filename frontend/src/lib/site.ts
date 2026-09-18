// Public site origin used for canonical URLs, Open Graph, sitemap.xml and
// robots.txt. Must be set to the real production domain before launch.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Backend API origin, safe to call from the server (no CORS involved).
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
