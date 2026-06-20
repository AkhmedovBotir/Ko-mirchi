# Auth API Docs

Base URL: `http://localhost:5000`

## 1) Admin login

- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Body:**

```json
{
  "username": "general1",
  "password": "123456"
}
```

## 2) Omborchi login

- **Method:** `POST`
- **URL:** `/api/auth/omborchi/login`
- **Body:**

```json
{
  "username": "jasur01",
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

## 3) Omborchi profile

- **Method:** `GET`
- **URL:** `/api/auth/omborchi/profile`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

- **Success Response (misol):**

```json
{
  "success": true,
  "data": {
    "_id": "6637fc933be7fc44ddf8f43a",
    "firstName": "Jasur",
    "lastName": "Toshpo'latov",
    "phone": "+998901234567",
    "username": "jasur01",
    "ombors": [
      {
        "_id": "6637fc933be7fc44ddf8f999",
        "name": "Markaziy ombor"
      },
      {
        "_id": "6637fc933be7fc44ddf8f888",
        "name": "Buloqboshi"
      }
    ],
    "createdAt": "2026-05-06T14:00:00.000Z",
    "updatedAt": "2026-05-06T14:00:00.000Z"
  }
}
```

## 4) Omborchi omborlari

Login qilgan omborchining o'ziga biriktirilgan omborlar ro'yxati.

- **Method:** `GET`
- **URL:** `/api/auth/omborchi/ombors`
- **Headers:** `Authorization: Bearer JWT_TOKEN`

- **Success Response (misol):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6637fc933be7fc44ddf8f999",
      "name": "Markaziy ombor",
      "createdAt": "2026-05-06T14:00:00.000Z",
      "updatedAt": "2026-05-06T14:00:00.000Z"
    },
    {
      "_id": "6637fc933be7fc44ddf8f888",
      "name": "Buloqboshi",
      "createdAt": "2026-05-06T14:00:00.000Z",
      "updatedAt": "2026-05-06T14:00:00.000Z"
    }
  ]
}
```

## 5) Omborchi parolni o'zgartirish

- **Method:** `PATCH`
- **URL:** `/api/auth/omborchi/change-password`
- **Headers:** `Authorization: Bearer JWT_TOKEN`
- **Body:**

```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

- **Success Response:**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Xatoliklar

- `400` - majburiy maydonlar yuborilmagan
- `400` - `newPassword must be at least 6 characters`
- `400` - `Old password is incorrect`
- `401` - login xato (`Invalid username or password`)
- `401` - token noto'g'ri yoki yuborilmagan (`Unauthorized` yoki `Invalid token`)
- `404` - `Omborchi not found`
