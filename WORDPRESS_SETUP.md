# WordPress Installation Guide for JobSparkAI

This guide will help you install WordPress at `/blog` on your Lightsail instance.

## Prerequisites
- SSH access to your Lightsail server
- Root/sudo access
- MySQL/MariaDB installed
- Nginx installed

## Step 1: SSH into Lightsail

```bash
ssh -i your-key.pem ubuntu@your-lightsail-ip
# or
ssh ubuntu@jobsparkai.com
```

## Step 2: Install WordPress

```bash
# Navigate to web root
cd /var/www

# Download WordPress
sudo wget https://wordpress.org/latest.tar.gz

# Extract to 'blog' directory
sudo tar -xzf latest.tar.gz
sudo mv wordpress blog

# Set proper permissions
sudo chown -R www-data:www-data /var/www/blog
sudo chmod -R 755 /var/www/blog

# Remove tar file
sudo rm latest.tar.gz
```

## Step 3: Create MySQL Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE wordpress_blog;
CREATE USER 'wordpress_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON wordpress_blog.* TO 'wordpress_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 4: Configure Nginx

Edit your Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/jobsparkai.com
```

Add this location block **BEFORE** your Next.js proxy configuration:

```nginx
# WordPress blog
location /blog {
    alias /var/www/blog;
    index index.php index.html;
    
    try_files $uri $uri/ /blog/index.php?$args;
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $request_filename;
    }
}

# Your existing Next.js configuration
location / {
    proxy_pass http://localhost:3000;
    # ... rest of your config
}
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Complete WordPress Installation

1. Visit: `https://jobsparkai.com/blog/`
2. Follow WordPress installation wizard
3. Enter database details:
   - Database Name: `wordpress_blog`
   - Username: `wordpress_user`
   - Password: (your secure password)
   - Host: `localhost`
   - Table Prefix: `wp_`

## Step 6: Configure WordPress Permalinks

After installation:

1. Login to WordPress admin: `https://jobsparkai.com/blog/wp-admin`
2. Go to Settings → Permalinks
3. Select "Post name" or "Custom Structure"
4. For custom, use: `/blog/%year%/%monthnum%/%day%/%postname%/`
5. Save changes

## Step 7: Update WordPress Site URL

In WordPress admin:
1. Settings → General
2. Set both URLs to: `https://jobsparkai.com/blog`
3. Save

## Step 8: Deploy Next.js Redirects

The `next.config.ts` has been updated with redirects. Deploy the changes:

```bash
# Commit changes
git add next.config.ts
git commit -m "Add WordPress blog redirects"
git push origin main

# SSH into server and rebuild
ssh ubuntu@jobsparkai.com
cd /var/www/jobsparkai
git pull
npm run build
pm2 restart jobsparkai
```

## Troubleshooting

### PHP not installed?
```bash
sudo apt update
sudo apt install php8.1-fpm php8.1-mysql php8.1-curl php8.1-gd php8.1-mbstring php8.1-xml
sudo systemctl start php8.1-fpm
```

### Permission issues?
```bash
sudo chown -R www-data:www-data /var/www/blog
sudo chmod -R 755 /var/www/blog
```

### Can't access /blog?
Check Nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

## Testing Redirects

After deployment, test these URLs:
- Old: `https://jobsparkai.com/2025/06/10/job-search-strategy-2025`
- New: `https://jobsparkai.com/blog/2025/06/10/job-search-strategy-2025`

The old URL should automatically redirect to the new one.
