import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
  const routes = ['', '/services', '/portfolio', '/contact', '/shop', '/cart', '/visualizer']
    .map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
  return routes;
}


