# Admin Panel - Marketplace Boshqaruv Tizimi

Bu loyiha marketplace va yetkazib berish tizimi uchun to'liq funksional admin panel hisoblanadi. React va Vite asosida qurilgan zamonaviy, responsive va foydalanuvchi do'st interfeysga ega.

## 📋 Mündarijat

- [Texnologiyalar](#texnologiyalar)
- [O'rnatish](#ornatish)
- [Ishga tushirish](#ishga-tushirish)
- [Loyiha Strukturasi](#loyiha-strukturasi)
- [Asosiy Funksiyalar](#asosiy-funksiyalar)
- [API Integratsiyasi](#api-integratsiyasi)
- [Komponentlar](#komponentlar)
- [Routing](#routing)
- [Xavfsizlik](#xavfsizlik)
- [Development](#development)

## 🛠 Texnologiyalar

### Asosiy Texnologiyalar
- **React 19.1.1** - UI kutubxonasi
- **Vite 7.1.7** - Build tool va dev server
- **React Router DOM 6.26.0** - Routing
- **Framer Motion 12.23.24** - Animatsiyalar

### UI Framework va Kutubxonalar
- **Material-UI (MUI) 7.3.4** - UI komponentlari va ikonlar
- **Emotion** - CSS-in-JS
- **Quill 1.3.7** - Rich text editor

### Development Tools
- **ESLint** - Code linting
- **Vite Plugin React** - React support

## 📦 O'rnatish

### Talablar
- Node.js (v18 yoki yuqori)
- npm yoki yarn

### Qadamlar

1. **Repository ni klon qiling:**
```bash
git clone <repository-url>
cd admin
```

2. **Dependencies ni o'rnating:**
```bash
npm install
```

3. **Environment o'zgaruvchilarini sozlang:**
`.env` fayl yarating va quyidagilarni qo'shing:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🚀 Ishga tushirish

### Development Mode
```bash
npm run dev
```
Loyiha `http://localhost:5173` da ochiladi.

### Production Build
```bash
npm run build
```
Build fayllar `dist/` papkasida yaratiladi.

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 📁 Loyiha Strukturasi

```
admin/
├── public/                 # Static fayllar
├── src/
│   ├── assets/            # Rasmlar, fontlar va boshqa assetlar
│   ├── components/        # Reusable komponentlar
│   │   ├── Admins/        # Admin komponentlari
│   │   ├── Agents/        # Agent komponentlari
│   │   ├── Archive/       # Arxiv komponentlari
│   │   ├── Dashboard/     # Dashboard komponentlari
│   │   ├── Finance/       # Moliya komponentlari
│   │   ├── KPI/           # KPI komponentlari
│   │   ├── Orders/        # Buyurtma komponentlari
│   │   ├── Regions/       # Region komponentlari
│   │   ├── Statistics/    # Statistika komponentlari
│   │   └── ...            # Boshqa komponentlar
│   ├── contexts/          # React Context API
│   │   ├── AuthContext.jsx
│   │   ├── SidebarContext.jsx
│   │   └── SnackbarContext.jsx
│   ├── pages/             # Sahifalar
│   │   ├── Admins/        # Adminlar sahifasi
│   │   ├── Agents/        # Agentlar sahifasi
│   │   ├── Archive/       # Arxiv sahifasi
│   │   ├── Finance/       # Moliya sahifalari
│   │   ├── KPI/           # KPI sahifalari
│   │   ├── Orders/        # Buyurtmalar sahifalari
│   │   ├── Statistics/    # Statistika sahifalari
│   │   └── ...            # Boshqa sahifalar
│   ├── services/          # API xizmatlari
│   │   └── api.js         # Barcha API funksiyalari
│   ├── utils/             # Utility funksiyalar
│   ├── App.jsx            # Asosiy App komponenti
│   ├── main.jsx           # Entry point
│   └── index.css          # Global CSS
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🎯 Asosiy Funksiyalar

### 1. Dashboard
- Umumiy statistika va ko'rsatkichlar
- So'nggi faolliklar
- Tezkor kirishlar

### 2. Tuzilmalar
- **Adminlar** - Admin foydalanuvchilarni boshqarish
- **Regionlar** - Viloyat, Tuman, MFY boshqaruvi
- **Kontragentlar** - Kontragentlar ro'yxati va boshqaruvi
- **Agentlar** - Agentlar boshqaruvi (Viloyat, Tuman, MFY agentlari)
- **Punktlar** - Punktlar boshqaruvi

### 3. Ombor
- **Kategoriyalar** - Mahsulot kategoriyalari
- **Mahsulotlar** - Mahsulotlar ro'yxati va boshqaruvi

### 4. Marketplace Mijozlar
- Foydalanuvchilar ro'yxati
- Foydalanuvchi ma'lumotlari
- Filterlar (viloyat, tuman, MFY, jins, telefon tasdiqlash)

### 5. Buyurtmalar
Tab navigatsiya bilan quyidagi buyurtma turlari:
- **Barcha buyurtmalar** - Umumiy ro'yxat
- **Marketplace buyurtmalari**
- **Punkt tomonidan tasdiqlangan**
- **Kontragentga so'ralgan**
- **Punktga yetkazilgan**
- **Agentga tayinlangan**
- **Agent tomonidan tasdiqlangan**
- **Mijoz tomonidan tasdiqlangan**
- **Bekor qilingan**

### 6. KPI Bonuslar
Tab navigatsiya bilan:
- **Statistika** - Umumiy KPI statistikasi
- **Transaksiyalar** - KPI to'lovlari
- **Viloyat Agentlari** - Viloyat agentlari KPI
- **Tuman Agentlari** - Tuman agentlari KPI
- **MFY Agentlari** - MFY agentlari KPI
- **Punktlar** - Punktlar KPI

### 7. Hududlar Statistikasi
Hierarchical navigatsiya:
- **Umumiy statistika** - Barcha hududlar bo'yicha
- **Viloyatlar** - Viloyatlar bo'yicha statistika
- **Tumanlar** - Tumanlar bo'yicha statistika
- **MFYlar** - MFYlar bo'yicha statistika
- **Kunlik statistika** - Kunlik ma'lumotlar

### 8. SMS Lar
- SMS tasdiqlashlar ro'yxati
- Filterlar va qidiruv

### 9. Moliya
Tab navigatsiya bilan:
- **Balans** - Moliya balansi
- **Hisobotlar** - Turli xil hisobotlar (Kunlik, Haftalik, Oylik, Yillik, Maxsus)
- **Topshiruvlar** - Moliya topshiruvlari
- **KPI To'lovlar** - KPI to'lovlari boshqaruvi
- **Transaksiyalar** - Barcha transaksiyalar
- **Statistika** - Moliya statistikasi
- **Contragent To'lovlari** - Contragentlarga to'lovlar tarqatish

### 10. Baholar
Tab navigatsiya bilan:
- **Baholar** - Mijozlar baholari
- **Kontaktlar** - Kontakt ma'lumotlari

### 11. Hamkorlik So'rovlari
- Hamkorlik so'rovlari ro'yxati
- So'rovlarni ko'rib chiqish va boshqarish

### 12. Vakansiyalar
- Vakansiyalar ro'yxati
- Vakansiyaga topshirgan nomzodlar
- Topshirishlarni ko'rib chiqish
- Intervyu rejalashtirish
- Yakuniy qaror qilish (avtomatik Punkt/Agent yaratish)

### 13. Arxiv
Tab navigatsiya bilan:
- **Arxivlangan Punktlar** - O'chirilgan punktlar va ularning ish tarixi
- **Arxivlangan Agentlar** - O'chirilgan agentlar va ularning ish tarixi

### 14. Sozlamalar
- Tizim sozlamalari
- Foydalanuvchi sozlamalari

## 🔌 API Integratsiyasi

Loyiha RESTful API bilan integratsiya qilingan. Barcha API funksiyalari `src/services/api.js` faylida joylashgan.

### Asosiy API Modullari:
- `adminAPI` - Admin autentifikatsiya
- `adminDataAPI` - Admin ma'lumotlari
- `agentAPI` - Agentlar
- `punktAPI` - Punktlar
- `contragentAPI` - Kontragentlar
- `regionAPI` - Regionlar
- `orderAPI` - Buyurtmalar
- `kpiAPI` - KPI bonuslar
- `salesStatsAPI` - Sotuv statistikasi
- `contragentPaymentAPI` - Contragent to'lovlari
- `vacancyApplicationAPI` - Vakansiya topshirishlari
- `archiveAPI` - Arxiv ma'lumotlari
- va boshqalar...

### Autentifikatsiya
Barcha API so'rovlari JWT token bilan amalga oshiriladi:
```javascript
Authorization: Bearer <token>
```

## 🧩 Komponentlar

### Reusable Komponentlar

#### RegionSelect
Viloyat, Tuman, MFY tanlash uchun searchable dropdown komponenti.
```jsx
<RegionSelect
  name="viloyat"
  value={filters.viloyat}
  onChange={handleChange}
  label="Viloyat"
  type="region"
  parentId={parentId}
  disabled={false}
/>
```

#### UserSelect
Marketplace foydalanuvchilarini tanlash uchun searchable dropdown.
```jsx
<UserSelect
  name="user"
  value={filters.user}
  onChange={handleChange}
  label="Foydalanuvchi"
/>
```

#### OrderTable
Buyurtmalar jadvali komponenti.
```jsx
<OrderTable
  orders={orders}
  loading={loading}
  onView={handleView}
  pagination={pagination}
  onPageChange={handlePageChange}
/>
```

#### AgentTable
Agentlar jadvali komponenti (activeTab ga qarab manzil ustunlarini ko'rsatadi).
```jsx
<AgentTable
  agents={agents}
  loading={loading}
  activeTab={activeTab}
  onEdit={handleEdit}
  onDelete={handleDelete}
  pagination={pagination}
/>
```

## 🗺 Routing

Routing `src/App.jsx` faylida sozlangan. Asosiy route'lar:

- `/login` - Kirish sahifasi
- `/dashboard` - Dashboard
- `/dashboard/admins` - Adminlar
- `/dashboard/regions` - Regionlar
- `/dashboard/contragents` - Kontragentlar
- `/dashboard/agents` - Agentlar
- `/dashboard/punkts` - Punktlar
- `/dashboard/ombor` - Ombor (tab navigation)
- `/dashboard/marketplace-users` - Marketplace mijozlar
- `/dashboard/orders` - Buyurtmalar (tab navigation)
- `/dashboard/kpi` - KPI Bonuslar (tab navigation)
- `/dashboard/statistics` - Hududlar statistikasi
- `/dashboard/sms-verifications` - SMS lar
- `/dashboard/finance` - Moliya (tab navigation)
- `/dashboard/reviews` - Baholar (tab navigation)
- `/dashboard/partnership-requests` - Hamkorlik so'rovlari
- `/dashboard/vacancies` - Vakansiyalar
- `/dashboard/vacancies/:vacancyId/applications` - Vakansiya topshirishlari
- `/dashboard/archive` - Arxiv (tab navigation)
- `/dashboard/archive/punkts/:id/work` - Punkt ish tarixi
- `/dashboard/archive/agents/:id/work` - Agent ish tarixi
- `/dashboard/settings` - Sozlamalar

## 🔒 Xavfsizlik

### Protected Routes
Barcha dashboard route'lari `ProtectedRoute` komponenti bilan himoyalangan. Faqat autentifikatsiya qilingan adminlar kirishlari mumkin.

### Token Management
- JWT token localStorage'da saqlanadi
- Token muddati o'tganda avtomatik logout
- 401 xatolikda avtomatik login sahifasiga yo'naltirish

## 💻 Development

### Code Style
- ESLint qoidalari qo'llaniladi
- Functional components va hooks ishlatiladi
- Framer Motion animatsiyalar

### State Management
- React Hooks (useState, useEffect, useCallback, useMemo)
- Context API (Auth, Sidebar, Snackbar)
- Local state management

### Best Practices
- Komponentlar reusable va modulyar
- API funksiyalari markazlashtirilgan
- Error handling va loading states
- Responsive dizayn
- Accessibility e'tibor berilgan

## 📱 Responsive Design

Loyiha barcha qurilmalarda ishlaydi:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 UI/UX Features

- **Tab Navigation** - Ko'p sahifalarda tab navigatsiya
- **Search & Filters** - Kuchli qidiruv va filterlash
- **Pagination** - Barcha ro'yxatlarda pagination
- **Loading States** - Skeleton loaders va spinnerlar
- **Error Handling** - Foydalanuvchi do'st xato xabarlari
- **Success Notifications** - Muvaffaqiyatli amallar uchun bildirishnomalar
- **Animations** - Framer Motion animatsiyalar
- **Responsive Tables** - Horizontal scroll qo'llab-quvvatlash

## 🔄 Workflow Examples

### Buyurtma Jarayoni
1. Buyurtma yaratiladi
2. Punkt tomonidan tasdiqlanadi
3. Kontragentga so'raladi
4. Punktga yetkaziladi
5. Agentga tayinlanadi
6. Agent tomonidan tasdiqlanadi
7. Mijoz tomonidan tasdiqlanadi

### Vakansiya Jarayoni
1. Vakansiya yaratiladi
2. Nomzodlar topshiradi
3. Admin ko'rib chiqadi va qabul qiladi/bekor qiladi
4. Intervyu rejalashtiriladi
5. Intervyu natijalari kiritiladi
6. Yakuniy qaror qilinadi
7. Agar "hired" bo'lsa, avtomatik Punkt/Agent yaratiladi

### Contragent To'lovlari Jarayoni
1. Buyurtmalardan to'lovlar sinxronlashtiriladi
2. To'lanmagan to'lovlar ko'rsatiladi
3. Admin to'lovlarni amalga oshiradi
4. To'lovlar "to'landi" deb belgilanadi
5. To'langan to'lovlar tarixida ko'rsatiladi

## 🐛 Xatolarni Tuzatish

### Umumiy Muammolar

**1. API xatoliklari**
- Network xatoliklari avtomatik tutiladi
- Foydalanuvchiga tushunarli xabar ko'rsatiladi

**2. Authentication xatoliklari**
- Token muddati o'tganda avtomatik logout
- Login sahifasiga yo'naltirish

**3. Loading states**
- Barcha API so'rovlarida loading state ko'rsatiladi
- Skeleton loaders ishlatiladi

## 📝 Eslatmalar

- Barcha sanalar UTC formatida saqlanadi va mahalliy vaqtga o'giriladi
- Raqamlar o'zbek tilida formatlanadi
- Barcha matnlar o'zbek tilida
- API base URL environment variable orqali sozlanadi

## 👥 Mualliflar

Bu loyiha marketplace va yetkazib berish tizimi uchun yaratilgan.

## 📄 Litsenziya

Bu loyiha xususiy loyiha hisoblanadi.

---

**Oxirgi yangilanish:** 2024-yil
