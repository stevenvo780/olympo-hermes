import { Metadata } from 'next';
import React from 'react';
import PrivacyNoticeClient from './PrivacyNoticeClient';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description: 'Aviso de privacidad de Hermes',
  openGraph: {
    title: 'Aviso de Privacidad - Hermes',
    description: 'Información sobre cómo manejamos tus datos en Hermes',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['privacidad', 'datos personales', 'aviso legal', 'Hermes'],
  alternates: {
    canonical: 'https://prizma-hermes.vercel.app/graf/privacyPolicies',
  }
};

export default function PrivacyNoticePage() {
  return <PrivacyNoticeClient />;
}
