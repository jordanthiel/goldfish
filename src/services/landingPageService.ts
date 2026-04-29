import { supabase } from '@/integrations/supabase/client';

export interface LandingPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Cache landing pages since they rarely change
let cachedPages: Map<string, LandingPage> | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const landingPageService = {
  // Get all active landing pages
  getAll: async (): Promise<LandingPage[]> => {
    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching landing pages:', error);
      return [];
    }

    return data || [];
  },

  // Get a landing page by slug (cached)
  getBySlug: async (slug: string): Promise<LandingPage | null> => {
    const now = Date.now();

    // Check cache
    if (cachedPages && (now - cacheTime) < CACHE_TTL) {
      return cachedPages.get(slug) || null;
    }

    // Refresh cache
    const pages = await landingPageService.getAll();
    cachedPages = new Map(pages.map(p => [p.slug, p]));
    cacheTime = now;

    return cachedPages.get(slug) || null;
  },

  // Get page ID by slug (convenience method)
  getPageId: async (slug: string): Promise<string | null> => {
    const page = await landingPageService.getBySlug(slug);
    return page?.id || null;
  },

  // Clear cache
  clearCache: () => {
    cachedPages = null;
    cacheTime = 0;
  },
};
