import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';
import { toPlainText } from '@react-email/render';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { EmailLocale, EmailMessageType } from './entities/email-outbox.entity';

export type EmailTemplatePayload = { name: string; url: string };
export type RenderedEmail = { subject: string; html: string; text: string };

const copy = {
  nl: {
    invitation: ['Activeer je Smoelenboek-account', 'Welkom bij Smoelenboek', 'Je account is aangemaakt. Kies via de knop hieronder je wachtwoord.', 'Wachtwoord instellen'],
    password_reset: ['Stel je Smoelenboek-wachtwoord opnieuw in', 'Wachtwoord opnieuw instellen', 'We ontvingen een verzoek om je wachtwoord opnieuw in te stellen.', 'Nieuw wachtwoord kiezen'],
    email_verification: ['Bevestig je e-mailadres', 'E-mailadres bevestigen', 'Bevestig via de knop hieronder dat dit jouw e-mailadres is.', 'E-mailadres bevestigen'],
    ignore: 'Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.',
  },
  en: {
    invitation: ['Activate your Smoelenboek account', 'Welcome to Smoelenboek', 'Your account is ready. Use the button below to choose your password.', 'Set password'],
    password_reset: ['Reset your Smoelenboek password', 'Reset password', 'We received a request to reset your password.', 'Choose a new password'],
    email_verification: ['Verify your email address', 'Verify email address', 'Use the button below to confirm that this email address belongs to you.', 'Verify email'],
    ignore: 'If you did not request this, you can ignore this email.',
  },
} as const;

export async function renderEmail(type: EmailMessageType, locale: EmailLocale, payload: EmailTemplatePayload): Promise<RenderedEmail> {
  const language = copy[locale];
  const [subject, heading, introduction, action] = language[type];
  const tree = createElement(Html, null,
    createElement(Head),
    createElement(Preview, null, subject),
    createElement(Body, { style: styles.body },
      createElement(Container, { style: styles.container },
        createElement(Heading, { style: styles.brand }, 'Smoelenboek'),
        createElement(Heading, { as: 'h2', style: styles.heading }, heading),
        createElement(Text, { style: styles.text }, `${locale === 'nl' ? 'Hallo' : 'Hello'} ${payload.name},`),
        createElement(Text, { style: styles.text }, introduction),
        createElement(Section, { style: styles.action }, createElement(Button, { href: payload.url, style: styles.button }, action)),
        createElement(Text, { style: styles.small }, language.ignore),
        createElement(Hr, { style: styles.rule }),
        createElement(Text, { style: styles.footer }, 'Smoelenboek'),
      ),
    ),
  );
  const markup = renderToStaticMarkup(tree);
  const html = `<!DOCTYPE html>${markup}`;
  return { subject, html, text: toPlainText(html) };
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
