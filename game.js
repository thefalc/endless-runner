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
        color: '#FF4444',
        eyeColor: 'white',
        duckHeight: 30
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
let gameStartTime = 0;
let lastObstacleTime = 0;
let currentSpeed = CONFIG.obstacle.speed;
let obstacles = [];
let keys = {};
let clouds = [];
let animationFrame = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let backgroundMusic = null;

function playJumpSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

function playDuckSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
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

    const notes = [262, 294, 330, 349, 392, 349, 330, 294];
    const noteDuration = 0.3;
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

        if (this.isDucking) {
            ctx.fillStyle = CONFIG.player.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.fillStyle = CONFIG.player.eyeColor;
            ctx.fillRect(this.x + 10, this.y + 8, 8, 8);
            ctx.fillRect(this.x + 22, this.y + 8, 8, 8);

            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x + 15, this.y - 8, 12, 8);
        } else {
            ctx.fillStyle = CONFIG.player.color;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height * 0.4, 5);
            ctx.fill();

            ctx.fillStyle = '#FF6666';
            ctx.beginPath();
            ctx.roundRect(this.x, this.y + this.height * 0.4, this.width, this.height * 0.6, 5);
            ctx.fill();

            ctx.fillStyle = CONFIG.player.eyeColor;
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y + 12, 4, 0, Math.PI * 2);
            ctx.arc(this.x + 28, this.y + 12, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(this.x + 13, this.y + 12, 2, 0, Math.PI * 2);
            ctx.arc(this.x + 29, this.y + 12, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + 20, this.y + 20, 5, 0, Math.PI);
            ctx.stroke();

            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x + 8, this.y - 12, 24, 12);
            ctx.fillRect(this.x + 12, this.y - 18, 16, 6);

            if (!this.isJumping) {
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x + 8, this.y + this.height, 10, 8 + legOffset);
                ctx.fillRect(this.x + 22, this.y + this.height, 10, 8 - legOffset);

                ctx.fillStyle = '#654321';
                ctx.fillRect(this.x + 8, this.y + this.height + 8 + legOffset, 10, 4);
                ctx.fillRect(this.x + 22, this.y + this.height + 8 - legOffset, 10, 4);
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
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + (i + 1) * 15);
                ctx.lineTo(this.x + this.width, this.y + (i + 1) * 15);
                ctx.stroke();
            }

            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, 8);
            ctx.fillRect(this.x + 5, this.y + 25, this.width - 10, 8);
            ctx.fillRect(this.x + 5, this.y + 45, this.width - 10, 8);
        } else {
            const propellerAngle = (animationFrame * 0.5) % (Math.PI * 2);

            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + this.width / 2 - 3, this.y + this.height / 2 - 3, 6, 6);

            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.x + this.width - 12, this.y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#777';
            ctx.lineWidth = 2;

            ctx.save();
            ctx.translate(this.x + 12, this.y - 5);
            ctx.rotate(propellerAngle);
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(0, 8);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x + this.width - 12, this.y - 5);
            ctx.rotate(propellerAngle);
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(0, 8);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width / 2 - 5, this.y + this.height + 8);
            ctx.lineTo(this.x + this.width / 2 + 5, this.y + this.height + 8);
            ctx.fill();
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
    }
}

function updateSpeed(currentTime) {
    const elapsedSeconds = Math.floor(currentTime / 1000);
    const speedIncreases = Math.floor(elapsedSeconds / (CONFIG.game.speedIncreaseInterval / 1000));
    currentSpeed = CONFIG.obstacle.speed + (speedIncreases * CONFIG.game.speedIncreaseAmount);
}

function updateScore(currentTime) {
    score = Math.floor(currentTime / 100);
    scoreDisplay.textContent = `Score: ${score}`;
}

function drawGround() {
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, CONFIG.canvas.groundLevel, CONFIG.canvas.width, CONFIG.canvas.height - CONFIG.canvas.groundLevel);
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
}

function draw() {
    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    clouds.forEach(cloud => cloud.draw());

    drawGround();

    player.draw();

    obstacles.forEach(obstacle => obstacle.draw());
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'playing';
    score = 0;
    gameStartTime = Date.now();
    lastObstacleTime = 0;
    currentSpeed = CONFIG.obstacle.speed;
    obstacles = [];
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
