import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from "@/api/base44Client";

export default function SecurityGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const enforceSecurity = async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        
        // Admin/Moderator Route Protection only
        if (location.pathname.toLowerCase().includes('moderation')) {
            if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
                navigate('/');
            }
        }
      } catch (error) {
        console.error("[SecurityGuard] Check failed", error);
      }
    };

    enforceSecurity();
  }, [location.pathname, navigate]);

  return <>{children}</>;
}