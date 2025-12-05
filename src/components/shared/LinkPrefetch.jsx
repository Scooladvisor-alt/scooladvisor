import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

// Cache global pour les données préchargées
const prefetchCache = new Map();

// Fonction pour précharger une page
export const prefetchPage = (pageName) => {
  if (prefetchCache.has(pageName)) return;
  
  // Marquer comme en cours de préchargement
  prefetchCache.set(pageName, true);
  
  // Utiliser requestIdleCallback pour ne pas bloquer l'UI
  const prefetch = () => {
    // Dynamic import pour précharger le chunk JS
    switch (pageName) {
      case 'SchoolDetail':
        import('../../pages/SchoolDetail');
        break;
      case 'TeacherDetail':
        import('../../pages/TeacherDetail');
        break;
      case 'Profile':
        import('../../pages/Profile');
        break;
      case 'About':
        import('../../pages/About');
        break;
      case 'Moderation':
        import('../../pages/Moderation');
        break;
      default:
        break;
    }
  };
  
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetch, { timeout: 2000 });
  } else {
    setTimeout(prefetch, 100);
  }
};

// Composant Link avec prefetch au survol
export default function LinkPrefetch({ to, children, prefetchOn = 'hover', className, ...props }) {
  const handleMouseEnter = useCallback(() => {
    if (prefetchOn === 'hover') {
      // Extraire le nom de la page depuis l'URL
      const pageName = to.split('/').pop()?.split('?')[0];
      if (pageName) {
        prefetchPage(pageName);
      }
    }
  }, [to, prefetchOn]);

  return (
    <Link 
      to={to} 
      className={className}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}

// Hook pour prefetch en idle
export const usePrefetchOnIdle = (pageNames) => {
  React.useEffect(() => {
    const prefetchAll = () => {
      pageNames.forEach(pageName => {
        prefetchPage(pageName);
      });
    };
    
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchAll, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(prefetchAll, 2000);
      return () => clearTimeout(id);
    }
  }, []);
};