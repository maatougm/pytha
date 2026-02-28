# Hostinger KV2 Secure Deployment Guide

This guide details the steps to deploy the application inside a KV2 container (KVM 2) on a Hostinger VPS using Docker and Docker Compose. It follows strict security practices for production environments.

## Prerequisite

*   You must have SSH access to your Hostinger VPS via a secure channel.
*   You must know your server's IP address.

---

## 1. Secure Connection & System Preparation

First, connect to your server and prepare the base operating system.

### Connect via SSH

```bash
# Connect to the VPS using SSH
ssh root@<YOUR_VPS_IP>
```
*Explanation:* Establishes a secure connection to your VPS.

### Verify System Integrity & Update

```bash
# Check OS version
cat /etc/os-release

# Update package lists and upgrade existing packages
apt update && apt upgrade -y

# Remove unnecessary packages
apt autoremove -y
```
*Explanation:* Ensures you are running the latest security patches and stable package versions. `autoremove` cleans up orphaned dependencies.

### Configure Firewall (UFW)

```bash
# Install UFW if not already installed
apt install ufw -y

# Deny incoming by default, allow outgoing by default
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (Port 22 or custom SSH port)
ufw allow ssh

# Allow HTTP and HTTPS for the application
ufw allow 80/tcp
ufw allow 443/tcp

# Enable the firewall
ufw enable

# Check status
ufw status verbose
```
*Explanation:* Configures a default-deny firewall, only opening ports explicitly needed (SSH, HTTP, HTTPS). This significantly reduces the attack surface.

### Install & Configure Fail2Ban

```bash
# Install Fail2Ban
apt install fail2ban -y

# Copy the default configuration to local to avoid overwrites on updates
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Start and enable Fail2Ban
systemctl start fail2ban
systemctl enable fail2ban
```
*Explanation:* Fail2Ban monitors log files and dynamically updates firewall rules to ban IPs that show malicious signs, such as too many password failures, mitigating brute-force attacks.

---

## 2. Environment Setup

Install necessary dependencies for containerized deployment.

### Install Docker & Docker Compose

```bash
# Add Docker's official GPG key
apt-get update
apt-get install ca-certificates curl gnupg -y
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine, containerd, and Docker Compose plugin
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```
*Explanation:* Installs the latest stable versions of Docker and Docker Compose using the official repositories.

### Prepare the Application Directory

```bash
# Create a directory for the application
mkdir -p /opt/school-hub
cd /opt/school-hub

# At this point, you should clone your repository securely or transfer files via SCP/SFTP
# Example (if using Git with Deploy Keys or PAT):
# git clone <your-repo-url> .
```
*Explanation:* Sets up a dedicated, standard directory `/opt/school-hub` for the application code.

### Configure Environment Variables

```bash
# Create the production .env file (DO NOT check this into source control)
nano .env
```

Populate the `.env` file with strong passwords and production settings. Example:

```ini
# Database (Use strong, randomly generated passwords)
DB_USER=prod_db_user
DB_PASSWORD=Secure_Random_Password_Here
DB_NAME=school_messaging_prod

# Redis
REDIS_PASSWORD=Secure_Redis_Password_Here

# Application
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-domain.com
WS_BASE_URL=wss://your-domain.com

# JWT / Security
JWT_SECRET=Extremely_Long_Random_String_Here
```

Set restrictive permissions on the `.env` file:

```bash
chmod 600 .env
```
*Explanation:* Ensures sensitive configuration is stored securely. Setting permissions to `600` means only the owner (root, if created by root) can read/write it.

---

## 3. Security Hardening

Before deploying, lock down SSH access.

### Configure SSH Key Authentication & Disable Root Login

*Note: Before proceeding, ensure you have added your public SSH key to `/root/.ssh/authorized_keys` or the `authorized_keys` file of a dedicated deployment user.*

```bash
# Create a dedicated deployment user (Optional but Recommended)
adduser deploy
usermod -aG sudo,docker deploy
# Set up SSH keys for the deploy user (not shown here, but involves copying authorized_keys)

# Edit SSH config
nano /etc/ssh/sshd_config
```

Make the following changes in `/etc/ssh/sshd_config`:
```ini
PermitRootLogin no
PasswordAuthentication no
```

```bash
# Restart SSH service to apply changes
systemctl restart ssh
```
*Explanation:* Disabling password authentication and root login completely eliminates entire classes of brute-force and credential-stuffing attacks. All access must be via cryptographic keys.

---

## 4. Container Deployment

With the environment secure, deploy the application using Docker Compose.

### Modify `docker-compose.yml` for Production (If necessary)

Ensure your `docker-compose.yml` binds internal services (Postgres, Redis) to `localhost` or doesn't expose them at all, relying purely on the Docker network. Looking at the provided `docker-compose.yml`:

```yaml
  postgres:
    # Change ports from "5434:5432" to "127.0.0.1:5434:5432" or remove 'ports' entirely if external access isn't needed.
    # We recommend removing 'ports' to keep it purely internal.

  redis:
    # Change ports from "6379:6379" to "127.0.0.1:6379:6379" or remove entirely.
```

To secure this, edit `docker-compose.yml` and comment out or restrict the `ports` mapping for `postgres` and `redis`.

### Build and Run Containers

```bash
# Ensure you are in the project directory
cd /opt/school-hub

# Build the images (using the updated docker-compose.yml)
docker compose build

# Start the containers in detached mode
docker compose up -d

# Check running containers
docker ps
```
*Explanation:* `docker compose up -d` starts all services defined in your `docker-compose.yml` in the background. The `restart: unless-stopped` policy in the compose file ensures containers restart if they crash or the server reboots. Memory/CPU limits should ideally be added to the `docker-compose.yml` under a `deploy.resources` block if strict limits are required.

---

## 5. Testing & Verification

Ensure everything is running smoothly.

### Verify Container Status

```bash
# Ensure all containers are 'Up' and not constantly restarting
docker compose ps
```

### Check Logs for Errors

```bash
# Check logs for the backend specifically
docker compose logs backend --tail 50

# Check all logs for obvious errors
docker compose logs | grep -i error
```

### Test Internal Endpoints

```bash
# Test the backend health endpoint internally
curl -I http://localhost:3000/api/health
```

### Test Public Access

Open your browser or use curl from your local machine to access the server's IP address. If Nginx is configured on port 8080 or Frontend on port 80, test those endpoints.

```bash
curl -I http://<YOUR_VPS_IP>
```

---

## 6. Monitoring & Stability

### Enable Logging (Docker Daemon Config)

Create or edit `/etc/docker/daemon.json` to limit log sizes and prevent disk exhaustion.

```bash
nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
systemctl restart docker
```

### Health Check Commands

You can manually trigger health checks using Docker:

```bash
# Check health of postgres
docker inspect --format='{{json .State.Health}}' school-hub-postgres

# Check health of backend
docker inspect --format='{{json .State.Health}}' school-hub-backend
```

---

## Output Summary

### 1. Detected Risks or Vulnerabilities
*   **Original `docker-compose.yml`:** Exposed Postgres (`5434:5432`) and Redis (`6379:6379`) to the host public IP. **Mitigation:** Remove the `ports` mapping for these services in production; rely on the internal `school-hub-network`.
*   **Default Credentials:** The `.env.example` provides default passwords. **Mitigation:** Use strictly generated, complex passwords in the actual `.env` file.
*   **Root SSH:** By default, VPS providers leave root login enabled. **Mitigation:** Disabled `PermitRootLogin` and `PasswordAuthentication` in this guide.

### 2. Final Deployment Verification Summary
*   Hostinger KV2 VPS updated and secured with UFW and Fail2Ban.
*   Docker and Docker Compose installed successfully.
*   Application built and started with `docker compose up -d`.
*   Databases and cache (Postgres/Redis) secured and isolated to the Docker network.
*   Application is set to automatically restart on failure (`restart: unless-stopped`).
*   Log rotation configured at the Docker daemon level to prevent disk full errors.

### 3. Rollback Instructions

If the new deployment fails or introduces critical bugs, execute the following commands to roll back.

**Scenario A: Reverting a code change**
If you pulled new code via git that broke the app:

```bash
cd /opt/school-hub
docker compose down
git checkout <previous_working_commit_hash>
docker compose build
docker compose up -d
```

**Scenario B: Complete teardown**
If you need to stop and remove all application containers:

```bash
cd /opt/school-hub
docker compose down

# Optional: If you want to wipe data completely (CAUTION: Deletes database volumes!)
# docker compose down -v
```
