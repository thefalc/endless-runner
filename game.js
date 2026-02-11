const CONFIG = {
    canvas: {
        width: 800,
        height: 400,
        groundLevel: 280
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
        yPositions: [220, 180, 250]
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
            y: 200
        },
        speed: 5,
        minGap: 1500,
        maxGap: 3000
    },
    game: {
        gravity: 0.6,
        jumpVelocity: -12,
        speedIncreaseInterval: 10000,
        speedIncreaseAmount: 0.5
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

let gameState = 'start';
let score = 0;
let bonusScore = 0;
let gameStartTime = 0;
let lastObstacleTime = 0;
let currentSpeed = CONFIG.obstacle.speed;
let obstacles = [];
let apples = [];
let floatingTexts = [];
let keys = {};
let clouds = [];
let animationFrame = 0;
let particles = [];

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
        this.y = 50 + Math.random() * 100;
        this.width = 60 + Math.random() * 40;
        this.height = 30 + Math.random() * 20;
        this.speed = 0.5 + Math.random() * 0.5;
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.x = CONFIG.canvas.width;
            this.y = 50 + Math.random() * 100;
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
        this.y = CONFIG.apple.yPositions[Math.floor(Math.random() * CONFIG.apple.yPositions.length)];
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
    constructor(x, y, text) {
        this.x = x;
        this.y = y;
        this.text = text;
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
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFD700';
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
                ctx.arc(this.x + 14, this.y + 12, 4, 0, Math.PI * 2);
                ctx.arc(this.x + 26, this.y + 12, 4, 0, Math.PI * 2);
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
                ctx.arc(this.x + 15, this.y + 12, 5, 0, Math.PI * 2);
                ctx.arc(this.x + 25, this.y + 12, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(this.x + 16, this.y + 12, 3, 0, Math.PI * 2);
                ctx.arc(this.x + 26, this.y + 12, 3, 0, Math.PI * 2);
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
            ctx.arc(this.x + 20, this.y + 20, 6, 0.2, Math.PI - 0.2);
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
        }
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
            this.y = CONFIG.obstacle.drone.y;
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
    }
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
    for (let i = 0; i < CONFIG.canvas.width; i += 20) {
        const offset = Math.sin((i + animationFrame) * 0.05) * 3;
        ctx.beginPath();
        ctx.moveTo(i, CONFIG.canvas.groundLevel);
        ctx.lineTo(i + 5, CONFIG.canvas.groundLevel - 5 + offset);
        ctx.lineTo(i + 10, CONFIG.canvas.groundLevel);
        ctx.fill();
    }

    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 10; i++) {
        const x = (i * 80 + animationFrame * 0.2) % CONFIG.canvas.width;
        const y = CONFIG.canvas.groundLevel + 20 + Math.sin(i) * 10;
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

    player.update();

    if (keys['ArrowDown']) {
        player.duck();
    } else {
        player.stopDucking();
    }

    clouds.forEach(cloud => cloud.update());

    spawnObstacle(currentTime);

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();

        if (checkCollision(player, obstacles[i])) {
            gameOver();
            return;
        }

        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
        }
    }

    for (let i = apples.length - 1; i >= 0; i--) {
        apples[i].update();

        if (checkCollision(player, apples[i])) {
            bonusScore += CONFIG.apple.points;
            floatingTexts.push(new FloatingText(apples[i].x, apples[i].y, '+100'));
            for (let j = 0; j < 15; j++) {
                particles.push(new Particle(apples[i].x + apples[i].width / 2, apples[i].y));
            }
            playCollectSound();
            apples.splice(i, 1);
        } else if (apples[i].isOffScreen()) {
            apples.splice(i, 1);
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

    player.draw();

    obstacles.forEach(obstacle => obstacle.draw());

    particles.forEach(particle => particle.draw());

    floatingTexts.forEach(text => text.draw());
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
    gameStartTime = Date.now();
    lastObstacleTime = 0;
    currentSpeed = CONFIG.obstacle.speed;
    obstacles = [];
    apples = [];
    particles = [];
    floatingTexts = [];
    animationFrame = 0;
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
