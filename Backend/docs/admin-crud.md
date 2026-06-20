# Admin CRUD API Docs

Base URL: `http://localhost:5000`

## Auth

### Login (general va admin uchun)

- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Body:**

```json
{
  "username": "general1",
  "password": "123456"
}
```

- **Success Response:**

```json
{
  "success": true,
  "token": "JWT_TOKEN"
}
```

## Admin Profile

### O'z ma'lumotini olish (general va admin)

- **Method:** `GET`
- **URL:** `/api/admins/me`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

## Admin CRUD (faqat general)

Quyidagi endpointlar faqat `role = general` bo'lgan admin uchun ochiq.

### 1) Admin yaratish

- **Method:** `POST`
- **URL:** `/api/admins`
- **Headers:** `Authorization: Bearer JWT_TOKEN`
- **Body:**

```json
{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "username": "aliadmin",
  "phone": "+998901112233",
  "password": "123456",
  "role": "admin"
}
```

### 2) Barcha adminlarni olish

- **Method:** `GET`
- **URL:** `/api/admins`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

### 3) Bitta adminni olish

- **Method:** `GET`
- **URL:** `/api/admins/:id`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

### 4) Adminni yangilash

- **Method:** `PATCH`
- **URL:** `/api/admins/:id`
- **Headers:** `Authorization: Bearer JWT_TOKEN`
- **Body (ixtiyoriy fieldlar):**

```json
{
  "firstName": "Ali",
  "lastName": "Valiyev",
  "username": "aliadmin2",
  "phone": "+998901110000",
  "role": "admin"
}
```

### 5) Adminni o'chirish

- **Method:** `DELETE`
- **URL:** `/api/admins/:id`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

## Admin modeli

- `firstName` (string, required)
- `lastName` (string, required)
- `username` (string, required, unique)
- `phone` (string, required)
- `password` (string, required, min 6, hash bo'lib saqlanadi)
- `role` (`general` yoki `admin`)

## CLI orqali admin yaratish

Terminalda quyidagini ishga tushiring:

```bash
npm run create-admin
```

Script sizdan quyidagilarni so'raydi:
- Ism
- Familiya
- Username
- Telefon
- Parol
- Role (`general` yoki `admin`)
