# 🎭 KolabEmpati - Live Video Conference with Real-time Emotion Detection

![KolabEmpati Banner](./public/LogoKolabEmpati.jpg)

## 📖 Overview

**KolabEmpati** adalah aplikasi web conference berbasis **LiveKit WebRTC** yang dilengkapi dengan **deteksi emosi real-time** menggunakan **Face-API.js**. Proyek ini menggabungkan teknologi video conferencing modern dengan artificial intelligence untuk analisis emosi partisipan secara real-time.

> **⚠️ DISCLAIMER: Proyek ini dibuat hanya untuk tujuan pembelajaran dan pengembangan skill programming. Tidak dimaksudkan untuk penggunaan komersial atau produksi tanpa pengujian dan pengembangan lebih lanjut.**

## 🌟 Features

### 🎥 **Video Conferencing**
- ✅ **Real-time Video/Audio Communication** dengan LiveKit WebRTC
- ✅ **Room-based Meetings** dengan sistem kode akses 6 digit
- ✅ **Recording Functionality** dengan integrasi S3 storage
- ✅ **End-to-End Encryption (E2EE)** untuk keamanan komunikasi
- ✅ **Multi-region Server Support** untuk performa global
- ✅ **Quality Controls** (codec selection, bandwidth optimization)

### 🧠 **Emotion Detection (AI)**
- ✅ **7 Emosi Dasar**: Senang, Sedih, Marah, Takut, Terkejut, Jijik, Netral
- ✅ **Real-time Detection** dengan confidence scoring
- ✅ **Session-based Analysis** dengan timer controls
- ✅ **Historical Data Collection** untuk analisis mendalam
- ✅ **PDF Report Generation** dengan AI insights
- ✅ **Face-API.js Models** untuk akurasi tinggi

### 📊 **Analytics & Reporting**
- ✅ **Session Management**: Start, pause, resume, stop controls
- ✅ **Data Visualization**: Charts dan timeline analysis
- ✅ **Professional PDF Reports** dengan statistik lengkap
- ✅ **Real-time Metrics** untuk monitoring performa
- ✅ **Emotion Distribution Analysis** dengan breakdown detail

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5.8.3
- **UI Library**: Tailwind CSS + Radix UI Components
- **State Management**: React 18.3.1 Hooks

### **Backend/API**
- **Server**: Next.js API Routes
- **WebRTC**: LiveKit Client 2.13.8 + Server SDK 2.13.0
- **Authentication**: LiveKit Token-based Auth

### **AI/ML**
- **Face Detection**: Face-API.js 0.22.2
- **Models**: TensorFlow.js based pre-trained models
- **Processing**: Client-side real-time analysis

### **Additional Libraries**
- **PDF Generation**: jsPDF 3.0.1 + html2canvas
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **Package Manager**: pnpm 9.15.9

## 🚀 Quick Start

### **Prerequisites**
- Node.js >= 18
- pnpm package manager
- LiveKit Cloud account atau self-hosted server

### **Installation**

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/kolabempati.git
cd kolabempati
```

2. **Install Dependencies**
```bash
pnpm install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

Edit `.env.local` dengan credentials LiveKit:
```env
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-domain.livekit.cloud

# Optional - untuk Recording
S3_KEY_ID=your_s3_key
S3_KEY_SECRET=your_s3_secret
S3_ENDPOINT=your_s3_endpoint
S3_BUCKET=your_s3_bucket
S3_REGION=your_s3_region
```

4. **Download Face-API Models** (jika belum ada)
```bash
node scripts/download-models.js
```

5. **Development Server**
```bash
pnpm dev
```

6. **Production Build**
```bash
pnpm build
pnpm start
```

## 📱 Usage Guide

### **1. Video Conference**
1. Akses homepage → Pilih "Buat Meeting" atau "Bergabung"
2. Generate room code atau input existing code
3. Masuk ke room → Video conference aktif
4. Optional: Aktivasi recording dan emotion detection

### **2. Emotion Analysis**
1. Akses `/emotion` → 3 tabs tersedia:
   - **Real-time Detection**: Deteksi emosi langsung
   - **Session Analysis**: Sesi analisis terstruktur dengan durasi
   - **Reports**: Generate dan download PDF laporan

### **3. Analytics Dashboard**
- Monitor real-time emotion metrics
- View session history dan statistics
- Export detailed PDF reports dengan AI insights

## 🏗️ Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── connection-details/   # LiveKit connection handling
│   │   └── record/              # Recording start/stop endpoints
│   ├── emotion/                 # Emotion detection pages
│   ├── rooms/[roomName]/        # Dynamic video conference rooms
│   └── custom/                  # Custom video conference implementation
├── components/                   # Reusable UI Components
│   ├── ui/                      # Radix UI component wrappers
│   ├── EmotionSessionControls.tsx
│   ├── JoinByCode.tsx
│   └── RoomCodeDisplay.tsx
├── lib/                         # Core Libraries & Utilities
│   ├── emotion-types.ts         # Emotion data TypeScript definitions
│   ├── simple-pdf-generator.ts  # PDF report generator
│   ├── client-utils.ts          # Client-side utilities
│   └── getLiveKitURL.ts         # LiveKit server management
├── public/                      # Static Assets
│   ├── models/                  # Face-API.js pre-trained models (7.2MB)
│   ├── icons/                   # PWA icons
│   └── images/                  # App assets
└── scripts/                     # Utility Scripts
    └── download-models.js       # Face-API model downloader
```

## 📊 Performance Metrics

### **Bundle Sizes**
```
Route                    Size     First Load JS
┌ ○ /                   11.1 kB  128 kB
├ ○ /emotion           285 kB    402 kB (Face-API models)
├ ƒ /custom            4.01 kB   311 kB
├ ƒ /rooms/[roomName]  2.2 kB    314 kB
└ API Routes           150 B     102 kB
```

### **Assets**
- **Face-API Models**: 7.2MB (cached after first load)
- **PWA Icons**: Multiple resolutions for optimal loading
- **Total Bundle**: ~102KB shared + page-specific

## 🚀 Deployment

### **Recommended Platforms**
- **Vercel** (Recommended) - Native Next.js support
- **Netlify** - Edge functions support
- **Railway/Render** - Full-stack Node.js hosting

### **Requirements**
- ✅ HTTPS (mandatory untuk WebRTC)
- ✅ LiveKit server credentials
- ✅ Node.js 18+ runtime
- ✅ Environment variables configured

### **Build Commands**
```bash
# Build
pnpm build

# Start
pnpm start
```

## 🔧 Development

### **Available Scripts**
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
pnpm lint         # ESLint check
pnpm lint:fix     # ESLint auto-fix
pnpm test         # Run tests
```

### **Development Guidelines**
- TypeScript strict mode enabled
- ESLint + Prettier configured
- React hooks best practices
- Responsive design with Tailwind CSS

## 🔒 Security & Privacy

### **Data Privacy**
- ✅ Client-side emotion processing (no data sent to external servers)
- ✅ WebRTC P2P communication
- ✅ Optional E2EE encryption
- ✅ Session data stored locally

### **Security Features**
- ✅ LiveKit token-based authentication
- ✅ HTTPS-only communication
- ✅ Environment variable protection
- ✅ No sensitive data in client bundle

## 🧪 Testing & Quality

### **Code Quality**
- ✅ TypeScript untuk type safety
- ✅ ESLint untuk code consistency
- ✅ Prettier untuk formatting
- ✅ React strict mode enabled

### **Performance**
- ✅ Next.js optimizations
- ✅ Lazy loading untuk heavy components
- ✅ Webpack bundle optimization
- ✅ Production source maps

## 📝 Known Limitations

1. **Face-API.js Dependencies**: Memerlukan model download awal (7.2MB)
2. **Browser Compatibility**: Modern browsers only (WebRTC support)
3. **Camera Requirements**: Akses kamera diperlukan untuk emotion detection
4. **Network Requirements**: Stable internet untuk real-time features

## 🤝 Contributing

Sebagai proyek pembelajaran, kontribusi sangat diterima untuk:
- Bug fixes dan improvements
- Feature enhancements
- Documentation improvements
- Performance optimizations

### **Development Setup**
1. Fork repository
2. Create feature branch
3. Make changes dengan testing
4. Submit pull request dengan description lengkap

## 📄 License

MIT License - lihat [LICENSE](LICENSE) file untuk detail lengkap.

## 🙏 Acknowledgments

### **Technologies Used**
- [LiveKit](https://livekit.io/) - WebRTC infrastructure
- [Face-API.js](https://github.com/justadudewhohacks/face-api.js/) - Face detection & emotion recognition
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI components

### **Inspiration**
Proyek ini terinspirasi dari kebutuhan untuk memahami emosi dalam komunikasi digital, terutama di era remote work dan virtual meetings.

## 📞 Support

Untuk pertanyaan terkait pengembangan atau pembelajaran:
- Create GitHub Issue untuk bug reports
- Discussions tab untuk general questions
- Documentation lengkap tersedia di repository

---

**⚠️ REMINDER: Proyek ini dibuat untuk tujuan pembelajaran. Gunakan dengan bijak dan lakukan testing menyeluruh sebelum implementasi dalam environment production.**

**📚 Educational Purpose**: Proyek ini ideal untuk mempelajari:
- WebRTC implementation
- Real-time AI processing
- Next.js full-stack development
- TypeScript best practices
- Modern web development workflow
