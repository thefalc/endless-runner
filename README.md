# 🎮 Endless Runner Game

A cute and colorful browser-based endless runner game designed for young players! Jump over walls, duck under drones, and collect apples for bonus points in this adorable adventure.

## ✨ Features

- 🎨 **Adorable Graphics**: Cute pink character with a crown, rosy cheeks, and blinking eyes
- ❤️ **Lives System**: 3 hearts - forgiving gameplay for young players!
- 🍎 **Collectible Apples**: Grab bouncing apples for +100 bonus points each
- ⭐ **Power-Ups**: Star for invincibility, magnet for auto-collecting apples
- 💬 **Encouraging Messages**: Positive reinforcement to build confidence
- 😊 **Character Reactions**: Emotional expressions and victory dance animations
- 🎵 **Sound Effects**: Cheerful sounds including realistic apple eating effects
- 🌈 **Beautiful Visuals**: Animated clouds, twinkling stars, and colorful particle effects
- 📈 **Progressive Difficulty**: Game speed increases over time for an ongoing challenge
- 💯 **Score Tracking**: Time-based scoring plus bonus points from collectibles

## 🎯 How to Play

### Starting the Game
1. Open `index.html` in any modern web browser
2. Click the "Start Game" button
3. Get ready to run!

### Controls
- **⬆️ UP Arrow**: Jump over walls
- **⬇️ DOWN Arrow**: Duck under drones (hold to stay ducked)

### Gameplay
- You have **3 hearts** - don't worry if you hit an obstacle!
- Avoid obstacles to survive as long as possible
- **Walls** appear on the ground - jump over them
- **Drones** fly at head height - duck under them
- **Apples** appear randomly - run into them to collect +100 points
- **Stars** give you 5 seconds of invincibility with a rainbow glow
- **Magnets** auto-collect nearby apples for 8 seconds
- Your score increases over time and with each collectible
- The game gets faster every 10 seconds!
- Encouraging messages appear to cheer you on
- Your character reacts with different expressions

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
- Rosy cheeks and expressive face
- Animated walking legs
- **Emotional reactions:**
  - 😊 Happy face when collecting apples or playing normally
  - 😨 Scared face when obstacles get close
  - 🎉 Victory dance every 10 apples collected

### Obstacles
- **🧱 Walls**: Tan blocks with smiley faces at ground level
- **🚁 Drones**: Purple flying robots with spinning propellers and cute expressions

### Collectibles
- **🍎 Apples**: Red bouncing apples that give +100 points when collected
  - Spawn randomly at different heights
  - Create colorful particle explosions when collected
  - Realistic crunching sound effect
- **⭐ Star Power-Up**: Golden spinning star
  - 5 seconds of invincibility
  - Rainbow glow effect while active
  - Can run through obstacles safely
- **🧲 Magnet Power-Up**: Red magnet
  - 8 seconds of auto-collecting
  - Nearby apples fly toward you automatically
  - Makes collecting much easier

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

### Adjust Collectible Spawn Rates
```javascript
CONFIG.apple.spawnChance = 0.5         // More apples (50% chance)
CONFIG.apple.spawnChance = 0.2         // Fewer apples (20% chance)

CONFIG.powerup.star.spawnChance = 0.3  // More stars (30% chance)
CONFIG.powerup.magnet.spawnChance = 0.3 // More magnets (30% chance)
```

### Adjust Lives
```javascript
CONFIG.game.maxLives = 5               // More forgiving (5 hearts)
CONFIG.game.maxLives = 1               // Classic mode (1 heart, instant game over)
```

## 🎵 Audio

The game features:
- **Background Music**: Cheerful melodic loop during gameplay
- **Jump Sound**: Upward swoosh effect
- **Duck Sound**: Downward swoosh effect
- **Apple Eating**: Realistic crunching/chomping sound
- **Power-Up Collection**: Ascending chime effect
- **Getting Hurt**: Brief descending tone
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
- **Special Celebrations**: Every 10 apples triggers a victory dance and "AMAZING!" message

Try to beat your high score!

## ❤️ Lives & Power-Ups

### Lives System
- Start with **3 hearts** displayed in the top-left corner
- Hitting an obstacle removes 1 heart (not instant game over!)
- Brief invincibility period after getting hurt
- Game over only when all hearts are lost
- Perfect for young players learning the game

### Power-Up Effects
- **⭐ Star Power**: Rainbow glow, run through obstacles safely
- **🧲 Magnet Power**: Apples automatically fly toward you
- Active power-up timers shown on screen
- Power-ups spawn randomly throughout gameplay

## 💬 Encouragement System

The game includes positive reinforcement to keep young players motivated:
- Random encouraging messages every ~15 seconds
- Messages include: "Great job!", "Awesome!", "You're doing amazing!", "Super star!", etc.
- Special celebration every 10 apples collected
- Character shows happiness when doing well

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

**Tips**:
- 🎯 Practice your timing! Jump early for walls and duck just before drones reach you
- ⭐ Use star power-ups when facing multiple obstacles
- 🧲 Activate magnets when lots of apples are on screen
- ❤️ You have 3 chances - don't give up after one mistake!
- 🍎 Collect apples in groups of 10 for special celebrations

Good luck! 🍀
