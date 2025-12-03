# Hosting the Voucher Automation Platform on Proxmox

This guide walks through three phases:

1. Publish the project to GitHub.
2. Stand up a Proxmox guest (VM or LXC) and deploy the Docker stack defined in `docker-compose.yml`.
3. Keep the running instance in sync with future changes via Git.

> These steps assume your local workstation is Windows (as in this workspace) and your Proxmox host already exists on your network.

---

## 1. Upload the App to GitHub

1. **Create a GitHub repository.**
   - Go to <https://github.com/new>, name it (e.g., `voucher-automation-platform`), keep it private or public, and leave it empty.

2. **Initialize Git locally (if not already).**
   ```powershell
   cd "C:\Users\USER\Documents\Inventory Management"
   git init
   git status
   ```

3. **Add the remote and configure Git.**
   ```powershell
   git remote add origin https://github.com/<your-user>/<repo-name>.git
   git config user.name "Your Name"
   git config user.email "you@example.com"
   ```

4. **Commit the existing project.**
   ```powershell
   git add .
   git commit -m "Initial commit"
   ```

5. **Push to GitHub.**
   ```powershell
   git branch -M main
   git push -u origin main
   ```

6. **Verify on GitHub** that the repository contains `client/`, `server/`, `docker-compose.yml`, etc. You will pull from this repo on the Proxmox guest.

---

## 2. Deploy on Proxmox

### 2.1. Create a Guest

You can deploy inside either a VM (recommended for simplicity) or an LXC container. Below assumes a Debian/Ubuntu VM.

1. In the Proxmox UI, click **Create VM** → attach a Debian 12 ISO → choose 2 vCPU / 4 GB RAM / 40 GB disk (adjust as needed).
2. Attach to bridge `vmbr0` (or whatever LAN bridge you use) and enable the QEMU guest agent.
3. Install the OS, set a static IP (or reserve via DHCP), and SSH into the VM once it reboots.

### 2.2. Install Docker & Git in the Guest

```bash
ssh root@<vm-ip>
apt update && apt upgrade -y
apt install -y git ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
printf "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable\n" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
```

### 2.3. Pull Your Repository

```bash
mkdir -p /opt/voucher-app
cd /opt/voucher-app
git clone https://github.com/<your-user>/<repo-name>.git .
```

> If the repo is private, create a GitHub PAT and run `git clone https://<token>@github.com/<user>/<repo>.git` or set up SSH keys.

### 2.4. Configure Environment Files

```bash
cp server/.env.example server/.env
nano server/.env   # update JWT_SECRET, DATABASE_URL, PORT

cp client/.env.example client/.env
nano client/.env   # set VITE_API_URL to http://<vm-ip>:4000 or to your reverse-proxy URL
```

- The default `DATABASE_URL="file:./dev.db"` uses SQLite inside the backend container volume. No extra DB is required for local/LAN hosting.

### 2.5. Launch with Docker Compose

```bash
cd /opt/voucher-app
docker compose pull            # optional if images exist remotely
docker compose up -d --build   # builds backend + frontend and starts them
```

- Frontend default port: `5173`
- Backend default port: `4000`
- Verify services:
  ```bash
  docker compose ps
  docker compose logs -f server
  docker compose logs -f client
  ```
- Browse to `http://<vm-ip>:5173` from any device on the same network.

### 2.6. Optional Reverse Proxy & TLS

If you want a friendly URL (e.g., `https://voucher.local`):
1. Deploy Nginx/Traefik (either on the same VM or another) and point it at the frontend container (port 5173).
2. Add a DNS entry (local DNS or hosts file) that resolves `voucher.local` to the VM IP.
3. Terminate SSL via Lets Encrypt (if the host is reachable from the internet) or use self-signed certificates for LAN-only deployments.

### 2.7. Persistence & Backups

- Data lives in Docker volumes declared in `docker-compose.yml` (e.g., the SQLite DB volume). List them with `docker volume ls`.
- To back up the DB volume:
  ```bash
  docker run --rm -v inventory-management_data:/data -v /root/backups:/backup alpine \
    tar czf /backup/sqlite-$(date +%F).tar.gz -C /data .
  ```
- Use Proxmox VM snapshots or vzdump backups for full-system recovery.

---

## 3. Keeping the Server in Sync

### 3.1. Local Development Workflow

1. Make changes locally (IDE, tests, `npm run build`, etc.).
2. Commit and push:
   ```powershell
   git add .
   git commit -m "Describe change"
   git push
   ```

### 3.2. Update the Proxmox Instance

SSH into the VM and pull/redeploy:
```bash
ssh root@<vm-ip>
cd /opt/voucher-app
git pull origin main
# Rebuild containers so the changes take effect
docker compose up -d --build
```

- `docker compose up -d --build` rebuilds images in place. If only static assets changed and you want cleaner builds, run `docker compose down` first, then `docker compose up -d --build`.
- Check logs to confirm the new version is running.

### 3.3. Automation Options

- **Shell script**: add `/usr/local/bin/deploy.sh` that runs the commands above, then invoke it manually or via cron (`@daily /usr/local/bin/deploy.sh`).
- **GitHub Actions**: set up a workflow that SSHes into the VM and executes the deploy script after each push to `main`.
- **Watchtower/CI**: if you publish Docker images to a registry, configure Watchtower to pull the latest tags automatically. For this repo-based approach, a simple `git pull` is usually enough.

### 3.4. Rollbacks

If a deployment fails:
1. `git checkout` the previous commit locally, push it, then `git pull` on the server.
2. Or, on the server: `git checkout <last-working-sha>` and `docker compose up -d --build`.
3. Proxmox backups can restore the entire VM if necessary.

---

## 4. Quick Reference Commands

```bash
# On the Proxmox guest
cd /opt/voucher-app

# Start/stop
docker compose up -d
docker compose stop

# Update from GitHub
git pull origin main
docker compose up -d --build

# Logs
docker compose logs -f server
docker compose logs -f client

# Backups (example volume name)
docker run --rm -v inventory-management_data:/data -v /root/backups:/backup alpine \
  tar czf /backup/sqlite-$(date +%F).tar.gz -C /data .
```

This documentation lives in `PROXMOX_DEPLOYMENT.md`; update it whenever the deployment topology changes (e.g., migrating from SQLite to Postgres or adding HTTPS).
