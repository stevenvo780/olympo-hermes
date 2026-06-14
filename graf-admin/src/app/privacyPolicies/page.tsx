import { Metadata } from 'next';
import React from 'react';
import PrivacyNoticeClient from './PrivacyNoticeClient';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description: 'Aviso de privacidad de Graf',
  openGraph: {
    title: 'Aviso de Privacidad - Graf',
    description: 'Información sobre cómo manejamos tus datos en Graf',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['privacidad', 'datos personales', 'aviso legal', 'Graf'],
  alternates: {
    canonical: 'https://Graf.com/privacy-notice',
  }
};

export default function PrivacyNoticePage() {
  return <PrivacyNoticeClient />;
}
