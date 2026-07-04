import { loadRpcEnv } from '../config/env';
import { createAdminBetterAuth } from '../auth/better-auth-instance';
import { parseCreateUserArgs } from './create-user-options';

type SignUpEmailResult = {
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

async function main(): Promise<void> {
  loadRpcEnv();

  const options = parseCreateUserArgs(process.argv.slice(2));
  const auth = await createAdminBetterAuth();
  const result = (await auth.api.signUpEmail({
    body: {
      email: options.email,
      password: options.password,
      name: options.name,
    },
  })) as SignUpEmailResult;

  if (!result.user) {
    throw new Error('Better Auth did not return a created user.');
  }

  console.log(
    JSON.stringify(
      {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to create user: ${message}`);
  process.exitCode = 1;
});
