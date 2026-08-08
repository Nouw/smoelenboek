import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';
import { toPlainText } from '@react-email/render';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { EmailLocale, EmailMessageType } from './entities/email-outbox.entity';

export type RenderedEmail = { subject: string; html: string; text: string };

type EmailRenderer = (locale: EmailLocale, payload: Record<string, unknown>) => Promise<RenderedEmail>;

const ignore = {
  nl: 'Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.',
  en: 'If you did not request this, you can ignore this email.',
} as const;

const greeting = { nl: 'Hallo', en: 'Hello' } as const;

function makeActionEmail(copy: {
  nl: [subject: string, heading: string, intro: string, action: string];
  en: [subject: string, heading: string, intro: string, action: string];
}): EmailRenderer {
  return async (locale, payload) => {
    const name = String(payload.name ?? '');
    const url = String(payload.url ?? '');
    const [subject, heading, intro, action] = copy[locale];
    const tree = createElement(Html, null,
      createElement(Head),
      createElement(Preview, null, subject),
      createElement(Body, { style: styles.body },
        createElement(Container, { style: styles.container },
          createElement(Heading, { style: styles.brand }, 'Smoelenboek'),
          createElement(Heading, { as: 'h2', style: styles.heading }, heading),
          createElement(Text, { style: styles.text }, `${greeting[locale]} ${name},`),
          createElement(Text, { style: styles.text }, intro),
          createElement(Section, { style: styles.action }, createElement(Button, { href: url, style: styles.button }, action)),
          createElement(Text, { style: styles.small }, ignore[locale]),
          createElement(Hr, { style: styles.rule }),
          createElement(Text, { style: styles.footer }, 'Smoelenboek'),
        ),
      ),
    );
    const markup = renderToStaticMarkup(tree);
    const html = `<!DOCTYPE html>${markup}`;
    return { subject, html, text: toPlainText(html) };
  };
}

function makeNotificationEmail(copy: {
  nl: { subject: string; heading: string; body: (payload: Record<string, unknown>) => string };
  en: { subject: string; heading: string; body: (payload: Record<string, unknown>) => string };
}): EmailRenderer {
  return async (locale, payload) => {
    const name = String(payload.name ?? '');
    const { subject, heading, body } = copy[locale];
    const tree = createElement(Html, null,
      createElement(Head),
      createElement(Preview, null, subject),
      createElement(Body, { style: styles.body },
        createElement(Container, { style: styles.container },
          createElement(Heading, { style: styles.brand }, 'Smoelenboek'),
          createElement(Heading, { as: 'h2', style: styles.heading }, heading),
          createElement(Text, { style: styles.text }, `${greeting[locale]} ${name},`),
          createElement(Text, { style: styles.text }, body(payload)),
          createElement(Hr, { style: styles.rule }),
          createElement(Text, { style: styles.footer }, 'Smoelenboek'),
        ),
      ),
    );
    const markup = renderToStaticMarkup(tree);
    const html = `<!DOCTYPE html>${markup}`;
    return { subject, html, text: toPlainText(html) };
  };
}

const renderers = new Map<EmailMessageType, EmailRenderer>([
  ['invitation', makeActionEmail({
    nl: ['Activeer je Smoelenboek-account', 'Welkom bij Smoelenboek', 'Je account is aangemaakt. Kies via de knop hieronder je wachtwoord.', 'Wachtwoord instellen'],
    en: ['Activate your Smoelenboek account', 'Welcome to Smoelenboek', 'Your account is ready. Use the button below to choose your password.', 'Set password'],
  })],
  ['password_reset', makeActionEmail({
    nl: ['Stel je Smoelenboek-wachtwoord opnieuw in', 'Wachtwoord opnieuw instellen', 'We ontvingen een verzoek om je wachtwoord opnieuw in te stellen.', 'Nieuw wachtwoord kiezen'],
    en: ['Reset your Smoelenboek password', 'Reset password', 'We received a request to reset your password.', 'Choose a new password'],
  })],
  ['email_verification', makeActionEmail({
    nl: ['Bevestig je e-mailadres', 'E-mailadres bevestigen', 'Bevestig via de knop hieronder dat dit jouw e-mailadres is.', 'E-mailadres bevestigen'],
    en: ['Verify your email address', 'Verify email address', 'Use the button below to confirm that this email address belongs to you.', 'Verify email'],
  })],
  ['address_update', makeNotificationEmail({
    nl: {
      subject: '[Smoelenboek] Adreswijziging',
      heading: 'Wijziging van adres',
      body: (p) => `Je adres is gewijzigd naar: ${String(p.newAddress ?? '')}.`,
    },
    en: {
      subject: '[Smoelenboek] Address update',
      heading: 'Address update',
      body: (p) => `Your address has been updated to: ${String(p.newAddress ?? '')}.`,
    },
  })],
]);

export async function renderEmail(type: EmailMessageType, locale: EmailLocale, payload: Record<string, unknown>): Promise<RenderedEmail> {
  const renderer = renderers.get(type);
  if (!renderer) throw new Error(`No renderer registered for email type: ${type}`);
  return renderer(locale, payload);
}

const styles = {
  body: { backgroundColor: '#f4f7f5', color: '#17251d', fontFamily: 'Arial, sans-serif', padding: '32px 12px' },
  container: { backgroundColor: '#ffffff', border: '1px solid #dce7df', borderRadius: '12px', margin: '0 auto', maxWidth: '560px', padding: '36px' },
  brand: { color: '#166534', fontSize: '20px', margin: '0 0 28px' },
  heading: { fontSize: '28px', lineHeight: '1.25', margin: '0 0 20px' },
  text: { fontSize: '16px', lineHeight: '1.6' },
  action: { margin: '28px 0' },
  button: { backgroundColor: '#166534', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', padding: '13px 22px', textDecoration: 'none' },
  small: { color: '#52645a', fontSize: '13px', lineHeight: '1.5' },
  rule: { borderColor: '#dce7df', margin: '28px 0 18px' },
  footer: { color: '#708078', fontSize: '12px' },
} as const;
