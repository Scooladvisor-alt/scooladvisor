import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({ title, description, canonicalPath, noIndex = false, structuredData = null }) {
  const location = useLocation();
  const domain = "https://scooladvisor.fr";
  
  const safePath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${domain}${safePath}`;

  useEffect(() => {
    if (title) {
      document.title = title;
    }

    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    if (description) {
      metaDesc.content = description;
    }

    let linkCanonical = document.querySelector("link[rel='canonical']");
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = canonicalUrl;

    // Open Graph tags
    const updateOGTag = (property, content) => {
      if (!content) return;
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    updateOGTag('og:url', canonicalUrl);
    updateOGTag('og:type', 'website');
    updateOGTag('og:site_name', 'ScoolAdvisor');

    let metaRobots = document.querySelector("meta[name='robots']");
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }

    const sensitiveRoutes = ['/profile', '/moderation', '/admin', '/login', '/register'];
    const isSensitive = sensitiveRoutes.some(route => location.pathname.toLowerCase().startsWith(route));

    const shouldNoIndex = noIndex || 
                         isSensitive ||
                         location.search.includes('utm_') ||
                         location.search.includes('fbclid');
    
    if (shouldNoIndex) {
      metaRobots.content = "noindex, nofollow";
    } else {
      metaRobots.content = "index, follow";
    }

    // JSON-LD structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]#structured-data');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('id', 'structured-data');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

  }, [title, description, canonicalUrl, noIndex, location, structuredData]);

  return null;
}