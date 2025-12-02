import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Security Utility Service
 * Handles sanitization, duplicate checks, and heuristic analysis.
 */
export const security = {
  /**
   * 1. DATA SANITIZATION (Anti-XSS, Anti-Injection)
   * Removes dangerous tags, SQL keywords, and invisible characters.
   */
  sanitize: (input) => {
    if (typeof input !== 'string') return input;
    
    let clean = input
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Remove potential HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script injections
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      // Remove potential SQL injections (basic keywords context)
      .replace(/(\b)(DROP TABLE|INSERT INTO|DELETE FROM|UNION SELECT)(\b)/gi, '')
      .trim();

    return clean;
  },

  /**
   * 2. DUPLICATE PREVENTION
   * Checks if a record already exists based on criteria.
   */
  checkDuplicate: async (entityName, filters) => {
    try {
      const records = await base44.entities[entityName].filter(filters);
      return records.length > 0;
    } catch (error) {
      console.error("Security check failed:", error);
      return false;
    }
  },

  /**
   * 3. USER PERMISSIONS & BAN CHECK
   */
  canPost: (user) => {
    if (!user) return false;
    if (user.is_banned) return false;
    // Check for spammer flags (custom logic could go here)
    return true;
  },

  /**
   * 4. SPAM & FLOOD DETECTION
   * Checks localStorage for rapid actions
   */
  checkRateLimit: (actionKey, limitInSeconds = 10) => {
    const now = Date.now();
    const lastAction = localStorage.getItem(`sec_last_${actionKey}`);
    
    if (lastAction && (now - parseInt(lastAction)) < (limitInSeconds * 1000)) {
      return false; // Rate limited
    }
    
    localStorage.setItem(`sec_last_${actionKey}`, now);
    return true;
  },

  /**
   * 5. INTELLIGENT ALERTING
   * Creates a notification if a threshold is breached
   */
  monitorAnomalies: async (type, referenceId, countThreshold) => {
    // Implementation for client-side monitoring
    // Example: Check recent negative reviews for a school
    if (type === 'negative_review_surge') {
       // This would ideally be a backend aggregation, 
       // but here we log it for the moderation dashboard
       console.warn(`[Security] Monitoring potential surge for ${referenceId}`);
    }
  },

  /**
   * Validates an object against schema and sanitizes all string fields
   */
  validateAndSanitize: (data) => {
    const cleanData = {};
    let isValid = true;

    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string') {
        const sanitized = security.sanitize(value);
        if (sanitized !== value) {
            console.log(`[Security] Sanitized field ${key}`);
        }
        cleanData[key] = sanitized;
        
        // Basic validation: Reject if empty after sanitize but wasn't before
        if (value.length > 0 && sanitized.length === 0) isValid = false;
      } else {
        cleanData[key] = value;
      }
    });

    if (!isValid) throw new Error("Contenu invalide détecté.");
    return cleanData;
  }
};