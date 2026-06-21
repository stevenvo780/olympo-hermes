import ClientLayout from './components/ClientLayout';
import Script from 'next/script';
import axiosServer from '@/utils/axiosServer';
import type { Metadata } from 'next';
import { Store } from '@/types';
import StoreNotFound from './components/StoreNotFound';
import StoreNotConfigured from './components/StoreNotConfigured';
import React from 'react';

const storeCache: Record<string, Store> = {};
async function getStoreCached(storeId: string): Promise<Store | null> {
  if (storeCache[storeId]) return storeCache[storeId];
  try {
    const { data } = await axiosServer.get(`/store/${storeId}`);
    storeCache[storeId] = data;
    return data;
  } catch {
    return null;
  }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hermes.com.co/';

export async function generateMetadata(
  { params }: { params: Promise<{ storeId: string }> }
): Promise<Metadata> {
  const { storeId } = await params;
  const metadata: Metadata = {};

  try {
    const store: Store | null = await getStoreCached(storeId);
    const config = store?.configuration;
    if (config) {
      const storeTitle = config.seo?.metaTitle || config.store?.name;
      if (storeTitle) {
        metadata.title = storeTitle;
      }

      if (config.seo?.metaDescription) {
        metadata.description = config.seo.metaDescription;
      }
      if (config.seo?.keywords) {
        metadata.keywords = config.seo.keywords;
      }

      if (config.logo) {
        metadata.icons = {
          icon: [
            { url: config.logo },
            { url: config.logo, type: 'image/png' },
          ],
          apple: [
            { url: config.logo },
          ],
          shortcut: [{ url: config.logo }],
        };
      }

      if (config.seo) {
        metadata.openGraph = {
          title: config.seo.metaTitle || storeTitle,
          description: config.seo.metaDescription || '',
          url: siteUrl + "/" + storeId,
          siteName: config.store?.name || '',
          locale: 'es_ES',
          type: 'website',
          images: config.logo
            ? [
              {
                url: config.logo,
                width: 1200,
                height: 630,
                alt: `${config.store?.name || 'Tienda'}`
              }
            ]
            : config.banners && config.banners.length > 0
              ? [
                {
                  url: config.banners[0],
                  width: 1200,
                  height: 630,
                  alt: `${config.store?.name || 'Tienda'}`
                }
              ]
              : [],
        };

        metadata.twitter = {
          card: 'summary_large_image',
          title: config.seo.metaTitle || storeTitle,
          description: config.seo.metaDescription || '',
          images: config.logo
            ? [
              {
                url: config.logo,
                alt: `${config.store?.name || 'Tienda'} Logo`
              }
            ]
            : config.banners && config.banners.length > 0
              ? [
                {
                  url: config.banners[0],
                  alt: `${config.store?.name || 'Tienda'}`
                }
              ]
              : []
        };

        metadata.alternates = {
          canonical: `${siteUrl}/${storeId}`
        };
      }
    }
  } catch {
  }

  return metadata;
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  height: 'device-height'
};

export default async function ComercioLayout({ children, params }: { children: React.ReactNode, params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const initialStore: Store | null = await getStoreCached(storeId);

  if (!initialStore) {
    return <StoreNotFound />;
  }

  if (!initialStore.configuration) {
    return <StoreNotConfigured />;
  }

  const storeStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: initialStore.configuration.store?.name || initialStore.name,
    image: initialStore.configuration.logo || '/images/logo.svg',
    url: `${siteUrl}${storeId}`,
    logo: initialStore.configuration.logo || '/images/logo.svg',
    description: initialStore.configuration.seo?.metaDescription || initialStore.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: initialStore.configuration.storeAddress || initialStore.address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: initialStore.configuration.coordinates?.lat,
      longitude: initialStore.configuration.coordinates?.lng,
    },
    openingHours: initialStore.configuration.schedule?.map(day =>
      day.isOpen ? `${day.day.charAt(0).toUpperCase() + day.day.slice(1)} ${day.openTime}-${day.closeTime}` : ''
    ).filter(Boolean),
    telephone: initialStore.phoneNumber ? `${initialStore.phonePrefix}${initialStore.phoneNumber}` : '',
    email: initialStore.owner.email || '',
  };

  return (
    <>
      <Script id="store-schema-org" type="application/ld+json">
        {JSON.stringify(storeStructuredData)}
      </Script>

      <ClientLayout initialStore={initialStore}>
        <div style={{ marginTop: '1rem' }}>{children}</div>
      </ClientLayout>
    </>
  );
}