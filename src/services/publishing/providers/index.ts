/**
 * Publishing Providers Registry
 * سجل مزودي النشر — Strategy Pattern
 * 
 * لإضافة منصة جديدة:
 * 1. أنشئ ملف provider جديد ينفذ IPublishingProvider
 * 2. سجّله هنا في PROVIDER_REGISTRY
 */

import { PublishingPlatform } from '../types';
import { IPublishingProvider } from './base-provider';
import { ExternalWebsiteProvider } from './external-website.provider';
import { FacebookProvider } from './facebook.provider';
import { InstagramProvider } from './instagram.provider';
import { TwitterProvider } from './twitter.provider';

// ── Provider Registry ───────────────────────────────────────────────────────

const PROVIDER_REGISTRY: Record<PublishingPlatform, IPublishingProvider> = {
  external_website: new ExternalWebsiteProvider(),
  facebook: new FacebookProvider(),
  instagram: new InstagramProvider(),
  twitter: new TwitterProvider(),
};

/**
 * الحصول على مزود النشر حسب اسم المنصة
 */
export function getProvider(platform: PublishingPlatform): IPublishingProvider | null {
  return PROVIDER_REGISTRY[platform] || null;
}

/**
 * الحصول على جميع المنصات المدعومة
 */
export function getSupportedPlatforms(): PublishingPlatform[] {
  return Object.keys(PROVIDER_REGISTRY) as PublishingPlatform[];
}

/**
 * التحقق من دعم منصة معينة
 */
export function isPlatformSupported(platform: string): platform is PublishingPlatform {
  return platform in PROVIDER_REGISTRY;
}

export { IPublishingProvider } from './base-provider';
export { ExternalWebsiteProvider } from './external-website.provider';
export { FacebookProvider } from './facebook.provider';
export { InstagramProvider } from './instagram.provider';
export { TwitterProvider } from './twitter.provider';
