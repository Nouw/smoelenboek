import { Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { shutdownRpcTelemetry } from './rpc-telemetry';

@Injectable()
class TelemetryLifecycle implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await shutdownRpcTelemetry();
  }
}

@Module({ providers: [TelemetryLifecycle] })
export class ObservabilityModule {}
