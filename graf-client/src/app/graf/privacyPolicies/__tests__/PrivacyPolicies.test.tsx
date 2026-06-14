/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import PrivacyNoticeClient from '../PrivacyNoticeClient';
import PrivacyNoticePage from '../page';

describe('PrivacyPolicies', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Page (Server Component)', () => {
    it('renders the client component', () => {
      render(<PrivacyNoticePage />);
      expect(screen.getByText('Política de Privacidad')).toBeTruthy();
    });
  });

  describe('PrivacyNoticeClient', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('renders the main title', () => {
      const { unmount } = render(<PrivacyNoticeClient />);
      expect(screen.getByText('Política de Privacidad')).toBeTruthy();
      unmount();
    });

    it('renders all sections', () => {
      const { unmount } = render(<PrivacyNoticeClient />);
      expect(screen.getByText('1. Introducción')).toBeTruthy();
      expect(screen.getByText('2. Identificación del Responsable')).toBeTruthy();
      expect(screen.getByText('3. Finalidad del Tratamiento')).toBeTruthy();
      expect(screen.getByText('4. Datos Personales Recopilados')).toBeTruthy();
      expect(screen.getByText('5. Consentimiento y Principio de Minimización')).toBeTruthy();
      expect(screen.getByText('6. Derechos del Titular')).toBeTruthy();
      expect(screen.getByText('7. Almacenamiento y Seguridad de la Información')).toBeTruthy();
      expect(screen.getByText('8. Transferencias Internacionales')).toBeTruthy();
      expect(screen.getByText('9. Cambios en la Política de Privacidad')).toBeTruthy();
      expect(screen.getByText('10. Procedimiento para Ejercer Derechos')).toBeTruthy();
      expect(screen.getByText('11. Conservación de los Datos y Procedimiento de Quejas')).toBeTruthy();
      unmount();
    });

    it('renders company information', () => {
      const { unmount } = render(<PrivacyNoticeClient />);
      expect(screen.getByText('Cauce', { selector: '.company-badge' })).toBeTruthy();
      expect(screen.getByText(/Calle 44 #50-135/)).toBeTruthy();
      // Use getAllByText because the email appears in the list and in the strong tag logic sometimes
      const emails = screen.getAllByText(/suport@humanizar.co/);
      expect(emails.length).toBeGreaterThan(0);
      unmount();
    });

    it('renders footer date', () => {
      const { unmount } = render(<PrivacyNoticeClient />);
      expect(screen.getByText(/Fecha de vigencia:/)).toBeTruthy();
      unmount();
    });
  });
});
