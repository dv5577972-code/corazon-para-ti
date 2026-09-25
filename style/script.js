Create script.js
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Variables de configuración de la animación
let speedMultiplier = 1;
let sizeMultiplier = 1;
let isPaused = false;
let colorModeIndex = 0;

const colorPalettes = [
    { name: "Arcoíris", colors: ['#ff3366', '#ff9933', '#ffff33', '#33cc66', '#3399ff', '#9933ff'] },
    { name: "Rojo Pasión", colors: ['#ff1a1a', '#ff4d4d', '#ff9999', '#cc0000', '#800000'] },
    { name: "Azul Neón", colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#9333ea'] },
    { name: "Dorado Mágico", colors: ['#ffd700', '#ffaa00', '#ffea75', '#e65100', '#fff'] }
];

// Generar puntos de la curva matemática del corazón
const heartPoints = [];
const pointCount = 350;
for (let i = 0; i < pointCount; i++) {
    const t = (i / pointCount) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    heartPoints.push({ x: hx, y: hy, angle: t });
}

class HeartParticle {
    constructor(pt) {
        this.baseX = pt.x;
        this.baseY = pt.y;
        this.angle = pt.angle;
        this.reset();
    }

    reset() {
        this.life = 0;
        this.maxLife = Math.random() * 40 + 60;
    }

    update() {
        if (isPaused) return;
        this.life += 1 * speedMultiplier;
        if (this.life >= this.maxLife) {
            this.reset();
        }
    }

    draw() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 20;
        const scale = (Math.min(canvas.width, canvas.height) / 35) * sizeMultiplier;

        const pulse = 1 + Math.sin(Date.now() / 300) * 0.03;
        const x = centerX + this.baseX * scale * pulse;
        const y = centerY + this.baseY * scale * pulse;

        const palette = colorPalettes[colorModeIndex].colors;
        const color = palette[Math.floor((this.angle + Date.now() / 500) % palette.length)];

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, (Math.random() * 2 + 2) * sizeMultiplier, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.restore();
    }
}

// Clase para las partículas del estallido central ("Para ti")
class BurstParticle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.alpha = 1;
        this.color = color;
        this.size = Math.random() * 2.5 + 1;
    }

    update() {
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;
        this.alpha -= 0.015 * speedMultiplier;
    }

    draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(this.alpha, 0);
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

let particles = heartPoints.map(pt => new HeartParticle(pt));
let burstParticles = [];
let textBurstAlpha = 0;
let textScale = 0.5;

// Función para disparar el estallido central con el texto "Para ti"
function triggerBurst() {
    if (isPaused) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    
    // Generar partículas radiales de estallido
    const palette = colorPalettes[colorModeIndex].colors;
    for (let i = 0; i < 90; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        const color = palette[Math.floor(Math.random() * palette.length)];
        burstParticles.push(new BurstParticle(centerX, centerY, Math.cos(angle) * speed, Math.sin(angle) * speed, color));
    }

    // Activar animación del texto flotante
    textBurstAlpha = 1.5;
    textScale = 0.5;
}

// Disparar estallido automático cada 4 segundos
setInterval(triggerBurst, 4000);

let lastTime = performance.now();
let frameCount = 0;
let currentFps = 60;

function animate(now) {
    frameCount++;
    if (now - lastTime >= 1000) {
        currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        document.getElementById('fps').innerText = currentFps;
        document.getElementById('particleCount').innerText = particles.length + burstParticles.length;
        frameCount = 0;
        lastTime = now;
    }

    if (!isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar corazón
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Actualizar y dibujar partículas de estallido
        for (let i = burstParticles.length - 1; i >= 0; i--) {
            let bp = burstParticles[i];
            bp.update();
            bp.draw();
            if (bp.alpha <= 0) {
                burstParticles.splice(i, 1);
            }
        }

        // Renderizar el texto "Para ti" surgiendo del centro
        if (textBurstAlpha > 0) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2 - 20;

            textScale += 0.015;
            textBurstAlpha -= 0.012;

            ctx.save();
            ctx.font = `600 ${Math.floor(32 * sizeMultiplier * Math.min(textScale, 1.2))}px 'Pacifico', cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const palette = colorPalettes[colorModeIndex].colors;
            ctx.fillStyle = palette[0];
            ctx.shadowBlur = 25;
            ctx.shadowColor = palette[0];
            ctx.globalAlpha = Math.max(textBurstAlpha, 0);
            
            ctx.fillText("Para ti bebe :)", centerX, centerY);
            ctx.restore(); 
        }
    }

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// --- INTERACTIVIDAD DE LOS BOTONES ---

document.getElementById('colorBtn').addEventListener('click', () => {
    colorModeIndex = (colorModeIndex + 1) % colorPalettes.length;
    document.getElementById('currentMode').innerText = colorPalettes[colorModeIndex].name;
});

document.getElementById('speedBtn').addEventListener('click', () => {
    speedMultiplier = speedMultiplier === 1 ? 2 : (speedMultiplier === 2 ? 0.5 : 1);
});

document.getElementById('sizeBtn').addEventListener('click', () => {
    sizeMultiplier = sizeMultiplier === 1 ? 1.3 : (sizeMultiplier === 1.3 ? 0.7 : 1);
});

let pausedState = false;
document.getElementById('pauseBtn').addEventListener('click', (e) => {
    isPaused = !isPaused;
    pausedState = !pausedState;
    e.target.style.background = pausedState ? 'rgba(255, 255, 255, 0.4)' : '';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    speedMultiplier = 1;
    sizeMultiplier = 1;
    isPaused = false;
    pausedState = false;
    colorModeIndex = 0;
    burstParticles = [];
    textBurstAlpha = 0;
    document.getElementById('currentMode').innerText = colorPalettes[0].name;
});

let musicPlaying = false;
document.getElementById('musicBtn').addEventListener('click', (e) => {
    const music = document.getElementById('bgMusic');
    musicPlaying = !musicPlaying;
    if (musicPlaying) {
        music.play().catch(() => {});
        e.target.style.background = 'rgba(255, 255, 255, 0.4)';
    } else {
        music.pause();
        e.target.style.background = '';
    }
});

// --- AUTOPRODUCCIÓN AL PRIMER CLIC EN LA PÁGINA ---
document.body.addEventListener('click', function autoPlayMusic() {
    const music = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicBtn');
    
    // Si la música está pausada, la reproducimos
    if (music.paused) {
        music.play().then(() => {
            musicPlaying = true;
            if (musicBtn) musicBtn.style.background = 'rgba(255, 255, 255, 0.4)';
        }).catch(err => {
            console.log("El navegador bloqueó la reproducción automática: ", err);
        });
    }
    
    // Remueve el evento para que solo ocurra en el primer clic y no vuelva a interferir
    document.body.removeEventListener('click', autoPlayMusic);
}, { once: true });
