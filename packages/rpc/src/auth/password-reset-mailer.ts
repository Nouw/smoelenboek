export type PasswordResetMessage = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  url: string;
  token: string;
};

export interface PasswordResetMailer {
  send(message: PasswordResetMessage): Promise<void>;
}

export function createConsolePasswordResetMailer(
  logger: Pick<Console, 'info'> = console,
): PasswordResetMailer {
  return {
    async send({ user, url }) {
      logger.info(
        `[password-reset] To: ${user.email}\n                  URL: ${url}`,
      );
    },
  };
}
