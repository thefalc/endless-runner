# 🎮 Endless Runner Game

A cute and colorful browser-based endless runner game designed for young players! Jump over walls, duck under drones, and collect apples for bonus points in this adorable adventure.

## ✨ Features

- 🎨 **Adorable Graphics**: Cute pink character with a crown, rosy cheeks, and blinking eyes
- 🍎 **Collectible Apples**: Grab bouncing apples for +100 bonus points each
- 🎵 **Sound Effects**: Cheerful jump, duck, and collection sounds with upbeat background music
- 🌈 **Beautiful Visuals**: Animated clouds, twinkling stars, and colorful particle effects
- 📈 **Progressive Difficulty**: Game speed increases over time for an ongoing challenge
- 💯 **Score Tracking**: Time-based scoring plus bonus points from apple collection

## 🎯 How to Play

### Starting the Game
1. Open `index.html` in any modern web browser
2. Click the "Start Game" button
3. Get ready to run!

### Controls
- **⬆️ UP Arrow**: Jump over walls
- **⬇️ DOWN Arrow**: Duck under drones (hold to stay ducked)

### Gameplay
- Avoid obstacles to survive as long as possible
- **Walls** appear on the ground - jump over them
- **Drones** fly at head height - duck under them
- **Apples** appear randomly - run into them to collect +100 points
- Your score increases over time and with each apple collected
- The game gets faster every 10 seconds!

## 🚀 Getting Started

### Requirements
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No installation or dependencies needed!

### Running the Game
1. Download or clone this repository
2. Open `index.html` in your web browser
3. That's it! No build process or server required

### File Structure
```
endless-runner/
├── index.html    # Main HTML file with game structure
├── style.css     # Styling and visual design
├── game.js       # Complete game logic and mechanics
└── README.md     # This file
```

## 🎨 Game Elements

### Player Character
- Cute pink round character with a golden crown
- Big sparkly eyes that blink
- Rosy cheeks and a happy smile
- Animated walking legs

### Obstacles
- **🧱 Walls**: Tan blocks with smiley faces at ground level
- **🚁 Drones**: Purple flying robots with spinning propellers and cute expressions

### Collectibles
- **🍎 Apples**: Red bouncing apples that give +100 points when collected
- Spawn randomly at different heights
- Create colorful particle explosions when collected

### Environment
- Fluffy white clouds drifting by
- Animated grass with twinkling star effects
- Pink-to-blue gradient sky
- Teal grass ground

## ⚙️ Configuration

You can adjust the game difficulty by modifying the `CONFIG` object in `game.js`:

### Make it Easier (Recommended for Young Players)
```javascript
CONFIG.game.gravity = 0.5              // Slower falling
CONFIG.game.jumpVelocity = -10         // Lower jumps
CONFIG.obstacle.minGap = 2000          // More time between obstacles
CONFIG.obstacle.speed = 4              // Slower initial speed
CONFIG.game.speedIncreaseAmount = 0.3  // Gentler difficulty curve
```

### Make it Harder (For Experienced Players)
```javascript
CONFIG.game.gravity = 0.8              // Faster falling
CONFIG.game.jumpVelocity = -14         // Higher jumps
CONFIG.obstacle.minGap = 1000          // Less time between obstacles
CONFIG.obstacle.speed = 6              // Faster initial speed
CONFIG.game.speedIncreaseAmount = 0.7  // Steeper difficulty curve
```

### Adjust Apple Spawn Rate
```javascript
CONFIG.apple.spawnChance = 0.5         // More apples (50% chance)
CONFIG.apple.spawnChance = 0.2         // Fewer apples (20% chance)
```

## 🎵 Audio

The game features:
- **Background Music**: Cheerful melodic loop during gameplay
- **Jump Sound**: Upward swoosh effect
- **Duck Sound**: Downward swoosh effect
- **Apple Collection**: Sparkly "ding" sound
- **Game Over**: Descending tone

Audio is generated using the Web Audio API - no external files needed!

## 🛠️ Technologies Used

- **HTML5 Canvas**: For rendering game graphics
- **JavaScript**: Game logic and mechanics
- **CSS3**: Styling and animations
- **Web Audio API**: Sound effects and music

## 🎓 Learning Notes

This game demonstrates:
- Canvas drawing and animation
- Game loop with `requestAnimationFrame`
- Collision detection (AABB algorithm)
- Particle systems
- Object-oriented programming
- Event handling (keyboard input)
- Procedural audio generation
- State management

## 🎯 Scoring System

- **Time Score**: 1 point per 100 milliseconds survived
- **Bonus Score**: +100 points for each apple collected
- **Final Score**: Time score + bonus score

Try to beat your high score!

## 🐛 Troubleshooting

**No sound?**
- Check your browser's volume settings
- Some browsers require user interaction before playing audio
- Click the start button to enable audio

**Game running slow?**
- Close other browser tabs
- Try a different browser
- The game targets 60 FPS

**Controls not working?**
- Make sure the game window has focus (click on it)
- Check that you're using arrow keys, not WASD

## 📝 License

This project is open source and available for educational purposes.

## 🎉 Credits

Created with love for young gamers everywhere! Have fun playing! 🌟

---

**Tip**: Practice your timing! Jump early for walls and duck just before drones reach you. Good luck! 🍀
