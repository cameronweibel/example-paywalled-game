function signIn() {
  email = document.getElementById("email").value;
  password = document.getElementById("password").value;
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      hideUserForm();
      showAccessForm();
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
    });
}

function registerUser() {
  email = document.getElementById("email").value;
  password = document.getElementById("password").value;
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      hideUserForm();
      showAccessForm();
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
    });
  console.log("Register user");
}

function submitAccessCode() {
  accessCode = document.getElementById("access-code").value;
  if (accessCode == "hYuZXOMpYEct3nIo") {
    hideAccessForm();
    showGame();
  } else {
    document.getElementById("access-code").value = "INVALID";
  }
}

function hideUserForm() {
  document.getElementById("userForm").style.display = "none";
}

function showAccessForm() {
  document.getElementById("accessForm").style.display = "flex";
}

function hideAccessForm() {
  document.getElementById("accessForm").style.display = "none";
}

function showGame() {
  document.getElementById("gameContainer").style.display = "block";
  initGame();
}

function initGame() {
  // Create a settings object
  let settings = {
    global: true,
    width: 440,
    height: 275,
    scale: 1,
    canvas: document.getElementById("gameCanvas"),
    clearColor: [0, 0, 0],
  };

  // Load Kaboom with our settings
  kaboom(settings);

  // Load sprites
  loadSprite("mars", "https://i.imgur.com/hLFEclA.png");
  loadSprite("rocket", "https://i.imgur.com/TBkDJbQ.png");
  loadSprite("alien", "https://i.imgur.com/wxyrb3M.png");

  // Load sounds
  loadSound("shoot", "https://kaboomjs.com/sounds/shoot.mp3");

  // Create main scene
  scene("main", () => {
    // Add layers to our main scene
    // "bg" mean background layer, it is a static image
    // "obj" mean object layer, the action happens here
    // "ui" means user interface layer, for health display, etc.
    // The "obj" after the comma sets it as our default layer
    layers(["bg", "obj", "ui"], "obj");
    // Add the mars sprite to the background
    add([sprite("mars"), layer("bg")]);
    // Add player with various attributes
    const player = add([
      sprite("rocket"), // Use our rocket image loaded above
      pos(200, 200), // Start at position (200,200)
      scale(1), // 1:1 pixel size
      rotate(0), // No rotation
      origin("center"), // If rotated, rocket rotates from center
      "player", // Give the name player to this object
    ]);
    // Add controls
    keyDown("left", () => {
      player.move(-100, 0);
    });
    keyDown("right", () => {
      player.move(100, 0);
    });
    keyDown("up", () => {
      player.move(0, -100);
    });
    keyDown("down", () => {
      player.move(0, 100);
    });
    // Declare variables for map dimensions
    const MAP_WIDTH = 475;
    const MAP_HEIGHT = 275;
    const BLOCK_SIZE = 25;
    // Add level with boundaries
    // You can draw the map using symbols we define below
    const map = addLevel(
      [
        "====================",
        "-                  -",
        "-                  -",
        "-                  -",
        "-                  -",
        "-                  -",
        "-                  -",
        "-                  -",
        "-                  -",
        "-                  -",
        "-                  -",
        "====================",
      ],
      {
        width: BLOCK_SIZE, // Set width of blocks
        height: BLOCK_SIZE, // Set height of blocks
        pos: vec2(0, 0), // Position at origin
        // Add symbols we can use to draw blocks
        // Symbols represent rectanges that we use as blocks
        // We can set the width, RGB color, and give it a name
        "=": [rect(BLOCK_SIZE, 1), color(0, 0, 0), "ground", solid()],
        p: [rect(BLOCK_SIZE, BLOCK_SIZE), color(0, 1, 0), "platform", solid()],
        "-": [rect(1, BLOCK_SIZE), color(0, 0, 0), "boundary", solid()],
      }
    );
    // Every object has an action it runs each frame
    // Stop player from going through boundaries when moving
    player.action(() => {
      player.resolve();
    });
    // Add variable to control laser speed
    const LASER_SPEED = 300;
    // Add function to generate laser
    function spawnLaser(laserPos) {
      // Spawn the laser above the rocket
      laserPos = laserPos.add(0, -20);
      add([
        rect(2, 8),
        pos(laserPos),
        origin("center"),
        color(0, 1, 0),
        "laser",
        {
          laserSpeed: -1 * LASER_SPEED,
        },
      ]);
    }
    // Each frame, move the laser up the screen
    action("laser", (l) => {
      // Move up
      l.move(0, l.laserSpeed);
      // If the laser is out of bounds, destroy the laser
      if (l.pos.y < 0 || l.pos.y > MAP_HEIGHT) {
        destroy(l);
      }
    });
    // Shoot with spacebar
    // We use keyPress instead of keyDown to shoot once at a time
    keyPress("space", () => {
      // Play laser sound
      play("shoot", {
        volume: 0.1,
      });
      // Spawn laser at player position
      spawnLaser(player.pos);
    });
    // Add aliens
    const NEW_ALIEN_WAIT = 0.5;
    function spawnAlien() {
      add([
        sprite("alien"),
        // Randomize the spawn position
        pos(rand(0, MAP_WIDTH), 0),
        "alien",
        {
          speedX: 1,
          speedY: 100,
        },
      ]);
      // Wait a few seconds before next spawn
      wait(NEW_ALIEN_WAIT, spawnAlien);
    }

    // Call function
    spawnAlien();

    action("alien", (alien) => {
      alien.move(alien.speedX, alien.speedY);
    });

    // Add score to UI layer
    var score = 0;
    function displayScore() {
      add([
        text("SCORE: " + score.toString(), 8),
        pos(80, 20),
        origin("center"),
        layer("ui"),
        "score",
      ]);
    }
    // Call function to display initial score
    displayScore();
    // Detect collision of alien and lasers
    collides("alien", "laser", (alien, laser) => {
      score += 50;
      destroyAll("score");
      displayScore();
      destroy(alien);
      destroy(laser);
    });

    // Detect collision of alien and player
    collides("alien", "player", (alien, player) => {
      camShake(30);
      destroy(alien);
      go("lost", score);
    });
  });

  // Game over scene
  scene("lost", (score) => {
    // Add losing text to the UI layer
    add([
      text("You lost! Score: " + score.toString(), 16),
      pos(250, 100),
      origin("center"),
      layer("ui"),
    ]);

    // Press enter to restart
    keyPress("enter", () => {
      go("main");
    });
  });

  // Start scene
  start("main");
}
