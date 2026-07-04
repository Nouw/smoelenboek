export type CreateUserOptions = {
  email: string;
  password: string;
  name: string;
};

export function parseCreateUserArgs(argv: string[]): CreateUserOptions {
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

  const email = readRequiredValue(values, 'email').toLowerCase();
  const password = readRequiredValue(values, 'password');
  const name = readRequiredValue(values, 'name');

  if (!email.includes('@')) {
    throw new Error('--email must be a valid email address.');
  }

  if (password.length < 8) {
    throw new Error('--password must be at least 8 characters.');
  }

  return {
    email,
    password,
    name,
  };
}

function readRequiredValue(values: Map<string, string>, key: string): string {
  const value = values.get(key)?.trim();

  if (!value) {
    throw new Error(`--${key} is required.`);
  }

  return value;
}
