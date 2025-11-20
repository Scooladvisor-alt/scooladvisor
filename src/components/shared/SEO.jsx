import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({ title, description, canonicalPath, noIndex = false }) {
  const location = useLocation();
  const domain = "https://scooladvisor.fr";
  
  // Construct the full canonical URL
  // Ensure canonicalPath starts with /
  const safePath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${domain}${safePath}`;

  useEffect(() => {
    // Update Title
    if (title) {
      document.title = title;
    }

    // Update Meta Description
    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    if (description) {
      metaDesc.content = description;
    }

    // Update Canonical Link
    let linkCanonical = document.querySelector("link[rel='canonical']");
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = canonicalUrl;

    // Handle Robots Meta
    let metaRobots = document.querySelector("meta[name='robots']");
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }

    // Logic for noindex
    // If explicitly set to noIndex OR if the current URL parameters imply a duplication/technical state
    // For now, we trust the passed prop or if we detect we are NOT on the canonical URL (optional strict mode)
    
    if (noIndex) {
      metaRobots.content = "noindex, nofollow";
    } else {
      // Restore default if it was set to noindex previously (SPA navigation)
      metaRobots.content = "index, follow";
    }

  }, [title, description, canonicalUrl, noIndex, location]);

  return null;
}