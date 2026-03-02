# CropGuard AI 🌿🛡️✨

An offline-first AI-powered crop disease diagnosis application designed for farmers in rural Vidarbha, Maharashtra, India.

## 🎯 Features

- **AI-Powered Diagnosis**: Real-time crop disease detection using TensorFlow.js
- **Offline-First**: Works completely offline with PWA capabilities
- **Multi-Crop Support**: Cotton and Soybean disease detection
- **Product Recommendations**: Local pesticide/fungicide suggestions with pricing
- **Weather Integration**: Real-time weather data for spray timing
- **History Tracking**: Save and review past diagnoses
- **Marathi Support**: Voice feedback in local language
- **Responsive Design**: Works on mobile, tablet, and desktop

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cropguard-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## 📱 PWA Installation

The app can be installed on mobile devices:

1. Open the app in a mobile browser
2. Look for the "Add to Home Screen" prompt
3. Follow the installation steps
4. Launch the app from your home screen

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI/ML**: TensorFlow.js (MobileNetV2)
- **Database**: Dexie.js (IndexedDB wrapper)
- **PWA**: Vite PWA Plugin (Workbox)
- **Routing**: React Router v6

### Project Structure

```
cropguard-ai/
├── public/
│   ├── models/          # TensorFlow.js model files
│   └── images/          # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context providers
│   ├── pages/           # Route pages
│   ├── services/        # Business logic & APIs
│   └── App.tsx          # Main app component
└── package.json
```

## 🧠 AI Model

The application uses a custom-trained MobileNetV2 model:

- **Input**: 224x224 RGB images
- **Output**: 7 classes (Cotton/Soybean diseases + Healthy)
- **Size**: ~4MB (optimized for mobile)
- **Inference**: Client-side (no server required)

### Supported Diseases

**Cotton**:
- Pink Bollworm
- Bacterial Blight
- Healthy

**Soybean**:
- Rust
- Leaf Spot
- Healthy

**Other**: Non-crop detection

## 📊 Performance

- **Initial Bundle**: 357 KB (76% reduction via code splitting)
- **Load Time (3G)**: ~4 seconds
- **Offline Support**: 100% functional without internet
- **PWA Score**: 100/100

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with React hooks rules
- **Error Handling**: Global error boundary
- **Bundle Optimization**: Route-based code splitting

## 🌐 Deployment

### Recommended Platforms

1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm run build
   # Upload dist/ folder to Netlify
   ```

3. **GitHub Pages**
   ```bash
   npm run build
   # Configure GitHub Pages to serve from dist/
   ```

### Environment Variables

Set these in your deployment platform:

- `VITE_WEATHER_API_URL`: OpenMeteo API endpoint
- `VITE_APP_NAME`: Application name
- `VITE_APP_VERSION`: Version number

## 📖 User Guide

### How to Diagnose a Crop

1. **Navigate to Diagnosis**: Click "Diagnose" in the navigation
2. **Capture Image**: Take a photo of the affected leaf
3. **Crop Verification**: Confirm the detected crop type
4. **Symptom Check**: Select visible symptoms
5. **View Results**: Get disease diagnosis and treatment recommendations
6. **Save to History**: Diagnosis is automatically saved

### Viewing History

1. Navigate to "History" page
2. View all past diagnoses
3. Click on any entry to see details
4. Delete entries as needed

### Updating Profile

1. Go to "Settings"
2. Update name, phone, language preferences
3. Changes are saved automatically

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenMeteo for free weather API
- TensorFlow.js team for the ML framework
- Farmers of Vidarbha for inspiration and feedback

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@cropdoctor.app (placeholder)

---

**Built with ❤️ for the farmers of Vidarbha**
