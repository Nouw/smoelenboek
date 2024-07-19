import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as process from 'process';

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: 'https://79aa4f927c9f835dfc57d2eae92c246e@o4506486770040832.ingest.us.sentry.io/4507627797348352',
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  enabled: process.env.BACKEND_ENVIRONMENT_MODE === 'production',
});
