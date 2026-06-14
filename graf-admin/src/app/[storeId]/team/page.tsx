import { Metadata } from 'next';
import TeamManagementClient from './TeamManagementClient';

export const metadata: Metadata = {
  title: 'Equipo - Graf | Admin',
  description: 'Gestiona los miembros del equipo de tu tienda',
  openGraph: {
    title: 'Equipo - Graf | Admin',
    description: 'Gestiona los miembros del equipo de tu tienda',
    url: 'https://Graf.com/team',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['equipo', 'admin', 'gestión', 'Graf', 'colaboradores'],
  alternates: {
    canonical: 'https://Graf.com/team',
  }
};

export default function TeamManagementPage() {
  return <TeamManagementClient />;
}