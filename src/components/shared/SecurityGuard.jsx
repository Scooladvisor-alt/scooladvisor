import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * SecurityGuard Component
 * Wraps the application to enforce global security policies.
 */
export default function SecurityGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const enforceSecurity = async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        
        // 1. Banned User Protocol
        if (user && user.is_banned) {
            // Allow viewing but disable posting (handled in components via security.canPost)
            // If they try to access sensitive routes, redirect
            const sensitiveRoutes = ['/profile', '/moderation', '/admin'];
            if (sensitiveRoutes.some(route => location.pathname.toLowerCase().startsWith(route))) {
                 toast.error("Accès restreint : Votre compte est suspendu.");
                 navigate('/');
            }
        }

        // 2. Admin/Moderator Route Protection
        if (location.pathname.toLowerCase().startsWith('/moderation')) {
            if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
                navigate('/'); // Silent redirect for security
            }
        }

        // 3. Route Integrity Check (Anti-Crash)
        // If we are on a detail page without an ID, redirect
        if ((location.pathname.includes('SchoolDetail') || location.pathname.includes('TeacherDetail')) && !location.search.includes('id=')) {
            // Check if using new clean routes format
             if (!location.pathname.match(/\/(schools|teachers)\/[\w-]+/)) {
                 navigate('/');
             }
        }

      } catch (error) {
        console.error("[SecurityGuard] Check failed", error);
      } finally {
        setIsChecking(false);
      }
    };

    enforceSecurity();
    
    // 4. Global Error Listener for "White Screen of Death" prevention
    const handleError = (event) => {
        console.error("[SecurityGuard] Caught global error:", event.error);
        // If critical chunk load error
        if (event.error?.name === 'ChunkLoadError') {
            window.location.reload();
        }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);

  }, [location.pathname, navigate]);

  // Render children immediately, security checks happen in background/parallel
  // except for critical admin routes where we might want to show a loader
  return <>{children}</>;
}