# 🚀 API Quick Reference - مرجع سريع

## Base URLs
```
Local:      http://localhost:3000
Production: https://manual-reporter-input-backend.onrender.com
```

---

## 📋 All Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/health` | API health check |

### Manual Input - GET
| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/manual-input/categories` | Get active categories | Array of categories |
| GET | `/api/manual-input/sources` | Get all sources (text, audio, video) | Object with text/audio/video |
| GET | `/api/manual-input/source/text` | Get text source only | Single source object |
| GET | `/api/manual-input/media-units` | Get media units | Array of media units |
| GET | `/api/manual-input/users` | Get all users | Array of users |
| GET | `/api/manual-input/pending-files` | Get pending files | Array of files |

### Manual Input - POST
| Method | Endpoint | Content-Type | Description |
|--------|----------|--------------|-------------|
| POST | `/api/manual-input/submit` | `application/json` | Submit text news |
| POST | `/api/manual-input/upload-audio` | `multipart/form-data` | Upload audio file |
| POST | `/api/manual-input/upload-video` | `multipart/form-data` | Upload video file |
| POST | `/api/manual-input/upload-image` | `multipart/form-data` | Upload image file |

---

## 🔥 Quick Examples

### Get Categories
```bash
curl http://localhost:3000/api/manual-input/categories
```

### Submit News
```bash
curl -X POST http://localhost:3000/api/manual-input/submit \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": 14,
    "source_type_id": 6,
    "category_id": 1,
    "url": null,
    "title": "عنوان الخبر (20 حرف+)",
    "content": "محتوى الخبر (100 حرف+)...",
    "tags": [],
    "fetch_status": "fetched",
    "created_by": 50,
    "media_unit_id": 1
  }'
```

### Upload Image
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-image \
  -F "file=@photo.jpg" \
  -F "uploaded_by=50" \
  -F "media_unit_id=1" \
  -F "title=Photo Title"
```

---

## 📊 Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## ⚡ Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

---

## 📝 Validation Rules
- **Title:** 20 chars minimum
- **Content:** 100 chars minimum
- **Audio:** Max 50 MB (MP3, M4A, WAV, WebM, OGG)
- **Video:** Max 500 MB (MP4, WebM, MOV, AVI)
- **Image:** Max 10 MB (JPG, PNG, GIF, WebP)

---

**Full Documentation:** See `API_DOCUMENTATION.md`
