const CONFIG = {
    canvas: {
        width: window.innerWidth,
        height: window.innerHeight,
        groundLevel: window.innerHeight * 0.7
    },
    player: {
        width: 40,
        height: 60,
        x: 100,
        color: '#FFB6C1',
        eyeColor: 'white',
        duckHeight: 30
    },
    apple: {
        width: 25,
        height: 25,
        points: 100,
        spawnChance: 0.3,
        // Y positions as percentages of canvas height (0.55, 0.45, 0.625 of original 400px)
        getYPositions: () => [
            window.innerHeight * 0.55,
            window.innerHeight * 0.45,
            window.innerHeight * 0.625
        ]
    },
    obstacle: {
        wall: {
            width: 30,
            height: 60,
            color: '#8B4513'
        },
        drone: {
            width: 50,
            height: 30,
            color: '#666666',
            // Drone Y as percentage of canvas height - positioned closer to ground
            getY: () => window.innerHeight * 0.6
        },
        speed: 3,
        minGap: 1500,
        maxGap: 3000
    },
    game: {
        gravity: 0.5,
        jumpVelocity: -15,
        speedIncreaseInterval: 10000,
        speedIncreaseAmount: 0.3,
        maxLives: 10
    },
    powerup: {
        star: {
            width: 30,
            height: 30,
            duration: 5000,
            spawnChance: 0.15
        },
        magnet: {
            width: 30,
            height: 30,
            duration: 8000,
            range: 100,
            spawnChance: 0.15
        }
    }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// Set initial canvas size
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

// Handle window resize
function resizeCanvas() {
    CONFIG.canvas.width = window.innerWidth;
    CONFIG.canvas.height = window.innerHeight;
    CONFIG.canvas.groundLevel = window.innerHeight * 0.7;
    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    // Update player position if game is running
    if (gameState === 'playing' && player) {
        player.y = CONFIG.canvas.groundLevel - player.height;
    }
}

window.addEventListener('resize', resizeCanvas);

let gameState = 'start';
let score = 0;
let bonusScore = 0;
let lives = CONFIG.game.maxLives;
let gameStartTime = 0;
let lastObstacleTime = 0;
let currentSpeed = CONFIG.obstacle.speed;
let obstacles = [];
let apples = [];
let powerups = [];
let floatingTexts = [];
let keys = {};
let clouds = [];
let animationFrame = 0;
let particles = [];
let invincible = false;
let invincibleEndTime = 0;
let magnetActive = false;
let magnetEndTime = 0;
let playerEmotion = 'happy';
let emotionEndTime = 0;
let applesCollected = 0;
let lastEncouragementTime = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let backgroundMusic = null;

function playJumpSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.12);
}

function playDuckSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
}

function playCollectSound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);

    oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(1400, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.15);
    oscillator2.stop(audioContext.currentTime + 0.15);
}

function playEatingSound() {
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.15, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.15);
}

function playPowerUpSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playHurtSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playGameOverSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function startBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.oscillator.stop();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(262, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);

    oscillator.start();

    backgroundMusic = { oscillator, gainNode };

    playMelody();
}

function playMelody() {
    if (gameState !== 'playing') return;

    const notes = [523, 587, 659, 698, 784, 698, 659, 587];
    const noteDuration = 0.25;
    let currentNote = 0;

    function playNextNote() {
        if (gameState !== 'playing' || !backgroundMusic) return;

        backgroundMusic.oscillator.frequency.setValueAtTime(
            notes[currentNote % notes.length],
            audioContext.currentTime
        );

        currentNote++;
        setTimeout(playNextNote, noteDuration * 1000);
    }

    playNextNote();
}

function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.oscillator.stop();
        backgroundMusic = null;
    }
}

class Cloud {
    constructor() {
        this.x = CONFIG.canvas.width + Math.random() * 200;
        this.y = window.innerHeight * 0.125 + Math.random() * window.innerHeight * 0.25;
        this.width = 60 + Math.random() * 40;
        this.height = 30 + Math.random() * 20;
        this.speed = 0.5 + Math.random() * 0.5;
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = CONFIG.canvas.width;
            this.y = window.innerHeight * 0.125 + Math.random() * window.innerHeight * 0.25;
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.height / 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 3, this.y - this.height / 4, this.height / 2.5, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 1.5, this.y, this.height / 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Apple {
    constructor() {
        this.width = CONFIG.apple.width;
        this.height = CONFIG.apple.height;
        this.x = CONFIG.canvas.width;
        const yPositions = CONFIG.apple.getYPositions();
        this.y = yPositions[Math.floor(Math.random() * yPositions.length)];
        this.bounce = 0;
    }

    update() {
        this.x -= currentSpeed;
        this.bounce += 0.1;
    }

    draw() {
        const bounceY = Math.sin(this.bounce) * 3;

        ctx.fillStyle = '#FF3333';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + bounceY, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#CC0000';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 + 3, this.y + bounceY + 3, this.width / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + bounceY - this.height / 2, 4, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 4, this.y + bounceY - 4, 3, 0.5, 2);
        ctx.stroke();
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 2;
        this.life = 1.0;
        this.color = ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB'][Math.floor(Math.random() * 4)];
        this.size = 3 + Math.random() * 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;
        this.life -= 0.02;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    isDead() {
        return this.life <= 0;
    }
}

class FloatingText {
    constructor(x, y, text, color = '#FFD700') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.vy = -1.5;
    }

    update() {
        this.y += this.vy;
        this.life -= 0.015;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.font = 'bold 24px Comic Sans MS';
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class PowerUp {
    constructor(type) {
        this.type = type;
        if (type === 'star') {
            this.width = CONFIG.powerup.star.width;
            this.height = CONFIG.powerup.star.height;
        } else {
            this.width = CONFIG.powerup.magnet.width;
            this.height = CONFIG.powerup.magnet.height;
        }
        this.x = CONFIG.canvas.width;
        const yPositions = CONFIG.apple.getYPositions();
        this.y = yPositions[Math.floor(Math.random() * yPositions.length)];
        this.rotation = 0;
    }

    update() {
        this.x -= currentSpeed;
        this.rotation += 0.1;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'star') {
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const outerRadius = this.width / 2;
                const innerRadius = this.width / 4;

                const x1 = Math.cos(angle) * outerRadius;
                const y1 = Math.sin(angle) * outerRadius;
                const x2 = Math.cos(angle + Math.PI / 5) * innerRadius;
                const y2 = Math.sin(angle + Math.PI / 5) * innerRadius;

                if (i === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = '#DC143C';
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 2;

            ctx.fillRect(-this.width / 2, -2, this.width, 4);
            ctx.strokeRect(-this.width / 2, -2, this.width, 4);

            ctx.fillRect(-2, -this.height / 2, 4, this.height);
            ctx.strokeRect(-2, -this.height / 2, 4, this.height);

            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.arc(-this.width / 3, -this.height / 3, 6, 0, Math.PI * 2);
            ctx.arc(this.width / 3, -this.height / 3, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

const player = {
    x: CONFIG.player.x,
    y: CONFIG.canvas.groundLevel - CONFIG.player.height,
    width: CONFIG.player.width,
    height: CONFIG.player.height,
    velocity: 0,
    isJumping: false,
    isDucking: false,

    jump() {
        if (!this.isJumping && !this.isDucking) {
            this.velocity = CONFIG.game.jumpVelocity;
            this.isJumping = true;
            playJumpSound();
        }
    },

    duck() {
        if (!this.isJumping && !this.isDucking) {
            this.isDucking = true;
            this.y = CONFIG.canvas.groundLevel - CONFIG.player.duckHeight;
            this.height = CONFIG.player.duckHeight;
            playDuckSound();
        }
    },

    stopDucking() {
        if (this.isDucking) {
            this.isDucking = false;
            this.height = CONFIG.player.height;
            this.y = CONFIG.canvas.groundLevel - CONFIG.player.height;
        }
    },

    update() {
        if (this.isJumping) {
            this.velocity += CONFIG.game.gravity;
            this.y += this.velocity;

            if (this.y >= CONFIG.canvas.groundLevel - this.height) {
                this.y = CONFIG.canvas.groundLevel - this.height;
                this.velocity = 0;
                this.isJumping = false;
            }
        }
    },

    draw() {
        const legOffset = Math.sin(animationFrame * 0.2) * 3;
        const blinkPhase = animationFrame % 120;

        if (invincible) {
            const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
            const colorIndex = Math.floor(animationFrame / 5) % rainbowColors.length;
            ctx.shadowBlur = 15;
            ctx.shadowColor = rainbowColors[colorIndex];
        }

        if (this.isDucking) {
            ctx.fillStyle = CONFIG.player.color;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = CONFIG.player.eyeColor;
            ctx.beginPath();
            if (blinkPhase > 115) {
                ctx.fillRect(this.x + 10, this.y + 12, 8, 2);
                ctx.fillRect(this.x + 22, this.y + 12, 8, 2);
            } else {
                const eyeSize = playerEmotion === 'scared' ? 6 : 4;
                ctx.arc(this.x + 14, this.y + 12, eyeSize, 0, Math.PI * 2);
                ctx.arc(this.x + 26, this.y + 12, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(this.x + 15, this.y + 12, 2, 0, Math.PI * 2);
                ctx.arc(this.x + 27, this.y + 12, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.arc(this.x + 8, this.y + 16, 3, 0, Math.PI * 2);
            ctx.arc(this.x + 32, this.y + 16, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = CONFIG.player.color;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + 15, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFD1DC';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + 35, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = CONFIG.player.eyeColor;
            ctx.beginPath();
            if (blinkPhase > 115) {
                ctx.fillRect(this.x + 12, this.y + 12, 6, 2);
                ctx.fillRect(this.x + 22, this.y + 12, 6, 2);
            } else {
                const eyeSize = playerEmotion === 'scared' ? 6 : 5;
                ctx.arc(this.x + 15, this.y + 12, eyeSize, 0, Math.PI * 2);
                ctx.arc(this.x + 25, this.y + 12, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#333';
                const pupilSize = playerEmotion === 'scared' ? 4 : 3;
                ctx.beginPath();
                ctx.arc(this.x + 16, this.y + 12, pupilSize, 0, Math.PI * 2);
                ctx.arc(this.x + 26, this.y + 12, pupilSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(this.x + 17, this.y + 11, 1.5, 0, Math.PI * 2);
                ctx.arc(this.x + 27, this.y + 11, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(this.x + 8, this.y + 16, 4, 0, Math.PI * 2);
            ctx.arc(this.x + 32, this.y + 16, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FF1493';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (playerEmotion === 'happy') {
                ctx.arc(this.x + 20, this.y + 20, 6, 0.2, Math.PI - 0.2);
            } else if (playerEmotion === 'scared') {
                ctx.arc(this.x + 20, this.y + 23, 5, Math.PI + 0.2, Math.PI * 2 - 0.2);
            } else {
                ctx.moveTo(this.x + 14, this.y + 22);
                ctx.lineTo(this.x + 26, this.y + 22);
            }
            ctx.stroke();

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y - 2);
            ctx.lineTo(this.x + 14, this.y + 4);
            ctx.lineTo(this.x + 26, this.y + 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            if (!this.isJumping && applesCollected > 0 && applesCollected % 10 === 0 && animationFrame % 20 < 10) {
                const danceOffset = Math.sin(animationFrame * 0.5) * 5;
                ctx.save();
                ctx.translate(this.x + this.width / 2, this.y + 35);
                ctx.rotate(danceOffset * 0.1);
                ctx.translate(-(this.x + this.width / 2), -(this.y + 35));
            }

            if (!this.isJumping) {
                ctx.fillStyle = '#FFB6C1';
                ctx.beginPath();
                ctx.arc(this.x + 13, this.y + 55 + legOffset, 6, 0, Math.PI * 2);
                ctx.arc(this.x + 27, this.y + 55 - legOffset, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FF69B4';
                ctx.fillRect(this.x + 11, this.y + 48, 5, 8 + legOffset);
                ctx.fillRect(this.x + 24, this.y + 48, 5, 8 - legOffset);
            }

            if (applesCollected > 0 && applesCollected % 10 === 0 && animationFrame % 20 < 10) {
                ctx.restore();
            }
        }

        ctx.shadowBlur = 0;
    },

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    },

    reset() {
        this.x = CONFIG.player.x;
        this.y = CONFIG.canvas.groundLevel - CONFIG.player.height;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.velocity = 0;
        this.isJumping = false;
        this.isDucking = false;
    }
};

class Obstacle {
    constructor(type) {
        this.type = type;

        if (type === 'wall') {
            this.width = CONFIG.obstacle.wall.width;
            this.height = CONFIG.obstacle.wall.height;
            this.color = CONFIG.obstacle.wall.color;
            this.y = CONFIG.canvas.groundLevel - this.height;
        } else {
            this.width = CONFIG.obstacle.drone.width;
            this.height = CONFIG.obstacle.drone.height;
            this.color = CONFIG.obstacle.drone.color;
            this.y = CONFIG.obstacle.drone.getY();
        }

        this.x = CONFIG.canvas.width;
    }

    update() {
        this.x -= currentSpeed;
    }

    draw() {
        if (this.type === 'wall') {
            ctx.fillStyle = '#DEB887';
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(this.x + 10, this.y + 20, 2, 0, Math.PI * 2);
            ctx.arc(this.x + 20, this.y + 20, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 30, 4, 0.2, Math.PI - 0.2);
            ctx.stroke();

            ctx.fillStyle = '#A0522D';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + 5, this.y + 45 + i * 3, this.width - 10, 2);
            }
        } else {
            const propellerAngle = (animationFrame * 0.5) % (Math.PI * 2);
            const bobble = Math.sin(animationFrame * 0.1) * 2;

            ctx.fillStyle = '#9B59B6';
            ctx.strokeStyle = '#7D3C98';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2 + bobble, this.width / 2 - 2, this.height / 2 - 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + 18, this.y + this.height / 2 + bobble - 3, 4, 0, Math.PI * 2);
            ctx.arc(this.x + this.width - 18, this.y + this.height / 2 + bobble - 3, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(this.x + 19, this.y + this.height / 2 + bobble - 3, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width - 17, this.y + this.height / 2 + bobble - 3, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#7D3C98';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + bobble + 4, 5, 0.3, Math.PI - 0.3);
            ctx.stroke();

            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;

            ctx.save();
            ctx.translate(this.x + 12, this.y - 5 + bobble);
            ctx.rotate(propellerAngle);
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x + this.width - 12, this.y - 5 + bobble);
            ctx.rotate(propellerAngle);
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            ctx.restore();

            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 12, this.y + bobble);
            ctx.lineTo(this.x + 12, this.y - 5 + bobble);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 12, this.y + bobble);
            ctx.lineTo(this.x + this.width - 12, this.y - 5 + bobble);
            ctx.stroke();
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

function checkCollision(player, obstacle) {
    const p = player.getBounds();
    const o = obstacle.getBounds();

    return !(p.right < o.left ||
             p.left > o.right ||
             p.bottom < o.top ||
             p.top > o.bottom);
}

function spawnObstacle(currentTime) {
    if (currentTime - lastObstacleTime > CONFIG.obstacle.minGap + Math.random() * (CONFIG.obstacle.maxGap - CONFIG.obstacle.minGap)) {
        const type = Math.random() < 0.5 ? 'wall' : 'drone';
        obstacles.push(new Obstacle(type));
        lastObstacleTime = currentTime;

        if (Math.random() < CONFIG.apple.spawnChance) {
            setTimeout(() => {
                apples.push(new Apple());
            }, 500 + Math.random() * 1000);
        }

        if (Math.random() < CONFIG.powerup.star.spawnChance) {
            setTimeout(() => {
                powerups.push(new PowerUp('star'));
            }, 800 + Math.random() * 1200);
        } else if (Math.random() < CONFIG.powerup.magnet.spawnChance) {
            setTimeout(() => {
                powerups.push(new PowerUp('magnet'));
            }, 800 + Math.random() * 1200);
        }
    }
}

function showEncouragingMessage() {
    const messages = [
        "Great job!",
        "Awesome!",
        "You're doing amazing!",
        "Super star!",
        "Fantastic!",
        "Keep it up!",
        "Wow!",
        "Incredible!",
        "You're the best!"
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    floatingTexts.push(new FloatingText(CONFIG.canvas.width / 2 - 50, window.innerHeight * 0.25, message, '#FF69B4'));
}

function updateSpeed(currentTime) {
    const elapsedSeconds = Math.floor(currentTime / 1000);
    const speedIncreases = Math.floor(elapsedSeconds / (CONFIG.game.speedIncreaseInterval / 1000));
    currentSpeed = CONFIG.obstacle.speed + (speedIncreases * CONFIG.game.speedIncreaseAmount);
}

function updateScore(currentTime) {
    score = Math.floor(currentTime / 100) + bonusScore;
    scoreDisplay.textContent = `Score: ${score}`;
}

function drawGround() {
    ctx.fillStyle = '#98D8C8';
    ctx.fillRect(0, CONFIG.canvas.groundLevel, CONFIG.canvas.width, CONFIG.canvas.height - CONFIG.canvas.groundLevel);

    ctx.fillStyle = '#7BC8A4';
    const grassSpacing = Math.max(20, CONFIG.canvas.width / 40);
    for (let i = 0; i < CONFIG.canvas.width; i += grassSpacing) {
        const offset = Math.sin((i + animationFrame) * 0.05) * 3;
        ctx.beginPath();
        ctx.moveTo(i, CONFIG.canvas.groundLevel);
        ctx.lineTo(i + 5, CONFIG.canvas.groundLevel - 5 + offset);
        ctx.lineTo(i + 10, CONFIG.canvas.groundLevel);
        ctx.fill();
    }

    ctx.fillStyle = '#FFD700';
    const numFlowers = Math.floor(CONFIG.canvas.width / 80);
    for (let i = 0; i < numFlowers; i++) {
        const x = (i * 80 + animationFrame * 0.2) % CONFIG.canvas.width;
        const groundOffset = (CONFIG.canvas.height - CONFIG.canvas.groundLevel) * 0.2;
        const y = CONFIG.canvas.groundLevel + groundOffset + Math.sin(i) * 10;
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
            const angle = (Math.PI * 2 * j) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * 3;
            const py = y + Math.sin(angle) * 3;
            if (j === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}

function update() {
    if (gameState !== 'playing') return;

    const currentTime = Date.now() - gameStartTime;
    animationFrame++;

    updateSpeed(currentTime);
    updateScore(currentTime);

    if (invincible && Date.now() > invincibleEndTime) {
        invincible = false;
    }

    if (magnetActive && Date.now() > magnetEndTime) {
        magnetActive = false;
    }

    if (Date.now() > emotionEndTime) {
        playerEmotion = 'happy';
    }

    if (currentTime - lastEncouragementTime > 15000 && Math.random() < 0.3) {
        showEncouragingMessage();
        lastEncouragementTime = currentTime;
    }

    player.update();

    if (keys['ArrowDown']) {
        player.duck();
    } else {
        player.stopDucking();
    }

    clouds.forEach(cloud => cloud.update());

    spawnObstacle(currentTime);

    let closestObstacle = null;
    let closestDistance = Infinity;

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();

        const distance = obstacles[i].x - (player.x + player.width);
        if (distance > 0 && distance < closestDistance) {
            closestDistance = distance;
            closestObstacle = obstacles[i];
        }

        if (checkCollision(player, obstacles[i])) {
            if (!invincible) {
                lives--;
                playHurtSound();
                playerEmotion = 'scared';
                emotionEndTime = Date.now() + 1000;

                for (let j = 0; j < 20; j++) {
                    particles.push(new Particle(player.x + player.width / 2, player.y + player.height / 2));
                }

                if (lives <= 0) {
                    gameOver();
                    return;
                } else {
                    floatingTexts.push(new FloatingText(player.x, player.y - 20, `${lives} ❤️ left`, '#FF1493'));
                    invincible = true;
                    invincibleEndTime = Date.now() + 1500;
                }
            }
        }

        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
        }
    }

    if (closestObstacle && closestDistance < 30 && !invincible) {
        if (playerEmotion !== 'scared') {
            playerEmotion = 'scared';
            emotionEndTime = Date.now() + 500;
        }
    }

    for (let i = apples.length - 1; i >= 0; i--) {
        apples[i].update();

        const distanceToApple = Math.hypot(
            (apples[i].x + apples[i].width / 2) - (player.x + player.width / 2),
            apples[i].y - (player.y + player.height / 2)
        );

        if (magnetActive && distanceToApple < CONFIG.powerup.magnet.range) {
            const dx = (player.x + player.width / 2) - (apples[i].x + apples[i].width / 2);
            const dy = (player.y + player.height / 2) - apples[i].y;
            apples[i].x += dx * 0.15;
            apples[i].y += dy * 0.15;
        }

        if (checkCollision(player, apples[i])) {
            bonusScore += CONFIG.apple.points;
            applesCollected++;
            floatingTexts.push(new FloatingText(apples[i].x, apples[i].y, '+100', '#FFD700'));
            for (let j = 0; j < 15; j++) {
                particles.push(new Particle(apples[i].x + apples[i].width / 2, apples[i].y));
            }
            playEatingSound();
            playerEmotion = 'happy';
            emotionEndTime = Date.now() + 1000;
            apples.splice(i, 1);

            if (applesCollected % 10 === 0) {
                floatingTexts.push(new FloatingText(player.x, player.y - 40, '🎉 AMAZING! 🎉', '#FF69B4'));
            }
        } else if (apples[i].isOffScreen()) {
            apples.splice(i, 1);
        }
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update();

        if (checkCollision(player, powerups[i])) {
            if (powerups[i].type === 'star') {
                invincible = true;
                invincibleEndTime = Date.now() + CONFIG.powerup.star.duration;
                floatingTexts.push(new FloatingText(powerups[i].x, powerups[i].y, '⭐ INVINCIBLE!', '#FFD700'));
            } else if (powerups[i].type === 'magnet') {
                magnetActive = true;
                magnetEndTime = Date.now() + CONFIG.powerup.magnet.duration;
                floatingTexts.push(new FloatingText(powerups[i].x, powerups[i].y, '🧲 MAGNET!', '#DC143C'));
            }
            playPowerUpSound();
            for (let j = 0; j < 20; j++) {
                particles.push(new Particle(powerups[i].x + powerups[i].width / 2, powerups[i].y));
            }
            powerups.splice(i, 1);
        } else if (powerups[i].isOffScreen()) {
            powerups.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        if (floatingTexts[i].isDead()) {
            floatingTexts.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    clouds.forEach(cloud => cloud.draw());

    drawGround();

    apples.forEach(apple => apple.draw());

    powerups.forEach(powerup => powerup.draw());

    player.draw();

    obstacles.forEach(obstacle => obstacle.draw());

    particles.forEach(particle => particle.draw());

    floatingTexts.forEach(text => text.draw());

    for (let i = 0; i < CONFIG.game.maxLives; i++) {
        ctx.fillStyle = i < lives ? '#FF1493' : '#555';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20 + i * 35, 30);
        ctx.bezierCurveTo(20 + i * 35, 25, 15 + i * 35, 20, 10 + i * 35, 20);
        ctx.bezierCurveTo(0 + i * 35, 20, 0 + i * 35, 30, 0 + i * 35, 30);
        ctx.bezierCurveTo(0 + i * 35, 40, 10 + i * 35, 50, 20 + i * 35, 55);
        ctx.bezierCurveTo(30 + i * 35, 50, 40 + i * 35, 40, 40 + i * 35, 30);
        ctx.bezierCurveTo(40 + i * 35, 30, 40 + i * 35, 20, 30 + i * 35, 20);
        ctx.bezierCurveTo(25 + i * 35, 20, 20 + i * 35, 25, 20 + i * 35, 30);
        ctx.fill();
        ctx.stroke();
    }

    if (invincible) {
        const timeLeft = Math.ceil((invincibleEndTime - Date.now()) / 1000);
        ctx.font = 'bold 16px Comic Sans MS';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`⭐ ${timeLeft}s`, 20, 80);
    }

    if (magnetActive) {
        const timeLeft = Math.ceil((magnetEndTime - Date.now()) / 1000);
        ctx.font = 'bold 16px Comic Sans MS';
        ctx.fillStyle = '#DC143C';
        ctx.fillText(`🧲 ${timeLeft}s`, 20, invincible ? 100 : 80);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'playing';
    score = 0;
    bonusScore = 0;
    lives = CONFIG.game.maxLives;
    gameStartTime = Date.now();
    lastObstacleTime = 0;
    lastEncouragementTime = 0;
    currentSpeed = CONFIG.obstacle.speed;
    obstacles = [];
    apples = [];
    powerups = [];
    particles = [];
    floatingTexts = [];
    animationFrame = 0;
    invincible = false;
    magnetActive = false;
    playerEmotion = 'happy';
    applesCollected = 0;
    player.reset();

    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push(new Cloud());
    }

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreDisplay.textContent = 'Score: 0';

    startBackgroundMusic();
}

function gameOver() {
    gameState = 'gameOver';
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
    stopBackgroundMusic();
    playGameOverSound();
}

function restartGame() {
    startGame();
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        player.jump();
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

gameLoop();
