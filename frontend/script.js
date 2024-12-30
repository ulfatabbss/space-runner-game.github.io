import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIauKNEMutdBNgGmkeKnX0nzq1N0ShlY0",
  authDomain: "space-runner-3d864.firebaseapp.com",
  projectId: "space-runner-3d864",
  storageBucket: "space-runner-3d864.appspot.com",
  messagingSenderId: "734899975068",
  appId: "1:734899975068:web:faedbcb20b93d590120e59",
  measurementId: "G-XGTFES14TB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Create menu container
const menuContainer = document.createElement("div");
menuContainer.style.position = "absolute";
menuContainer.style.top = "50%";
menuContainer.style.left = "50%";
menuContainer.style.transform = "translate(-50%, -50%)";
menuContainer.style.display = "flex";
menuContainer.style.flexDirection = "column";
menuContainer.style.alignItems = "center";
menuContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
menuContainer.style.padding = "20px";
menuContainer.style.borderRadius = "10px";
menuContainer.style.zIndex = "1000";
menuContainer.style.color = "white";
document.body.appendChild(menuContainer);

const title = document.createElement("h1");
title.textContent = "Space Runner Game";
title.style.marginBottom = "20px";
menuContainer.appendChild(title);

const startButton = document.createElement("button");
startButton.textContent = "Start Game";
startButton.style.marginBottom = "10px";
startButton.style.padding = "10px 20px";
startButton.style.fontSize = "16px";
startButton.style.cursor = "pointer";
menuContainer.appendChild(startButton);

const viewScoresButton = document.createElement("button");
viewScoresButton.textContent = "View High Scores";
viewScoresButton.style.marginBottom = "10px";
viewScoresButton.style.padding = "10px 20px";
viewScoresButton.style.fontSize = "16px";
viewScoresButton.style.cursor = "pointer";
menuContainer.appendChild(viewScoresButton);

const quitButton = document.createElement("button");
quitButton.textContent = "Quit";
quitButton.style.padding = "10px 20px";
quitButton.style.fontSize = "16px";
quitButton.style.cursor = "pointer";
menuContainer.appendChild(quitButton);

const resetButton = document.createElement("button");
resetButton.textContent = "Restart Game";
resetButton.style.padding = "10px 20px";
resetButton.style.fontSize = "16px";
resetButton.style.cursor = "pointer";
resetButton.style.display = "none"; // Hide it initially
menuContainer.appendChild(resetButton);

// Create high scores container
const highScoresContainer = document.createElement("div");
highScoresContainer.style.position = "absolute";
highScoresContainer.style.top = "50%";
highScoresContainer.style.left = "50%";
highScoresContainer.style.transform = "translate(-50%, -50%)";
highScoresContainer.style.display = "none";
highScoresContainer.style.flexDirection = "column";
highScoresContainer.style.alignItems = "center";
highScoresContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
highScoresContainer.style.padding = "20px";
highScoresContainer.style.borderRadius = "10px";
highScoresContainer.style.zIndex = "1000";
highScoresContainer.style.color = "white";
document.body.appendChild(highScoresContainer);

const highScoresTitle = document.createElement("h1");
highScoresTitle.textContent = "High Scores";
highScoresTitle.style.marginBottom = "20px";
highScoresContainer.appendChild(highScoresTitle);

const highScoresList = document.createElement("ul");
highScoresContainer.appendChild(highScoresList);

const backButton = document.createElement("button");
backButton.textContent = "Back to Menu";
backButton.style.marginTop = "20px";
backButton.style.padding = "10px 20px";
backButton.style.fontSize = "16px";
backButton.style.cursor = "pointer";
highScoresContainer.appendChild(backButton);

// Load sound effects
const jumpSound = new Audio("sound/jump.wav"); // Updated to point to the sound folder
jumpSound.preload = "auto"; // Preload jump sound

const collisionSound = new Audio("sound/collision.wav"); // Updated to point to the sound folder
collisionSound.preload = "auto"; // Preload collision sound

// Load background music
const backgroundMusic = new Audio("sound/theme.wav"); // Updated to use the sound folder
backgroundMusic.preload = "auto"; // Preload the music
backgroundMusic.loop = true; // Ensure it loops continuously
backgroundMusic.volume = 0.5; // Set volume to a reasonable level

// Load game over sound
const gameOverSound = new Audio("sound/gameover.wav"); // Game over sound

// Flag to track if music has started
let isMusicPlaying = false;

// Event listener to start music on user interaction
document.addEventListener("keydown", () => {
  if (!isMusicPlaying) {
    backgroundMusic
      .play()
      .then(() => {
        isMusicPlaying = true;
      })
      .catch((error) => {
        console.log("Background music playback failed:", error);
      });
  }
});

document.addEventListener("touchstart", () => {
  if (!isMusicPlaying) {
    backgroundMusic
      .play()
      .then(() => {
        isMusicPlaying = true;
      })
      .catch((error) => {
        console.log("Background music playback failed:", error);
      });
  }
});

// Background setup
const background = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  speed: 2, // Speed of the scrolling background
};

// Star setup
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width, // Random horizontal position
    y: Math.random() * canvas.height, // Random vertical position
    size: Math.random() * 2, // Random size for the star
    speed: Math.random() * 0.5 + 0.5, // Parallax speed
  });
}

// Gradient animation offset
let gradientOffset = 0;

// High score variable
let highScore = 0;

// Function to save the high score to Firebase
async function saveHighScore(username, score) {
  try {
    await addDoc(collection(db, "high_scores"), {
      username,
      score,
      created_at: new Date(),
    });
    console.log("High score saved successfully!");
  } catch (error) {
    console.error("Error saving high score:", error);
  }
}

// Function to fetch high scores from Firebase
async function fetchHighScores() {
  try {
    const q = query(
      collection(db, "high_scores"),
      orderBy("score", "desc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    const highScores = querySnapshot.docs.map((doc) => doc.data());
    console.log("Fetched High Scores:", highScores);
    return highScores; // Return the high scores to display in the game
  } catch (error) {
    console.error("Error fetching high scores:", error);
    return [];
  }
}

// Fetch and set the initial high score
async function setInitialHighScore() {
  const highScores = await fetchHighScores();
  if (highScores.length > 0) {
    highScore = highScores[0].score; // Set the highest score as the initial high score
  }
}
setInitialHighScore();
// Function to draw the background
function drawBackground() {
  ctx.fillStyle = "black"; // Background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars
  ctx.fillStyle = "white"; // Star color
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); // Star as a circle
    ctx.fill();

    // Move stars to the left with parallax effect
    star.x -= star.speed * background.speed;

    // Reset stars to the right if off-screen
    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * canvas.height;
    }
  });

  // Draw Bifröst bridge (strip)
  gradientOffset += 2; // Animate the gradient
  const gradient = ctx.createLinearGradient(
    0,
    canvas.height / 2 + 50,
    canvas.width,
    canvas.height / 2 + 100
  );
  gradient.addColorStop(0, `hsl(${(gradientOffset + 0) % 360}, 100%, 50%)`);
  gradient.addColorStop(0.2, `hsl(${(gradientOffset + 60) % 360}, 100%, 50%)`);
  gradient.addColorStop(0.4, `hsl(${(gradientOffset + 120) % 360}, 100%, 50%)`);
  gradient.addColorStop(0.6, `hsl(${(gradientOffset + 180) % 360}, 100%, 50%)`);
  gradient.addColorStop(0.8, `hsl(${(gradientOffset + 240) % 360}, 100%, 50%)`);
  gradient.addColorStop(1, `hsl(${(gradientOffset + 300) % 360}, 100%, 50%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height / 2 + 50, canvas.width, 50);

  // Add glow effect
  ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
  ctx.shadowBlur = 20;
  ctx.fillRect(0, canvas.height / 2 + 50, canvas.width, 50);
  ctx.shadowBlur = 0; // Reset shadow
}

// Load astronaut sprite
const astronautSprite = new Image();
astronautSprite.src = "astronaut_sprite.png";

// Astronaut properties
const astronaut = {
  x: 50,
  y: canvas.height / 2, // Adjust to match the new moon surface height
  width: 50,
  height: 50,
  velocityY: 0,
  gravity: 0.8, // Adjusted gravity to match speed scaling
  jumpStrength: -14.5, // Fixed jump strength for consistent height
};

// Load individual rock images
const rockImages = ["rocks/rock1.png", "rocks/rock2.png"].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// Obstacle properties (moon rocks)
let obstacles = [];
let obstacleSpeed = 5;

// Game state variables
let isGameOver = false;
let score = 0;

// Function to spawn a new obstacle
function spawnObstacle() {
  if (!isGameOver) {
    const randomRock = Math.floor(Math.random() * rockImages.length);
    const obstacleImage = rockImages[randomRock]; // Select a random rock image

    const obstacleWidth = 50; // Fixed width for obstacles
    const obstacleHeight = 50; // Fixed height for obstacles

    // Explicitly place the bottom of the obstacle directly on the ground
    obstacles.push({
      x: canvas.width, // Start at the right edge of the canvas
      y: canvas.height / 2, // Adjust to match new moon surface height
      width: obstacleWidth,
      height: obstacleHeight,
      image: obstacleImage, // Store the selected image
    });
  }
}

// Function to check for collisions
function checkCollision(astronaut, obstacle) {
  return (
    astronaut.x < obstacle.x + obstacle.width &&
    astronaut.x + astronaut.width > obstacle.x &&
    astronaut.y < obstacle.y + obstacle.height &&
    astronaut.y + astronaut.height > obstacle.y
  );
}

// Function to reset the game
function resetGame() {
  if (score > highScore) {
    highScore = score; // Update high score if current score is higher

    // Save high score to Firebase
    saveHighScore("PlayerOne", highScore); // Replace 'PlayerOne' with a dynamic username
  }

  obstacles = [];
  score = 0;
  astronaut.y = canvas.height / 2;
  astronaut.velocityY = 0;
  isGameOver = false;
  obstacleSpeed = 5;
  background.speed = 2;
  clearInterval(obstacleSpawnInterval);
  obstacleSpawnInterval = setInterval(spawnObstacle, 1500);

  // Restart background music
  backgroundMusic.currentTime = 0;
  backgroundMusic.play();
}

// Attach reset functionality to the reset button
resetButton.addEventListener("click", () => {
  if (isGameOver) {
    resetGame();
    gameLoop();
    resetButton.style.display = "none"; // Hide reset button after restarting
  }
});

// Function to draw the astronaut
function drawAstronaut() {
  ctx.drawImage(
    astronautSprite,
    0,
    0,
    astronautSprite.width,
    astronautSprite.height,
    astronaut.x,
    astronaut.y,
    astronaut.width,
    astronaut.height
  );
}

// Function to draw obstacles
function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    obstacle.x -= obstacleSpeed;

    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
      score++;
    }

    if (checkCollision(astronaut, obstacle)) {
      isGameOver = true;
      collisionSound.currentTime = 0; // Reset collision sound
      collisionSound.play(); // Play collision sound

      // Stop background music and play game over sound
      backgroundMusic.pause();
      gameOverSound.currentTime = 0;
      gameOverSound.play();
      resetButton.style.display = "block"; // Show reset button
    }

    // Draw the selected rock image
    ctx.drawImage(
      obstacle.image,
      obstacle.x,
      obstacle.y,
      obstacle.width,
      obstacle.height
    );
  }
}

// Adjust difficulty based on the score
function adjustDifficulty() {
  if (score % 20 === 0 && score !== 0) {
    obstacleSpeed = Math.min(obstacleSpeed + 0.5, 15); // Increase obstacle speed noticeably every 20 points
    background.speed = Math.min(background.speed + 0.2, 5); // Increase background speed for visual effect
  }
}

// Resize canvas dynamically
function resizeCanvas() {
  const scaleFactor = Math.min(
    window.innerWidth / 800,
    window.innerHeight / 400
  ); // Scale proportionally to maintain aspect ratio
  canvas.width = 800 * scaleFactor; // Match resolution for larger display
  canvas.height = 400 * scaleFactor;
  background.width = canvas.width;
  background.height = canvas.height;
  astronaut.width = 50 * scaleFactor; // Adjust astronaut size
  astronaut.height = 50 * scaleFactor;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Game Loop
function gameLoop() {
  if (isGameOver) {
    ctx.fillStyle = "white";
    ctx.font = `${Math.floor(canvas.width / 40)}px Arial`; // Dynamic font size
    ctx.fillText(
      "Game Over! Press R to Restart",
      canvas.width / 4,
      canvas.height / 2
    );
    return;
  }

  adjustDifficulty(); // Call difficulty adjustment logic

  drawBackground();
  astronaut.velocityY += astronaut.gravity;
  astronaut.y += astronaut.velocityY;
  if (astronaut.y > canvas.height / 2) {
    astronaut.y = canvas.height / 2;
    astronaut.velocityY = 0;
  }

  drawAstronaut();
  drawObstacles();
  ctx.fillStyle = "white";
  ctx.font = `${Math.floor(canvas.width / 60)}px Arial`; // Dynamic font size
  ctx.fillText(`Score: ${score}`, 10, 40);
  ctx.fillText(`High Score: ${highScore}`, 10, 80); // Display high score
  requestAnimationFrame(gameLoop);
}

// Spawn obstacles periodically (initial interval)
let obstacleSpawnInterval = setInterval(spawnObstacle, 1500);

// Cooldown for jump sound
let jumpCooldown = false;
function playJumpSound() {
  if (!jumpCooldown) {
    jumpSound.currentTime = 0;
    jumpSound.play();
    jumpCooldown = true;
    setTimeout(() => (jumpCooldown = false), 300); // Cooldown duration
  }
}

// Handle keyboard and touch input
document.addEventListener("keydown", (event) => {
  if (
    event.code === "Space" &&
    !isGameOver &&
    astronaut.y === canvas.height / 2
  ) {
    astronaut.velocityY = astronaut.jumpStrength;
    playJumpSound();
  }
  if (event.code === "KeyR" && isGameOver) {
    resetGame();
    gameLoop();
  }
});
canvas.addEventListener("touchstart", () => {
  if (!isGameOver && astronaut.y === canvas.height / 2) {
    astronaut.velocityY = astronaut.jumpStrength;
    playJumpSound();
  }
});

// Start the game
gameLoop();
