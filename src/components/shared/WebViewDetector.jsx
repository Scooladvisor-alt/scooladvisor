import { useEffect } from 'react';

// Détection complète des WebViews et In-App Browsers
export function detectWebView() {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  
  // Liste exhaustive des WebViews
  const webViewPatterns = [
    'Snapchat',
    'Instagram',
    'TikTok',
    'FBAN',
    'FBAV',
    'FB_IAB',
    'FB4A',
    'FBAN',
    'Line/',
    'wv',
    'WebView',
    'Twitter',
    'Pinterest',
    'inApp',
    'OPR/',
    'GSA', // Google App
    'LinkedInApp'
  ];
  
  // Vérifier si un pattern correspond
  const isWebView = webViewPatterns.some(pattern => ua.includes(pattern));
  
  // Détection spécifique Chrome dans WebView (Android)
  const isChromeWebView = ua.includes('Chrome') && ua.includes('wv');
  
  return isWebView || isChromeWebView;
}

export function openInExternalBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /android/i.test(ua);
  
  const baseUrl = window.location.origin + '/login?external=1';
  
  if (isIOS) {
    // iOS: Deep-link Safari (le seul qui marche vraiment sur Snapchat)
    window.location.href = `x-safari-https://${baseUrl.replace('https://', '').replace('http://', '')}`;
  } else if (isAndroid) {
    // Android: Intent Chrome
    const intentUrl = `intent://${baseUrl.replace('https://', '').replace('http://', '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    
    // Fallback si Chrome n'est pas disponible
    setTimeout(() => {
      window.location.href = baseUrl;
    }, 1000);
  } else {
    // Fallback universel
    window.location.href = baseUrl;
  }
}

// Hook React pour détecter et initialiser la variable globale
export default function WebViewDetector() {
  useEffect(() => {
    window.isInAppBrowser = detectWebView();
    
    // Log pour debug (à retirer en production si besoin)
    if (window.isInAppBrowser) {
      console.log('WebView détecté:', navigator.userAgent);
    }
  }, []);
  
  return null;
}