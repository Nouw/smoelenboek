import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EmailOutboxRepository } from './email-outbox.repository';
import { SmtpEmailSender } from './smtp-email.sender';

@Injectable()
export class EmailOutboxProcessor implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  constructor(private readonly outbox: EmailOutboxRepository, private readonly sender: SmtpEmailSender) {}
  onModuleInit(): void { this.trigger(); this.timer = setInterval(() => this.trigger(), 10_000); this.timer.unref(); }
  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); this.timer = null; }
  private trigger(): void { void this.drain().catch((error) => console.error(JSON.stringify({ event: 'email.outbox_sweep_failed', error: errorMessage(error) }))); }
  async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (const message of await this.outbox.claim()) {
        try {
          const deliverable = await this.outbox.refreshExpiringInvitation(message);
          await this.sender.send(deliverable);
          await this.outbox.markSent(message.id);
          console.info(JSON.stringify({ event: 'email.sent', messageId: message.id, messageType: message.messageType, attempts: message.attempts + 1 }));
        } catch (error) {
          await this.outbox.markDeliveryFailure(message, errorMessage(error));
          console.warn(JSON.stringify({ event: 'email.delivery_failed', messageId: message.id, messageType: message.messageType, attempts: message.attempts + 1 }));
        }
      }
    } finally { this.running = false; }
  }
}
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
