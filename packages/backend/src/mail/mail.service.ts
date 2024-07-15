import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as process from 'process';
import * as Mailgen from 'mailgen';
import { User } from '../users/entities/user.entity';
import { ResetToken } from '../auth/entities/reset-token.entity';
import { Content } from 'mailgen';

@Injectable()
export class MailService {
  private readonly color = '#d0211c';

  constructor() {}

  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  private mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Smoelenboek',
      link: 'https://smoelenboek.usvprotos.nl',
    },
  });

  async sendResetPassword(token: ResetToken) {
    const content: Content = {
      body: {
        greeting: `Beste ${token.user.firstName} ${token.user.lastName}`,
        intro: [
          'Er is zojuist een aanvraag gedaan om je wachtwoord te veranderen. ',
          'Heb je geen nieuw wachtwoord aangevraagd kan je deze mail als niet verzonden zien',
        ],
        action: [
          {
            instructions: '',
            button: {
              color: this.color,
              text: 'Wachtwoord instellen',
              link: `http://localhost:5173/auth/password/reset?token=${token.token}`, //TODO: change this to frontend
            },
          },
        ],
      },
    };

    return this.sendMail(content, token.user.email, 'Wachtwoord reset link');
  }

  // async sendWelcome(user: User) {
  //   const content: Content = {
  //     body: {
  //       greeting: `Beste ${user.firstName} ${user.lastName}`,
  //       intro: [
  //         'Je bent zojuist toegevoegd als lid van USV Protos in het online leden bestand. Hierbij ontvang je de link om je wachtwoord in te stellen',
  //       ],
  //       action: [
  //         {
  //           instructions: '',
  //           button: {
  //             color: '#d0211c',
  //             text: 'Wachtwoord instellen',
  //             link: 'https://smoelenboek.usvprotos.nl/password/reset',
  //           },
  //         },
  //       ],
  //     },
  //   };
  // }

  async sendMail(content: Content, to: string, subject: string) {
    const html = this.mailGenerator.generate(content);
    const text = this.mailGenerator.generatePlaintext(content);

    return this.transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      html,
      text,
    });
  }
}
