# Authentication Test Credentials

## Test User Accounts

All users are set up in the `analytics_users` collection with the following credentials:

### Admin User

- **Email:** `admin@example.com`
- **Password:** `adminpassword123`
- **Role:** admin
- **Permissions:** Full access to all features

### Editor User

- **Email:** `editor@example.com`
- **Password:** `editorpassword123`
- **Role:** editor
- **Permissions:** Can read and write analytics data, read/write settings, limited user management

### Viewer User

- **Email:** `viewer@example.com`
- **Password:** `viewerpassword123`
- **Role:** viewer
- **Permissions:** Read-only access to analytics data and settings

### Test Users

- **Email:** `testuser@example.com`
- **Password:** `testpassword123`
- **Role:** viewer

- **Email:** `newuser3@example.com`
- **Password:** `testpassword123`
- **Role:** viewer

## Login URLs

- **Login Page:** http://localhost:3000/login
- **Auth Test Page:** http://localhost:3000/auth-test

## Testing Notes

The authentication system is fully functional. All users can be created via the registration form or API. The login issue with `viewer@example.com` was due to using the wrong password (`password123` instead of `viewerpassword123`).

## API Testing Examples

### Register a new user:

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register",
    "email": "newuser@example.com",
    "password": "newpassword123",
    "role": "viewer"
  }'
```

### Login:

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "viewer@example.com",
    "password": "viewerpassword123"
  }'
```

### Verify token:

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verify",
    "token": "YOUR_TOKEN_HERE"
  }'
```
