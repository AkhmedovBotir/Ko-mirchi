# Ombor Backend (Minimal Node.js)

`src` papkasiz, clean va minimal backend struktura.

## Ishga tushirish

1. Dependency o'rnatish:

```bash
npm install
```

2. Environment fayl yaratish:

```bash
copy .env.example .env
```

3. Development mode:

```bash
npm run dev
```

4. Production mode:

```bash
npm start
```

## Endpointlar

- `GET /` - API holatini qaytaradi
- `GET /api/health` - Health check

## Minimal struktura

- `server.js` - server start
- `app.js` - express app va middlewarelar
- `config/` - configlar
- `models/` - mongoose modellari
- `routes/` - routerlar
- `controllers/` - controllerlar
- `middlewares/` - global middlewarelar
