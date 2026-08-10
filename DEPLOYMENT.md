# Deployment

Deploys automatically on every push to `main` that produces a new semantic version (conventional commits).

## How it works

1. **CI** (`ci.yml`) — build + test on every push and PR
2. **Release** (`release.yml`, on push to `main`) — semantic-release bumps version, creates git tag + GitHub Release, builds Docker images for `web` and `rpc`, pushes them to GHCR, then SSHes into Proxmox to deploy

## Versioning

Uses [Conventional Commits](https://www.conventionalcommits.org/):

| Commit prefix                           | Version bump          |
| --------------------------------------- | --------------------- |
| `fix:`                                  | patch (1.0.0 → 1.0.1) |
| `feat:`                                 | minor (1.0.0 → 1.1.0) |
| `feat!:` or `BREAKING CHANGE:`          | major (1.0.0 → 2.0.0) |
| `chore:`, `docs:`, `refactor:`, `test:` | no release            |

## One-time Proxmox setup

Run these once on the Proxmox VM/LXC that will host the app:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin

# 2. Create deploy user
useradd -m -s /bin/bash deploy
mkdir -p /home/deploy/.ssh
# Paste the deploy public key (generated below) into:
nano /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# 3. Allow deploy user to run docker without sudo
usermod -aG docker deploy

# 4. Create app directory
mkdir -p /opt/smoelenboek
chown deploy:deploy /opt/smoelenboek
```

Create environment files in `/opt/smoelenboek/`:

**`.env.rpc`**

```env
DATABASE_URL=postgresql://smoelenboek:YOURPASSWORD@db:5432/smoelenboek
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=https://api.your-domain.com/api/auth
WEB_ORIGIN=https://your-domain.com
PORT=3000
NEVOBO_BASE_URL=https://api.nevobo.nl
NEVOBO_ASSOCIATION_ID=ckl9y0t
PROTOTOTO_SYNC_INTERVAL_MS=900000
OCI_REGION=eu-amsterdam-1
OCI_TENANCY_OCID=ocid1.tenancy...
OCI_USER_OCID=ocid1.user...
OCI_FINGERPRINT=aa:bb:cc:...
OCI_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
OCI_OBJECT_STORAGE_NAMESPACE=your-namespace
OCI_OBJECT_STORAGE_BUCKET=your-bucket
```

**`.env.web`**

```env
NEXT_PUBLIC_TRPC_URL=https://api.your-domain.com/trpc
NEXT_PUBLIC_AUTH_URL=https://api.your-domain.com
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=https://api.your-domain.com/api/auth
```

`NEXT_PUBLIC_*` values are embedded into the browser bundle during
`next build`. The production values are passed as Docker build arguments in
`.github/workflows/release.yml`; setting them only in `.env.web` cannot change
an image that has already been built. Keep the two locations aligned when the
API hostname changes.

For a manual web image build, pass both required arguments:

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_AUTH_URL=https://api.your-domain.com \
  --build-arg NEXT_PUBLIC_TRPC_URL=https://api.your-domain.com/trpc \
  .
```

**`.env.db`**

```env
POSTGRES_DB=smoelenboek
POSTGRES_USER=smoelenboek
POSTGRES_PASSWORD=YOURPASSWORD
```

## GitHub secrets

Add these in Settings → Secrets → Actions:

| Secret            | Value                              |
| ----------------- | ---------------------------------- |
| `DEPLOY_SSH_HOST` | Proxmox server IP or hostname      |
| `DEPLOY_SSH_USER` | `deploy`                           |
| `DEPLOY_SSH_KEY`  | Contents of the deploy private key |
| `DEPLOY_SSH_PORT` | SSH port (optional, default `22`)  |

## Generate deploy SSH key pair

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
# deploy_key.pub → paste into Proxmox ~/.ssh/authorized_keys
# deploy_key     → paste into GitHub secret DEPLOY_SSH_KEY
```

## Manual deploy (emergency)

```bash
ssh deploy@your-proxmox-ip
cd /opt/smoelenboek
VERSION=1.2.3 REPO_OWNER=your-github-username docker compose -f docker-compose.prod.yml pull
VERSION=1.2.3 REPO_OWNER=your-github-username docker compose -f docker-compose.prod.yml up -d --wait db
VERSION=1.2.3 REPO_OWNER=your-github-username docker compose -f docker-compose.prod.yml run --rm --no-deps rpc node dist/migrate.js
VERSION=1.2.3 REPO_OWNER=your-github-username docker compose -f docker-compose.prod.yml up -d
```

The database must be healthy before migrations run. Run migrations through the
Compose `rpc` service so the container can resolve the internal `db` hostname.
