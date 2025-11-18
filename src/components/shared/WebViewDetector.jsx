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

export function getOpenExternalUrl() {
  if (typeof window === 'undefined') return '';
  
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('open_external', 'true');
  return currentUrl.toString();
}

export function openInExternalBrowser() {
  const targetUrl = getOpenExternalUrl();
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /android/i.test(ua);
  
  if (isIOS) {
    // iOS: Tenter d'ouvrir dans Safari
    window.location.href = targetUrl;
  } else if (isAndroid) {
    // Android: Intent Chrome
    const intentUrl = `intent:${targetUrl.replace('https://', '').replace('http://', '')}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    
    // Fallback si Chrome intent échoue
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 500);
  } else {
    // Fallback universel
    window.open(targetUrl, '_blank') || (window.location.href = targetUrl);
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