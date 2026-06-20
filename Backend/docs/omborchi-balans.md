# Omborchi Balans API Docs

Base URL: `http://localhost:5000`

## Talab

- Faqat login qilgan `omborchi` uchun ochiq
- Header: `Authorization: Bearer JWT_TOKEN`
- Token: `/api/auth/omborchi/login`

## Hisoblash

```
kirimlar (jami) − chiqimlar (rejected dan tashqari) = ombordagi qoldiq
```

1 tonna = 1000 kg

## Endpoint

Omborchining omborida qancha ko'mir borligi.

- **Method:** `GET`
- **URL:** `/api/omborchi-balans`

**Javob:**

```json
{
  "success": true,
  "data": {
    "kg": 12500,
    "ton": 12.5
  }
}
```

## Xatoliklar

- `401` — token yo'q yoki noto'g'ri
