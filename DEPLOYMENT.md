# Deployment Checklist

## Pre-Deployment Security

### Environment Variables
- [ ] Generate strong `SESSION_SECRET` using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set `NODE_ENV=production`
- [ ] Update `MONGO_URI` with production MongoDB credentials
- [ ] Update `FRONTEND_URL` with production frontend domain
- [ ] Verify no `.env` files are committed to Git
- [ ] Add `.env` to `.gitignore`

### Session Configuration
- [ ] Set `cookie.secure: true` (requires HTTPS)
- [ ] Set `cookie.sameSite: 'strict'` or `'none'` based on deployment
- [ ] Configure appropriate session expiration (default: 24 hours)
- [ ] Verify `connect-mongo` session store is configured
- [ ] Test session persistence across server restarts

### Authentication & Passwords
- [ ] Change default admin password immediately
- [ ] Enforce strong password policy (min length, complexity)
- [ ] Verify bcrypt salt rounds (10+ for production)
- [ ] Test login/logout flow
- [ ] Verify session cookies are httpOnly

### Database Security
- [ ] Use MongoDB Atlas or secured MongoDB instance
- [ ] Enable MongoDB authentication
- [ ] Use strong database passwords (16+ characters, random)
- [ ] Whitelist only necessary IP addresses
- [ ] Enable TLS/SSL for MongoDB connections
- [ ] Set up database backups (daily recommended)
- [ ] Create database indexes (already in models)
- [ ] Test database connection pooling

### CORS Configuration
- [ ] Update CORS to allow only production frontend domain
- [ ] Remove wildcard (`*`) origins
- [ ] Set `credentials: true` for session cookies
- [ ] Test cross-origin requests

Example:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

### File Upload Security
- [ ] Validate file types (CSV only)
- [ ] Enforce file size limits (10MB default)
- [ ] Sanitize file names
- [ ] Consider virus scanning for uploads
- [ ] Implement rate limiting on upload endpoints
- [ ] Clean up temporary files after processing
- [ ] Set proper file permissions on upload directory

### API Security
- [ ] Implement rate limiting (recommended: 100 requests/15 minutes per IP)
- [ ] Add request size limits
- [ ] Validate all user inputs
- [ ] Sanitize error messages (no stack traces in production)
- [ ] Add request logging
- [ ] Monitor for suspicious activity

### HTTPS/TLS
- [ ] Obtain SSL/TLS certificate (Let's Encrypt, commercial CA)
- [ ] Configure HTTPS on web server
- [ ] Redirect HTTP to HTTPS
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Test SSL configuration (SSLLabs.com)

## Application Configuration

### Backend
- [ ] Build/transpile if needed
- [ ] Install production dependencies only (`npm ci --production`)
- [ ] Configure logging (Winston, Morgan, etc.)
- [ ] Set up error monitoring (Sentry, Rollbar, etc.)
- [ ] Configure health check endpoint
- [ ] Set appropriate memory limits
- [ ] Configure process manager (PM2, systemd)

Example PM2 configuration:
```javascript
module.exports = {
  apps: [{
    name: 'analyzer-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Update API URL to production backend
- [ ] Optimize assets (images, fonts)
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Test production build locally
- [ ] Minify JavaScript and CSS (done by Vite)

### Performance
- [ ] Enable gzip/brotli compression
- [ ] Configure response caching
- [ ] Set up MongoDB connection pooling
- [ ] Optimize database queries
- [ ] Add database indexes where needed
- [ ] Test with production-scale data
- [ ] Monitor memory usage
- [ ] Set up load balancing (if needed)

## Infrastructure

### Server Setup
- [ ] Choose hosting provider (AWS, DigitalOcean, Heroku, etc.)
- [ ] Configure firewall rules
- [ ] Set up reverse proxy (Nginx, Apache)
- [ ] Configure web server
- [ ] Set up process manager
- [ ] Configure automatic restarts
- [ ] Set up monitoring and alerts

### MongoDB
- [ ] Use MongoDB Atlas or managed service
- [ ] Configure replica set (recommended)
- [ ] Enable automated backups
- [ ] Set up monitoring
- [ ] Configure alerts for issues
- [ ] Test backup restoration

### DNS & Domain
- [ ] Configure DNS records
- [ ] Set up frontend domain
- [ ] Set up backend API domain (or subdomain)
- [ ] Wait for DNS propagation
- [ ] Test domain resolution

## Testing

### Pre-Deployment Testing
- [ ] Test all authentication flows
- [ ] Test user creation by admin
- [ ] Test CSV upload (various file sizes)
- [ ] Test metrics calculation accuracy
- [ ] Test leaderboard updates
- [ ] Test session expiration
- [ ] Test error handling
- [ ] Test with different browsers
- [ ] Test mobile responsiveness
- [ ] Load test with multiple concurrent users

### Post-Deployment Testing
- [ ] Verify HTTPS works
- [ ] Test session persistence
- [ ] Test file uploads
- [ ] Test database connectivity
- [ ] Test API endpoints
- [ ] Verify CORS configuration
- [ ] Test logout functionality
- [ ] Check browser console for errors
- [ ] Test with real data

## Monitoring & Maintenance

### Logging
- [ ] Configure application logs
- [ ] Set up log rotation
- [ ] Configure access logs
- [ ] Set up error logs
- [ ] Monitor log files regularly
- [ ] Set up log aggregation (optional)

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Monitor database performance
- [ ] Set up error alerting
- [ ] Monitor API response times
- [ ] Track user sessions

### Backups
- [ ] Database backups (daily)
- [ ] Application code backups
- [ ] Configuration backups
- [ ] Test backup restoration
- [ ] Document backup procedures

### Updates
- [ ] Plan regular dependency updates
- [ ] Monitor security advisories
- [ ] Test updates in staging first
- [ ] Document update procedures
- [ ] Keep MongoDB driver updated

## Documentation

- [ ] Document deployment process
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures
- [ ] Create admin user guide
- [ ] Create user guide
- [ ] Document API endpoints
- [ ] Keep changelog updated

## Compliance & Legal

- [ ] Review data privacy requirements (GDPR, etc.)
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Document data retention policy
- [ ] Set up user data export (if required)
- [ ] Set up user data deletion (if required)

## Quick Deploy Commands

### Backend
```bash
# Install dependencies
cd backend
npm ci --production

# Run database seed (one-time)
npm run seed

# Start with PM2
pm2 start server.js --name analyzer-backend -i 2

# Save PM2 configuration
pm2 save
pm2 startup
```

### Frontend
```bash
# Build production bundle
cd frontend
npm ci
npm run build

# Deploy to static hosting or serve with Nginx
# Example: Copy build/ to /var/www/analyzer
```

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/analyzer/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Final Checks

- [ ] All checklist items completed
- [ ] Tested in production-like environment
- [ ] Team trained on deployment process
- [ ] Rollback plan documented
- [ ] Emergency contacts documented
- [ ] Deployment scheduled during low-traffic period
- [ ] Monitoring alerts configured
- [ ] Backup verified before deployment

## Post-Deployment

- [ ] Verify application is accessible
- [ ] Check all features work
- [ ] Monitor error logs for first 24 hours
- [ ] Monitor performance metrics
- [ ] Verify backups are running
- [ ] Update team on deployment status
- [ ] Document any issues encountered
- [ ] Plan for next deployment

---

**Remember:** Always test in a staging environment before deploying to production!
