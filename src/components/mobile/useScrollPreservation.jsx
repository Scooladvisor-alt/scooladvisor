import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const scrollCache = {};

export function useScrollPreservation() {
  const location = useLocation();
  const scrollRef = useRef(null);

  useEffect(() => {
    // Restore scroll position when navigating back
    const scrollPos = scrollCache[location.pathname];
    if (scrollPos && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo(0, scrollPos);
      }, 0);
    } else {
      // Scroll to top for new pages
      scrollRef.current?.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Save scroll position when leaving
  useEffect(() => {
    return () => {
      if (scrollRef.current) {
        scrollCache[location.pathname] = scrollRef.current.scrollY;
      }
    };
  }, [location.pathname]);

  return scrollRef;
}