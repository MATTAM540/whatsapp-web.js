# WhatsApp Dashboard (Web GUI)

Bu proje, **whatsapp-web.js** kütüphanesini kullanarak geliştirilen bir web arayüzüdür.
Amaç; WhatsApp oturumunu QR ile yönetmek, mesaj otomasyonlarını tek bir panelden kullanmak ve planlı mesaj gönderimi yapmaktır.

## Özellikler

- WhatsApp bağlantı durumu takibi (`DISCONNECTED`, `QR_READY`, `AUTHENTICATED`, `READY`)
- QR kod ile giriş ve oturum yönetimi
- Socket.io ile gerçek zamanlı durum güncellemeleri
- Otomatik yanıt kuralları (EXACT_MATCH / CONTAINS / ALWAYS)
- Planlı mesaj gönderimi (dakikalık scheduler)
- Çağrı otomatik reddetme ayarı
- Dashboard giriş endpoint’i (`APP_PASSWORD` ile basit koruma)

## Teknoloji yığını

- **Next.js** (App Router)
- **Node.js HTTP server** + **Socket.io**
- **whatsapp-web.js** + **Puppeteer**
- **Prisma** + **LibSQL/Turso**

## Gereksinimler

- Node.js 18+
- npm
- Çalışan bir LibSQL/Turso veritabanı (veya `file:` URL ile lokal sqlite/libsql)

## Kurulum

```bash
cd whatsapp-dashboard
npm install
```

## Ortam değişkenleri

Önce örnek dosyayı kopyalayın:

```bash
cp .env.example .env
```

Sonra `whatsapp-dashboard/.env` dosyasını aşağıdaki şekilde düzenleyin:

```env
# Dashboard giriş şifresi
APP_PASSWORD=guclu-bir-sifre

# LibSQL / Turso bağlantısı
# Örnek (Turso): libsql://xxx.turso.io
# Örnek (lokal): file:./dev.db
TURSO_DATABASE_URL=libsql://<db-adresi>
TURSO_AUTH_TOKEN=<token>

# Opsiyonel
PORT=3000
NODE_ENV=development
```

> Not: Lokal kullanımda `TURSO_DATABASE_URL=file:./dev.db` tercih edebilirsiniz.

## Veritabanı hazırlığı

Prisma migration’larını uygulayın:

```bash
npx prisma migrate deploy
```

Geliştirme ortamında yeni migration üretmek için:

```bash
npx prisma migrate dev
```

## Çalıştırma

Geliştirme modunda:

```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde açılır.

## İlk açılış akışı

1. Dashboard’u açın.
2. QR kod görünürse telefonunuzdan WhatsApp ile okutun.
3. Durum `READY` olduğunda gönderim/otomasyon işlemleri aktif olur.
4. Oturumu sonlandırınca sistem otomatik olarak yeniden başlatıp yeni QR üretir.

## Üretim (production)

```bash
npm run build
npm run start
```

## Mimari notu

- Uygulama, standart `next dev` yerine `node server.js` ile başlar.
- Bunun sebebi, aynı süreçte hem Next.js handler’ını hem de Socket.io + WhatsApp servis katmanını çalıştırmaktır.
- `server.js`, WhatsApp servisini başlatır ve her 60 saniyede bir planlı mesaj kuyruğunu işler.

## Sorun giderme

- **QR gelmiyor**: Uygulama loglarını kontrol edin; Puppeteer/WhatsApp oturum klasörü izinlerini doğrulayın.
- **DB bağlantı hatası**: `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` değerlerini kontrol edin.
- **Giriş yapılandırma hatası**: `.env` içinde `APP_PASSWORD` tanımlı olmalı.

## Güvenlik notu

Bu proje temel dashboard koruması için tek bir `APP_PASSWORD` kullanır. İnternete açık bir ortamda kullanacaksanız ek olarak:

- Reverse proxy + TLS
- IP kısıtlama / VPN
- Gelişmiş kimlik doğrulama

önerilir.
