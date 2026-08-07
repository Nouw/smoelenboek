import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';
import { createElement } from 'react';

export default function InvitationPreview() {
  return createElement(Html, null,
    createElement(Head), createElement(Preview, null, 'Activeer je Smoelenboek-account'),
    createElement(Body, { style: { background: '#f4f7f5', fontFamily: 'Arial, sans-serif', padding: 32 } },
      createElement(Container, { style: { background: '#fff', border: '1px solid #dce7df', borderRadius: 12, maxWidth: 560, padding: 36 } },
        createElement(Heading, { style: { color: '#166534', fontSize: 20 } }, 'Smoelenboek'),
        createElement(Heading, { as: 'h2' }, 'Welkom bij Smoelenboek'),
        createElement(Text, null, 'Hallo Voorbeeldlid,'),
        createElement(Text, null, 'Je account is aangemaakt. Kies via de knop hieronder je wachtwoord.'),
        createElement(Section, { style: { margin: '28px 0' } }, createElement(Button, { href: 'http://localhost:3002/api/auth/reset-password/example', style: { background: '#166534', borderRadius: 8, color: '#fff', fontWeight: 'bold', padding: '13px 22px' } }, 'Wachtwoord instellen')),
        createElement(Hr), createElement(Text, { style: { color: '#708078', fontSize: 12 } }, 'Smoelenboek'),
      ),
    ),
  );
}
