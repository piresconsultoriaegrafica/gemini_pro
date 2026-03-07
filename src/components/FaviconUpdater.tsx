import React, { useEffect } from 'react';
import { useAppContext } from '../store';

export function FaviconUpdater() {
  const { companyInfo } = useAppContext();

  useEffect(() => {
    if (companyInfo.logoUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = companyInfo.logoUrl;
    }
  }, [companyInfo.logoUrl]);

  return null;
}
