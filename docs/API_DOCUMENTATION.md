# API Documentation

Base URL: `http://localhost:5000/api`

Interactive docs: http://localhost:5000/api/docs

## Authentication

All protected endpoints require `Authorization: Bearer <token>` header.

## Response Format

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error:**
```json
{ "success": false, "message": "...", "errors": [] }
```

## Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register provider |
| POST | `/auth/login` | No | Provider login |
| POST | `/auth/admin/login` | No | Admin login |
| GET | `/auth/me` | Yes | Current user |
| GET | `/auth/google` | No | Google OAuth redirect |
| GET | `/auth/google/callback` | No | Google OAuth callback |

### Provider
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/providers/profile` | Provider | Get profile + completion % |
| PUT | `/providers/profile` | Provider | Update profile |
| POST | `/providers/profile/photo` | Provider | Upload profile photo |
| POST | `/providers/documents` | Provider | Upload document |
| DELETE | `/providers/documents/:id` | Provider | Delete document |
| POST | `/providers/application/submit` | Provider | Submit application |
| GET | `/providers/application` | Provider | Get application |
| GET | `/providers/application/history` | Provider | Status history |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/providers` | Admin | List providers (paginated) |
| GET | `/admin/providers/:id` | Admin | Provider detail |
| PATCH | `/admin/providers/:id/status` | Admin | Update status |
| PATCH | `/admin/providers/:id/approve` | Admin | Approve |
| PATCH | `/admin/providers/:id/reject` | Admin | Reject with remarks |
| GET | `/admin/statistics` | Admin | Dashboard stats |

### Categories
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | No | List categories |
| POST | `/categories` | Admin | Create category |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |

### Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Yes | List notifications |
| PATCH | `/notifications/:id/read` | Yes | Mark as read |
| PATCH | `/notifications/read-all` | Yes | Mark all read |

### Uploads
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/uploads/profile/:filename` | Yes | View profile photo |
| GET | `/uploads/document/:id` | Yes | View/download document |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |

## Pagination

`GET /admin/providers?page=1&limit=10&search=john&status=submitted&category=<id>&city=Mumbai`

Response includes:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 53, "totalPages": 6 }
}
```

## Status Transitions

- `draft` → `submitted`
- `submitted` → `under_review`
- `under_review` → `approved` | `rejected`
- `rejected` → `submitted` (resubmit)
