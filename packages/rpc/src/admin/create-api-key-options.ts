export type CreateApiKeyOptions = {
  email?: string;
  userId?: string;
  name?: string;
  prefix?: string;
  expiresIn?: number;
  metadata?: unknown;
  rateLimitEnabled?: boolean;
  rateLimitMax?: number;
  rateLimitTimeWindow?: number;
  remaining?: number;
};

const BOOLEAN_VALUES = new Map<string, boolean>([
  ['true', true],
  ['false', false],
]);

export function parseCreateApiKeyArgs(argv: string[]): CreateApiKeyOptions {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current) {
      throw new Error(`Missing argument at index ${index}.`);
    }

    if (current === '--') {
      continue;
    }

    if (!current.startsWith('--')) {
      throw new Error(`Unexpected argument: ${current}`);
    }

    const key = current.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}.`);
    }

    values.set(key, value);
    index += 1;
  }

  const email = readOptionalValue(values, 'email')?.toLowerCase();
  const userId = readOptionalValue(values, 'user-id');

  if (!email && !userId) {
    throw new Error('Either --email or --user-id is required.');
  }

  if (email && userId) {
    throw new Error('Use either --email or --user-id, not both.');
  }

  if (email && !email.includes('@')) {
    throw new Error('--email must be a valid email address.');
  }

  return {
    email,
    userId,
    name: readOptionalValue(values, 'name'),
    prefix: readOptionalValue(values, 'prefix'),
    expiresIn: readOptionalNumber(values, 'expires-in'),
    metadata: readOptionalJson(values, 'metadata'),
    rateLimitEnabled: readOptionalBoolean(values, 'rate-limit-enabled'),
    rateLimitMax: readOptionalNumber(values, 'rate-limit-max'),
    rateLimitTimeWindow: readOptionalNumber(values, 'rate-limit-window'),
    remaining: readOptionalNumber(values, 'remaining'),
  };
}

function readOptionalValue(
  values: Map<string, string>,
  key: string,
): string | undefined {
  const value = values.get(key)?.trim();

  return value || undefined;
}

function readOptionalNumber(
  values: Map<string, string>,
  key: string,
): number | undefined {
  const raw = readOptionalValue(values, key);

  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`--${key} must be a positive integer or 0.`);
  }

  return parsed;
}

function readOptionalBoolean(
  values: Map<string, string>,
  key: string,
): boolean | undefined {
  const raw = readOptionalValue(values, key);

  if (!raw) {
    return undefined;
  }

  const value = BOOLEAN_VALUES.get(raw.toLowerCase());

  if (value === undefined) {
    throw new Error(`--${key} must be true or false.`);
  }

  return value;
}

function readOptionalJson(
  values: Map<string, string>,
  key: string,
): unknown {
  const raw = readOptionalValue(values, key);

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`--${key} must be valid JSON.`);
  }
}
