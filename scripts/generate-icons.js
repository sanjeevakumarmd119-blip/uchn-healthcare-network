const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091322" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>

    <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
      <stop offset="30%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.4" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Squircle Base Container -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  
  <!-- Outer Ring Accent -->
  <rect width="506" height="506" x="3" y="3" rx="110" fill="none" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.3" />

  <!-- Ambient Glow -->
  <circle cx="256" cy="256" r="160" fill="#0284c7" opacity="0.22" filter="url(#glow)" />

  <!-- Medical Cross -->
  <rect x="216" y="104" width="80" height="304" rx="28" fill="url(#crossGrad)" />
  <rect x="104" y="216" width="304" height="80" rx="28" fill="url(#crossGrad)" />

  <!-- ECG Lifeline Pulse Overlay -->
  <path
    d="M 90,256 L 175,256 L 205,210 L 235,310 L 268,160 L 298,340 L 328,256 L 422,256"
    fill="none"
    stroke="url(#pulseGrad)"
    stroke-width="14"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Vital Center Dot -->
  <circle cx="268" cy="160" r="6" fill="#ffffff" />

  <!-- SOS Badge Indicator -->
  <circle cx="404" cy="108" r="16" fill="#ef4444" />
  <circle cx="404" cy="108" r="24" fill="none" stroke="#ef4444" stroke-width="3" opacity="0.6" />
</svg>`;

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091322" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>

    <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4" />
      <stop offset="30%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.4" />
    </linearGradient>
  </defs>

  <!-- Full Background for Maskable Icon Safe Zone -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Centered Scaled Content (80% safe zone) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect width="512" height="512" rx="112" fill="none" stroke="#38bdf8" stroke-width="4" stroke-opacity="0.2" />
    <rect x="216" y="104" width="80" height="304" rx="28" fill="url(#crossGrad)" />
    <rect x="104" y="216" width="304" height="80" rx="28" fill="url(#crossGrad)" />

    <path
      d="M 90,256 L 175,256 L 205,210 L 235,310 L 268,160 L 298,340 L 328,256 L 422,256"
      fill="none"
      stroke="url(#pulseGrad)"
      stroke-width="14"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <circle cx="268" cy="160" r="6" fill="#ffffff" />
    <circle cx="404" cy="108" r="16" fill="#ef4444" />
    <circle cx="404" cy="108" r="24" fill="none" stroke="#ef4444" stroke-width="3" opacity="0.6" />
  </g>
</svg>`;

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

async function generatePngs() {
  const svgBuf = Buffer.from(svgContent);
  const maskableSvgBuf = Buffer.from(maskableSvg);

  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512x512.png'));
  console.log('Created icon-512x512.png');

  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192x192.png'));
  console.log('Created icon-192x192.png');

  await sharp(svgBuf).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  await sharp(svgBuf).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  await sharp(maskableSvgBuf).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512x512.png'));
  console.log('Created icon-maskable-512x512.png');

  await sharp(maskableSvgBuf).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192x192.png'));
  console.log('Created icon-maskable-192x192.png');
}

generatePngs()
  .then(() => console.log('All icons generated successfully!'))
  .catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
  });
