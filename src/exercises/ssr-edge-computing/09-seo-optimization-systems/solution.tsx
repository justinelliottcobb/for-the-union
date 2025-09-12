import React, { useState, useEffect } from 'react';
import type { ReactElement } from 'react';

// === TYPES AND INTERFACES ===

interface MetaConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  viewport?: string;
  charset?: string;
  lang?: string;
  openGraph?: OpenGraphData;
  twitter?: TwitterCardData;
}

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  siteName?: string;
  locale?: string;
}

interface TwitterCardData {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

interface StructuredDataSchema {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    url: string;
    caption?: string;
    title?: string;
  }>;
}

interface SitemapIndex {
  url: string;
  lastmod?: string;
}

// === META MANAGER CLASS ===

export class MetaManager {
  private baseConfig: MetaConfig = {
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1.0',
    robots: 'index,follow',
    lang: 'en'
  };

  generateMetaTags(config: MetaConfig): string {
    const mergedConfig = { ...this.baseConfig, ...config };
    const tags: string[] = [];

    // Basic meta tags
    if (mergedConfig.charset) {
      tags.push(`<meta charset="${mergedConfig.charset}">`);
    }

    if (mergedConfig.viewport) {
      tags.push(`<meta name="viewport" content="${mergedConfig.viewport}">`);
    }

    if (mergedConfig.title) {
      tags.push(`<title>${this.escapeHtml(mergedConfig.title)}</title>`);
    }

    if (mergedConfig.description) {
      tags.push(`<meta name="description" content="${this.escapeHtml(mergedConfig.description)}">`);
    }

    if (mergedConfig.keywords?.length) {
      tags.push(`<meta name="keywords" content="${mergedConfig.keywords.join(', ')}">`);
    }

    if (mergedConfig.canonical) {
      tags.push(`<link rel="canonical" href="${mergedConfig.canonical}">`);
    }

    if (mergedConfig.robots) {
      tags.push(`<meta name="robots" content="${mergedConfig.robots}">`);
    }

    // Open Graph tags
    if (mergedConfig.openGraph) {
      tags.push(...this.generateOpenGraphTags(mergedConfig.openGraph));
    }

    // Twitter Card tags
    if (mergedConfig.twitter) {
      tags.push(...this.generateTwitterCardTags(mergedConfig.twitter));
    }

    return tags.join('\n');
  }

  generateTitle(template: string, data: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  generateDescription(content: string, maxLength: number = 160): string {
    const cleaned = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  }

  generateCanonicalUrl(baseUrl: string, path: string, params?: URLSearchParams): string {
    const url = new URL(path, baseUrl);
    
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
    trackingParams.forEach(param => {
      url.searchParams.delete(param);
    });

    // Add additional params if provided
    if (params) {
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  private generateOpenGraphTags(og: OpenGraphData): string[] {
    const tags: string[] = [];

    if (og.title) {
      tags.push(`<meta property="og:title" content="${this.escapeHtml(og.title)}">`);
    }

    if (og.description) {
      tags.push(`<meta property="og:description" content="${this.escapeHtml(og.description)}">`);
    }

    if (og.image) {
      tags.push(`<meta property="og:image" content="${og.image}">`);
    }

    if (og.url) {
      tags.push(`<meta property="og:url" content="${og.url}">`);
    }

    if (og.type) {
      tags.push(`<meta property="og:type" content="${og.type}">`);
    }

    if (og.siteName) {
      tags.push(`<meta property="og:site_name" content="${this.escapeHtml(og.siteName)}">`);
    }

    if (og.locale) {
      tags.push(`<meta property="og:locale" content="${og.locale}">`);
    }

    return tags;
  }

  private generateTwitterCardTags(twitter: TwitterCardData): string[] {
    const tags: string[] = [];

    if (twitter.card) {
      tags.push(`<meta name="twitter:card" content="${twitter.card}">`);
    }

    if (twitter.site) {
      tags.push(`<meta name="twitter:site" content="${twitter.site}">`);
    }

    if (twitter.creator) {
      tags.push(`<meta name="twitter:creator" content="${twitter.creator}">`);
    }

    if (twitter.title) {
      tags.push(`<meta name="twitter:title" content="${this.escapeHtml(twitter.title)}">`);
    }

    if (twitter.description) {
      tags.push(`<meta name="twitter:description" content="${this.escapeHtml(twitter.description)}">`);
    }

    if (twitter.image) {
      tags.push(`<meta name="twitter:image" content="${twitter.image}">`);
    }

    return tags;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  validateMetadata(config: MetaConfig): Array<{ field: string; message: string }> {
    const issues: Array<{ field: string; message: string }> = [];

    if (!config.title) {
      issues.push({ field: 'title', message: 'Title is required' });
    } else if (config.title.length > 60) {
      issues.push({ field: 'title', message: 'Title should be under 60 characters' });
    }

    if (!config.description) {
      issues.push({ field: 'description', message: 'Description is required' });
    } else if (config.description.length > 160) {
      issues.push({ field: 'description', message: 'Description should be under 160 characters' });
    }

    if (config.openGraph?.image && !this.isValidImageUrl(config.openGraph.image)) {
      issues.push({ field: 'openGraph.image', message: 'Invalid image URL format' });
    }

    return issues;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(parsed.pathname);
    } catch {
      return false;
    }
  }
}

// === STRUCTURED DATA CLASS ===

export class StructuredData {
  generateWebsiteSchema(data: {
    name: string;
    url: string;
    description?: string;
    logo?: string;
  }): StructuredDataSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: data.name,
      url: data.url,
      description: data.description,
      image: data.logo,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${data.url}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };
  }

  generateOrganizationSchema(data: {
    name: string;
    url: string;
    logo?: string;
    contactPoint?: {
      telephone: string;
      contactType: string;
    };
    address?: {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
  }): StructuredDataSchema {
    const schema: StructuredDataSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name,
      url: data.url
    };

    if (data.logo) {
      schema.logo = data.logo;
    }

    if (data.contactPoint) {
      schema.contactPoint = {
        '@type': 'ContactPoint',
        telephone: data.contactPoint.telephone,
        contactType: data.contactPoint.contactType
      };
    }

    if (data.address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: data.address.streetAddress,
        addressLocality: data.address.addressLocality,
        addressRegion: data.address.addressRegion,
        postalCode: data.address.postalCode,
        addressCountry: data.address.addressCountry
      };
    }

    return schema;
  }

  generateArticleSchema(data: {
    headline: string;
    description: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    image?: string;
    url: string;
  }): StructuredDataSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.headline,
      description: data.description,
      author: {
        '@type': 'Person',
        name: data.author
      },
      datePublished: data.datePublished,
      dateModified: data.dateModified || data.datePublished,
      image: data.image,
      url: data.url
    };
  }

  generateProductSchema(data: {
    name: string;
    description: string;
    image?: string;
    brand?: string;
    offers: {
      price: string;
      currency: string;
      availability: string;
    };
    aggregateRating?: {
      ratingValue: number;
      reviewCount: number;
    };
  }): StructuredDataSchema {
    const schema: StructuredDataSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      description: data.description,
      image: data.image,
      offers: {
        '@type': 'Offer',
        price: data.offers.price,
        priceCurrency: data.offers.currency,
        availability: `https://schema.org/${data.offers.availability}`
      }
    };

    if (data.brand) {
      schema.brand = {
        '@type': 'Brand',
        name: data.brand
      };
    }

    if (data.aggregateRating) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        reviewCount: data.aggregateRating.reviewCount
      };
    }

    return schema;
  }

  generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): StructuredDataSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    };
  }

  generateFAQSchema(faqs: Array<{ question: string; answer: string }>): StructuredDataSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  validateSchema(schema: StructuredDataSchema): boolean {
    try {
      // Basic validation
      if (!schema['@context'] || !schema['@type']) {
        return false;
      }

      // Validate JSON-LD format
      JSON.stringify(schema);
      return true;
    } catch {
      return false;
    }
  }

  renderJsonLd(schema: StructuredDataSchema): string {
    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }
}

// === SITEMAP GENERATOR CLASS ===

export class SitemapGenerator {
  private baseUrl: string;
  private defaultChangefreq: SitemapEntry['changefreq'] = 'weekly';
  private defaultPriority: number = 0.8;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  generateSitemap(entries: SitemapEntry[]): string {
    const xmlEntries = entries.map(entry => this.generateUrlEntry(entry)).join('\n');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlEntries}
</urlset>`;
  }

  generateSitemapIndex(sitemaps: SitemapIndex[]): string {
    const xmlEntries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>${this.escapeXml(sitemap.url)}</loc>
    ${sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</sitemapindex>`;
  }

  private generateUrlEntry(entry: SitemapEntry): string {
    const images = entry.images?.map(image => `
    <image:image>
      <image:loc>${this.escapeXml(image.url)}</image:loc>
      ${image.caption ? `<image:caption>${this.escapeXml(image.caption)}</image:caption>` : ''}
      ${image.title ? `<image:title>${this.escapeXml(image.title)}</image:title>` : ''}
    </image:image>`).join('') || '';

    return `
  <url>
    <loc>${this.escapeXml(entry.url)}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    <changefreq>${entry.changefreq || this.defaultChangefreq}</changefreq>
    <priority>${entry.priority || this.defaultPriority}</priority>${images}
  </url>`;
  }

  generateRobotsTxt(sitemapUrl: string, additionalRules?: string[]): string {
    const rules = [
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${sitemapUrl}`,
      ''
    ];

    if (additionalRules) {
      rules.push(...additionalRules);
    }

    return rules.join('\n');
  }

  createDynamicSitemap(
    pages: Array<{ 
      path: string; 
      lastModified?: Date; 
      priority?: number;
      changefreq?: SitemapEntry['changefreq'];
    }>
  ): SitemapEntry[] {
    return pages.map(page => ({
      url: `${this.baseUrl}${page.path}`,
      lastmod: page.lastModified?.toISOString(),
      priority: page.priority || this.defaultPriority,
      changefreq: page.changefreq || this.defaultChangefreq
    }));
  }

  splitLargeSitemap(entries: SitemapEntry[], maxEntriesPerSitemap: number = 50000): SitemapEntry[][] {
    const chunks: SitemapEntry[][] = [];
    
    for (let i = 0; i < entries.length; i += maxEntriesPerSitemap) {
      chunks.push(entries.slice(i, i + maxEntriesPerSitemap));
    }
    
    return chunks;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  validateSitemap(xml: string): boolean {
    try {
      // Basic XML validation
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      const parseError = doc.querySelector('parsererror');
      
      return !parseError;
    } catch {
      return false;
    }
  }
}

// === OPEN GRAPH OPTIMIZER CLASS ===

export class OpenGraphOptimizer {
  private defaultImageSize = { width: 1200, height: 630 };

  optimizeForPlatform(
    config: OpenGraphData,
    platform: 'facebook' | 'twitter' | 'linkedin' | 'general'
  ): { openGraph: OpenGraphData; twitter: TwitterCardData } {
    const optimized: { openGraph: OpenGraphData; twitter: TwitterCardData } = {
      openGraph: { ...config },
      twitter: {}
    };

    switch (platform) {
      case 'facebook':
        optimized.openGraph.type = config.type || 'website';
        if (config.image) {
          optimized.openGraph.image = this.optimizeImageUrl(config.image, 1200, 630);
        }
        break;

      case 'twitter':
        optimized.twitter.card = 'summary_large_image';
        optimized.twitter.title = config.title;
        optimized.twitter.description = config.description;
        if (config.image) {
          optimized.twitter.image = this.optimizeImageUrl(config.image, 1200, 600);
        }
        break;

      case 'linkedin':
        optimized.openGraph.type = 'article';
        if (config.image) {
          optimized.openGraph.image = this.optimizeImageUrl(config.image, 1200, 627);
        }
        break;

      case 'general':
        // Use defaults that work well across platforms
        if (config.image) {
          optimized.openGraph.image = this.optimizeImageUrl(config.image, 1200, 630);
        }
        optimized.twitter.card = 'summary_large_image';
        break;
    }

    return optimized;
  }

  generateSocialPreview(data: {
    title: string;
    description: string;
    image?: string;
    url: string;
    siteName?: string;
  }): { html: string; debugUrls: Record<string, string> } {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="${data.title}">
  <meta property="og:description" content="${data.description}">
  <meta property="og:url" content="${data.url}">
  ${data.image ? `<meta property="og:image" content="${data.image}">` : ''}
  ${data.siteName ? `<meta property="og:site_name" content="${data.siteName}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${data.title}">
  <meta name="twitter:description" content="${data.description}">
  ${data.image ? `<meta name="twitter:image" content="${data.image}">` : ''}
</head>
<body>
  <h1>${data.title}</h1>
  <p>${data.description}</p>
</body>
</html>`;

    const debugUrls = {
      facebook: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(data.url)}`,
      twitter: `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(data.url)}`,
      linkedin: `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(data.url)}`
    };

    return { html, debugUrls };
  }

  private optimizeImageUrl(imageUrl: string, width: number, height: number): string {
    // In a real implementation, this would generate optimized image URLs
    // For now, we'll append query parameters to indicate desired dimensions
    const url = new URL(imageUrl);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('auto', 'format,compress');
    
    return url.toString();
  }

  validateSocialImage(imageUrl: string): Promise<{
    isValid: boolean;
    dimensions?: { width: number; height: number };
    fileSize?: number;
    issues: string[];
  }> {
    return new Promise((resolve) => {
      const img = new Image();
      const issues: string[] = [];

      img.onload = () => {
        const { width, height } = img;
        
        // Check dimensions
        if (width < 600 || height < 315) {
          issues.push('Image dimensions too small (minimum 600x315)');
        }
        
        if (width / height < 1.91 || width / height > 1.91) {
          issues.push('Image aspect ratio should be close to 1.91:1 for optimal display');
        }

        resolve({
          isValid: issues.length === 0,
          dimensions: { width, height },
          issues
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          issues: ['Unable to load image']
        });
      };

      img.src = imageUrl;
    });
  }
}

// === DEMO COMPONENT ===

export const DemoSEOOptimization: React.FC = () => {
  const [metaTags, setMetaTags] = useState<string>('');
  const [structuredData, setStructuredData] = useState<StructuredDataSchema | null>(null);
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [socialPreview, setSocialPreview] = useState<{ html: string; debugUrls: Record<string, string> } | null>(null);

  useEffect(() => {
    // Initialize SEO systems
    const metaManager = new MetaManager();
    const structuredDataManager = new StructuredData();
    const sitemapGenerator = new SitemapGenerator('https://example.com');
    const ogOptimizer = new OpenGraphOptimizer();

    // Generate meta tags
    const config: MetaConfig = {
      title: 'SEO Optimization Demo | Advanced SSR Patterns',
      description: 'Learn advanced SEO optimization techniques for SSR applications with dynamic metadata and structured data.',
      keywords: ['SEO', 'SSR', 'React', 'Next.js', 'Optimization'],
      canonical: 'https://example.com/seo-demo',
      openGraph: {
        title: 'SEO Optimization Demo',
        description: 'Advanced SEO patterns for modern web applications',
        image: 'https://example.com/og-image.jpg',
        type: 'website',
        url: 'https://example.com/seo-demo'
      },
      twitter: {
        card: 'summary_large_image',
        title: 'SEO Optimization Demo',
        description: 'Advanced SEO patterns for modern web applications',
        image: 'https://example.com/twitter-image.jpg'
      }
    };

    setMetaTags(metaManager.generateMetaTags(config));

    // Generate structured data
    const websiteSchema = structuredDataManager.generateWebsiteSchema({
      name: 'SEO Demo Site',
      url: 'https://example.com',
      description: 'Demonstration of advanced SEO optimization techniques'
    });

    setStructuredData(websiteSchema);

    // Generate sitemap
    const pages = [
      { path: '/', lastModified: new Date(), priority: 1.0, changefreq: 'daily' as const },
      { path: '/about', lastModified: new Date(), priority: 0.8, changefreq: 'monthly' as const },
      { path: '/products', lastModified: new Date(), priority: 0.9, changefreq: 'weekly' as const },
      { path: '/blog', lastModified: new Date(), priority: 0.7, changefreq: 'daily' as const }
    ];

    const sitemapEntries = sitemapGenerator.createDynamicSitemap(pages);
    setSitemapXml(sitemapGenerator.generateSitemap(sitemapEntries));

    // Generate social preview
    const preview = ogOptimizer.generateSocialPreview({
      title: 'SEO Optimization Demo',
      description: 'Advanced SEO patterns for modern web applications',
      image: 'https://example.com/social-image.jpg',
      url: 'https://example.com/seo-demo',
      siteName: 'SEO Demo Site'
    });

    setSocialPreview(preview);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">SEO Optimization Systems Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-3">Generated Meta Tags</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {metaTags}
          </pre>
        </div>
        
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-3">Structured Data (JSON-LD)</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {structuredData ? JSON.stringify(structuredData, null, 2) : 'Loading...'}
          </pre>
        </div>
      </div>

      <div className="p-4 bg-white border rounded-lg">
        <h3 className="font-semibold mb-3">XML Sitemap Sample</h3>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-64">
          {sitemapXml}
        </pre>
      </div>

      <div className="p-4 bg-white border rounded-lg">
        <h3 className="font-semibold mb-3">Social Media Debug URLs</h3>
        {socialPreview && (
          <div className="space-y-2">
            {Object.entries(socialPreview.debugUrls).map(([platform, url]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="capitalize font-medium">{platform}:</span>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Test Preview
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">SEO Features</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Dynamic metadata generation with templates</li>
          <li>✅ Structured data with JSON-LD and schema.org</li>
          <li>✅ XML sitemap generation with images</li>
          <li>✅ Open Graph and Twitter Cards optimization</li>
          <li>✅ Canonical URL management</li>
          <li>✅ Robots meta tags and sitemap</li>
          <li>✅ Social media preview validation</li>
          <li>✅ SEO metadata validation</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoSEOOptimization;