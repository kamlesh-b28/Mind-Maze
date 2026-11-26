
const TOTAL_LEVELS = 100;

let currentLevel = 1;
let unlockedLevel = Number(localStorage.getItem("mm_unlocked")) || 1;
let xp = Number(localStorage.getItem("mm_xp")) || 0;
let completed = Number(localStorage.getItem("mm_completed")) || 0;

let maze = [];
let size = 11;
let player = {x: 1, y: 1};
let goal = {x: 9, y: 9};
let moves = 0;
let seconds = 0;
let timerInterval = null;
let gameWon = false;


// SCREEN MANAGEMENT

function hideScreens() {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.add("hidden");
    });
}

function showHome() {
    stopTimer();
    document.getElementById("winPopup").classList.add("hidden");
    hideScreens();
    document.getElementById("homeScreen").classList.remove("hidden");
}

function showLevels() {
    stopTimer();
    document.getElementById("winPopup").classList.add("hidden");
    hideScreens();
    document.getElementById("levelScreen").classList.remove("hidden");

    updateXP();
    renderLevels();
}

function showGame() {
    hideScreens();
    document.getElementById("gameScreen").classList.remove("hidden");
}


// ENTER GAME

function showLevelsFromHome() {
    showLevels();
}


// LEVEL MANAGEMENT

function renderLevels() {
    const grid = document.getElementById("levelGrid");
    grid.innerHTML = "";

    for(let i = 1; i <= TOTAL_LEVELS; i++) {
        const button = document.createElement("button");

        button.className = "level-card";

        if(i <= unlockedLevel) {
            button.classList.add("unlocked");
            button.innerHTML = `
                <span>${i}</span>
                <small>${i < unlockedLevel ? "✓ DONE" : "PLAY"}</small>
            `;

            if(i === unlockedLevel) {
                button.classList.add("current");
            }

            button.onclick = () => startLevel(i);

        } else {
            button.classList.add("locked");
            button.innerHTML = `
                <span>🔒</span>
                <small>LEVEL ${i}</small>
            `;
        }

        grid.appendChild(button);
    }

    document.getElementById("progressText").textContent =
        `${unlockedLevel} / ${TOTAL_LEVELS}`;

    document.getElementById("progressBar").style.width =
        (unlockedLevel / TOTAL_LEVELS * 100) + "%";
}


// START LEVEL

function startLevel(number) {
    if(number > unlockedLevel || number > TOTAL_LEVELS) return;

    currentLevel = number;
    gameWon = false;
    moves = 0;
    seconds = 0;

    document.getElementById("winPopup").classList.add("hidden");

    // Difficulty increases gradually
    size = Math.min(11 + Math.floor((currentLevel - 1) / 10) * 2, 19);

    if(size % 2 === 0) size++;

    player = {x: 1, y: 1};
    goal = {x: size - 2, y: size - 2};

    generateMaze();
    showGame();
    updateGameInfo();
    renderMaze();
    startTimer();
}


// RANDOM MAZE GENERATOR

function generateMaze() {
    maze = Array.from({length: size}, () =>
        Array(size).fill(1)
    );

    function carve(x, y) {
        maze[y][x] = 0;

        let directions = [
            [0, -2],
            [0, 2],
            [-2, 0],
            [2, 0]
        ];

        // Random direction order
        directions.sort(() => Math.random() - 0.5);

        for(let [dx, dy] of directions) {
            let nx = x + dx;
            let ny = y + dy;

            if(
                nx > 0 &&
                ny > 0 &&
                nx < size - 1 &&
                ny < size - 1 &&
                maze[ny][nx] === 1
            ) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }

    carve(1, 1);
}


// DRAW MAZE

function renderMaze() {
    const board = document.getElementById("mazeBoard");

    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    for(let y = 0; y < size; y++) {
        for(let x = 0; x < size; x++) {

            const cell = document.createElement("div");
            cell.className = "cell";

            if(maze[y][x] === 1) {
                cell.classList.add("wall");
            }

            if(player.x === x && player.y === y) {
                cell.classList.add("player");
            }

            if(goal.x === x && goal.y === y) {
                cell.classList.add("goal");
            }

            board.appendChild(cell);
        }
    }
}


// PLAYER MOVEMENT

function movePlayer(dx, dy) {
    if(gameWon) return;

    const nx = player.x + dx;
    const ny = player.y + dy;

    // Outside boundary
    if(nx < 0 || ny < 0 || nx >= size || ny >= size) return;

    // Wall collision
    if(maze[ny][nx] === 1) return;

    player.x = nx;
    player.y = ny;

    moves++;

    document.getElementById("moves").textContent = moves;

    // Check exit
    if(player.x === goal.x && player.y === goal.y) {
        completeLevel();
        return;
    }

    renderMaze();
}


// KEYBOARD CONTROLS

document.addEventListener("keydown", function(event) {

    const keys = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0]
    };

    if(keys[event.key]) {
        event.preventDefault();
        movePlayer(...keys[event.key]);
    }
});


// TIMER

function startTimer() {
    stopTimer();

    timerInterval = setInterval(() => {
        seconds++;

        const min = String(Math.floor(seconds / 60)).padStart(2, "0");
        const sec = String(seconds % 60).padStart(2, "0");

        document.getElementById("timer").textContent =
            `${min}:${sec}`;

    }, 1000);
}

function stopTimer() {
    if(timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}


// COMPLETE LEVEL

function completeLevel() {
    if(gameWon) return;

    gameWon = true;
    stopTimer();

    xp += 100;
    completed++;

    if(currentLevel === unlockedLevel) {
        unlockedLevel = Math.min(TOTAL_LEVELS, unlockedLevel + 1);
    }

    localStorage.setItem("mm_xp", xp);
    localStorage.setItem("mm_unlocked", unlockedLevel);
    localStorage.setItem("mm_completed", completed);

    updateXP();
    renderLevels();

    document.getElementById("gameMessage").textContent =
        "🎉 MAZE SOLVED SUCCESSFULLY!";

    document.getElementById("winPopup").classList.remove("hidden");

    const nextButton = document.querySelector("#winPopup .primary-btn");

    if(currentLevel === TOTAL_LEVELS) {
        nextButton.textContent = "VIEW LEVELS";
    } else {
        nextButton.textContent = "NEXT LEVEL ➜";
    }
}


// NEXT LEVEL

function nextLevel() {
    document.getElementById("winPopup").classList.add("hidden");

    if(currentLevel < TOTAL_LEVELS) {
        startLevel(currentLevel + 1);
    } else {
        showLevels();
    }
}


// RESTART

function restartLevel() {
    startLevel(currentLevel);
}


// UPDATE INFORMATION

function updateXP() {
    document.getElementById("xpDisplay").textContent = xp;
    document.getElementById("gameXP").textContent = xp;
}

function updateGameInfo() {
    document.getElementById("gameLevel").textContent = currentLevel;
    document.getElementById("moves").textContent = moves;
    document.getElementById("timer").textContent = "00:00";

    let difficulty = "EASY";

    if(currentLevel > 80) difficulty = "EXPERT";
    else if(currentLevel > 50) difficulty = "HARD";
    else if(currentLevel > 20) difficulty = "MEDIUM";

    document.getElementById("difficulty").textContent = difficulty;

    document.getElementById("gameMessage").textContent =
        "Find the green exit!";
}


// INITIALIZE

updateXP();
renderLevels();
showHome();


// HTML BUTTON CONNECTION

function showLevels() {
    stopTimer();
    document.getElementById("winPopup").classList.add("hidden");

    hideScreens();

    document.getElementById("levelScreen").classList.remove("hidden");

    updateXP();
    renderLevels();
}
