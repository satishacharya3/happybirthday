import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath   = path.resolve(__dirname, '../public/og-image.png');

console.log('🎂 Generating OG image via SVG → PNG...');

// 1200 × 630 birthday cake scene as a rich SVG
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <!-- Background radial gradients -->
    <radialGradient id="bg1" cx="50%" cy="60%" r="70%">
      <stop offset="0%"   stop-color="#2d001a"/>
      <stop offset="55%"  stop-color="#0a000d"/>
      <stop offset="100%" stop-color="#000005"/>
    </radialGradient>
    <radialGradient id="bgGlow" cx="50%" cy="75%" r="50%">
      <stop offset="0%"   stop-color="#b4145033" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000"   stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bgGold" cx="50%" cy="5%" r="45%">
      <stop offset="0%"   stop-color="#D4AF37" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Cake gradients -->
    <linearGradient id="tier1g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#fff0f5"/>
      <stop offset="100%" stop-color="#ffe0ea"/>
    </linearGradient>
    <linearGradient id="tier2g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fff0f5"/>
    </linearGradient>
    <linearGradient id="plateg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#333333"/>
      <stop offset="100%" stop-color="#111111"/>
    </linearGradient>
    <linearGradient id="tableG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#2a1200"/>
      <stop offset="100%" stop-color="#1a0a00"/>
    </linearGradient>
    <radialGradient id="flameG" cx="50%" cy="80%" r="60%">
      <stop offset="0%"   stop-color="#FFE033"/>
      <stop offset="60%"  stop-color="#FF6A00"/>
      <stop offset="100%" stop-color="#cc3300" stop-opacity="0.3"/>
    </radialGradient>
    <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#FF8C00" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#FF8C00" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="titleG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#DB3D68"/>
      <stop offset="50%"  stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#FF85C2"/>
    </linearGradient>
    <linearGradient id="nameG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#FFD700"/>
    </linearGradient>

    <!-- Glow filters -->
    <filter id="pinkGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="tableBlur">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
  </defs>

  <!-- ── Background ── -->
  <rect width="1200" height="630" fill="url(#bg1)"/>
  <rect width="1200" height="630" fill="url(#bgGlow)"/>
  <rect width="1200" height="630" fill="url(#bgGold)"/>

  <!-- Stars -->
  <g fill="white" opacity="0.5">
    ${Array.from({length:120},(_,i)=>{
      const x=Math.round((Math.sin(i*127.1)*0.5+0.5)*1200);
      const y=Math.round((Math.sin(i*311.7)*0.5+0.5)*630);
      const r=(Math.sin(i*73.3)*0.5+0.5)*1.5+0.3;
      const op=(Math.sin(i*57.7)*0.35+0.65).toFixed(2);
      return `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" opacity="${op}"/>`;
    }).join('')}
  </g>

  <!-- ── Table ── -->
  <ellipse cx="780" cy="540" rx="210" ry="22" fill="url(#tableG)" opacity="0.9"/>
  <rect x="570" y="525" width="420" height="15" rx="4" fill="#1a0a00"/>
  <!-- table gold rim -->
  <ellipse cx="780" cy="525" rx="210" ry="10" fill="none" stroke="#D4AF37" stroke-width="2.5" opacity="0.8"/>
  <!-- pedestal -->
  <rect x="763" y="540" width="34" height="55" rx="4" fill="#111"/>
  <ellipse cx="780" cy="595" rx="38" ry="6" fill="#1a0a00"/>

  <!-- Cake shadow on table -->
  <ellipse cx="780" cy="528" rx="130" ry="12" fill="#000" opacity="0.45"/>

  <!-- ── Cake plate ── -->
  <ellipse cx="780" cy="525" rx="128" ry="13" fill="url(#plateg)"/>
  <ellipse cx="780" cy="522" rx="128" ry="8" fill="#222" opacity="0.6"/>

  <!-- ── Bottom tier ── -->
  <!-- side -->
  <rect x="678" y="400" width="204" height="120" rx="8" fill="url(#tier1g)"/>
  <!-- top ellipse -->
  <ellipse cx="780" cy="400" rx="102" ry="12" fill="#ffe8f0"/>
  <!-- bottom ellipse -->
  <ellipse cx="780" cy="520" rx="102" ry="10" fill="#ffd0e0" opacity="0.7"/>
  <!-- rosettes bottom band -->
  ${Array.from({length:10},(_,i)=>{
    const a=(i/10)*Math.PI*2; const cx=780+Math.round(Math.cos(a)*88); const cy=422+Math.round(Math.sin(a)*9);
    const cols=['#FF69B4','#FF1493','#FFB6C1','#DB3D68','#FF85C2'];
    return `<circle cx="${cx}" cy="${cy}" r="7" fill="${cols[i%5]}" opacity="0.9"/>`;
  }).join('')}
  <!-- rosettes top band -->
  ${Array.from({length:10},(_,i)=>{
    const a=(i/10)*Math.PI*2; const cx=780+Math.round(Math.cos(a)*88); const cy=505+Math.round(Math.sin(a)*9);
    const cols=['#FF69B4','#FF1493','#FFB6C1','#DB3D68','#FF85C2'];
    return `<circle cx="${cx}" cy="${cy}" r="7" fill="${cols[i%5]}" opacity="0.9"/>`;
  }).join('')}
  <!-- gold band -->
  <ellipse cx="780" cy="458" rx="102" ry="7" fill="none" stroke="#D4AF37" stroke-width="3.5"/>

  <!-- ── Top tier ── -->
  <rect x="710" y="300" width="140" height="100" rx="6" fill="url(#tier2g)"/>
  <ellipse cx="780" cy="300" rx="70" ry="9" fill="#fff5f8"/>
  <ellipse cx="780" cy="400" rx="70" ry="7" fill="#ffe8f0" opacity="0.7"/>
  <!-- rosettes -->
  ${Array.from({length:8},(_,i)=>{
    const a=(i/8)*Math.PI*2; const cx=780+Math.round(Math.cos(a)*62); const cy=318+Math.round(Math.sin(a)*7);
    const cols=['#FF69B4','#FF1493','#FFB6C1','#DB3D68','#FF85C2'];
    return `<circle cx="${cx}" cy="${cy}" r="6" fill="${cols[i%5]}" opacity="0.9"/>`;
  }).join('')}
  ${Array.from({length:8},(_,i)=>{
    const a=(i/8)*Math.PI*2; const cx=780+Math.round(Math.cos(a)*62); const cy=390+Math.round(Math.sin(a)*7);
    const cols=['#FF69B4','#FF1493','#FFB6C1','#DB3D68','#FF85C2'];
    return `<circle cx="${cx}" cy="${cy}" r="6" fill="${cols[i%5]}" opacity="0.9"/>`;
  }).join('')}
  <!-- gold band -->
  <ellipse cx="780" cy="350" rx="70" ry="6" fill="none" stroke="#D4AF37" stroke-width="3"/>

  <!-- ── Flowers on tiers ── -->
  <!-- bottom tier flowers -->
  ${Array.from({length:6},(_,i)=>{
    const a=(i/6)*Math.PI*2;
    const cx=780+Math.round(Math.cos(a)*95); const cy=410+Math.round(Math.sin(a)*8);
    const cols=['#FF69B4','#FF1493','#FFB6C1','#DB3D68','#FF85C2','#FF69B4'];
    const c=cols[i%6];
    return `<circle cx="${cx}" cy="${cy}" r="9" fill="${c}" opacity="0.85"/>
            <circle cx="${cx}" cy="${cy}" r="4" fill="#FFDA44"/>`;
  }).join('')}
  <!-- top tier flowers -->
  ${Array.from({length:5},(_,i)=>{
    const a=(i/5)*Math.PI*2;
    const cx=780+Math.round(Math.cos(a)*66); const cy=308+Math.round(Math.sin(a)*6);
    const cols=['#FF69B4','#FF1493','#FFB6C1','#DB3D68','#FF85C2'];
    const c=cols[i%5];
    return `<circle cx="${cx}" cy="${cy}" r="7" fill="${c}" opacity="0.85"/>
            <circle cx="${cx}" cy="${cy}" r="3" fill="#FFDA44"/>`;
  }).join('')}

  <!-- ── Candle ── -->
  <!-- candle holder base -->
  <ellipse cx="780" cy="300" rx="12" ry="4" fill="#D4AF37"/>
  <!-- candle body -->
  <rect x="775" y="252" width="10" height="48" rx="4" fill="#FFF5F8"/>
  <!-- gold bands on candle -->
  <rect x="773" y="268" width="14" height="3" rx="1" fill="#D4AF37"/>
  <rect x="773" y="283" width="14" height="3" rx="1" fill="#D4AF37"/>
  <!-- wick -->
  <line x1="780" y1="252" x2="780" y2="246" stroke="#333" stroke-width="1.5"/>

  <!-- Flame glow -->
  <ellipse cx="780" cy="236" rx="28" ry="28" fill="url(#flameGlow)" filter="url(#softGlow)"/>
  <!-- Flame -->
  <ellipse cx="780" cy="234" rx="9" ry="18" fill="url(#flameG)" filter="url(#goldGlow)"/>
  <ellipse cx="780" cy="238" rx="5" ry="11" fill="#FFE033" opacity="0.9"/>
  <!-- flame tip white -->
  <ellipse cx="780" cy="222" rx="2.5" ry="3" fill="white" opacity="0.95"/>

  <!-- ── "Happy Birthday" text on cake side ── -->
  <text x="780" y="345" text-anchor="middle" font-family="Georgia,serif" font-size="12" font-weight="700" fill="#DB3D68" letter-spacing="1">Happy Birthday</text>
  <text x="780" y="362" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="900" fill="#D4AF37" letter-spacing="2">Shuhana</text>

  <!-- ── Left panel text ── -->
  <!-- decorative line -->
  <line x1="75" y1="185" x2="75" y2="445" stroke="#DB3D68" stroke-width="1.5" opacity="0.4"/>

  <!-- Tag -->
  <text x="100" y="200" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#DB3D68" letter-spacing="4" opacity="0.9">✦ A SPECIAL SURPRISE ✦</text>

  <!-- Title: Happy Birthday -->
  <text x="98" y="295" font-family="Georgia,'Playfair Display',serif" font-size="82" font-weight="900" fill="url(#titleG)" filter="url(#pinkGlow)">Happy</text>
  <text x="98" y="375" font-family="Georgia,'Playfair Display',serif" font-size="82" font-weight="900" fill="url(#titleG)" filter="url(#pinkGlow)">Birthday</text>

  <!-- Name -->
  <text x="100" y="440" font-family="Georgia,'Playfair Display',serif" font-size="62" font-weight="900" fill="url(#nameG)" filter="url(#goldGlow)">Shuhana 🎂</text>

  <!-- Subtitle -->
  <text x="100" y="490" font-family="Arial,sans-serif" font-size="15" fill="rgba(255,255,255,0.45)" letter-spacing="3">Open your gift — something beautiful awaits</text>

  <!-- sparkle dots -->
  <circle cx="90" cy="218" r="3" fill="#D4AF37" opacity="0.7"/>
  <circle cx="90" cy="313" r="2" fill="#FF85C2" opacity="0.6"/>
  <circle cx="90" cy="393" r="2" fill="#DB3D68" opacity="0.6"/>
  <circle cx="90" cy="458" r="3" fill="#D4AF37" opacity="0.7"/>

  <!-- subtle vignette overlay -->
  <radialGradient id="vig" cx="50%" cy="50%" r="70%">
    <stop offset="60%"  stop-color="black" stop-opacity="0"/>
    <stop offset="100%" stop-color="black" stop-opacity="0.5"/>
  </radialGradient>
  <rect width="1200" height="630" fill="url(#vig)"/>
</svg>`;

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 8 })
  .toFile(outPath);

const size = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`✅ OG image saved → public/og-image.png (${size} KB)`);
