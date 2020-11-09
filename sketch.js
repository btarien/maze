"use strict"

// declare globals
var numCols = 6;
var numRows = 6;
var cellSize = 500 / numCols;
var grid = [];
const timer = document.getElementById("time");
var time = 0;
var numMoves = 0;
var counter = null;
var visitedCells = [];
var currentCell = null;
var monkeyImg = null;
var end = null;


// generate new maze
const newMazeBtn = document.getElementById('generate-new-maze');
newMazeBtn.addEventListener('click', () => {
    context.clearRect(0, 0, numCols * cellSize, numRows * cellSize); // clear canvas
    visitedCells = [];
    numCols = document.getElementById("numCols").value;
    numRows = document.getElementById("numRows").value;
    cellSize = 500 / numCols;
    canvas.width = numCols * cellSize;
    canvas.height = numRows * cellSize;
    grid = [];
    clearInterval(counter);
    time = 0;
    timer.innerText = time;
    document.getElementById('start').classList.remove('visible');
    document.getElementById('victory').classList.remove('visible');
    init();
});


// create canvas
var canvas = document.createElement('canvas');
canvas.id = 'canvas';
canvas.width = numCols * cellSize;
canvas.height = numRows * cellSize;
var loc = document.getElementById("canvas-container");
loc.appendChild(canvas);
var context = canvas.getContext('2d');
context.lineWidth = 2;
context.fillStyle = '#bfd8d9';

function getCellSize(cell) {
    return [cell.col * cellSize + context.lineWidth, cell.row * cellSize + context.lineWidth, cellSize - 2 * context.lineWidth, cellSize - 2 * context.lineWidth];
}

async function init() {
    createGrid();
    const start = grid[0][0]; // start at top left cell
    end = grid[numCols - 1][numRows - 1];
    currentCell = start;
    await recursiveDFS(start);
    context.globalCompositeOperation='source-over';
    monkeyImg = new Image();
    monkeyImg.src = 'images/monkey.png';
    monkeyImg.onload = () => {
        const [topLeftX, topLeftY, width, height] = getCellSize(start);
        context.drawImage(monkeyImg, topLeftX, topLeftY, width, height);
    };
    const bananaImg = new Image();
    bananaImg.src = 'images/bananas.png';
    bananaImg.onload = () => {
        const [topLeftX, topLeftY, width, height] = getCellSize(end);
        context.drawImage(bananaImg, topLeftX, topLeftY, width, height);
    };
    await delay(300);
    document.getElementById('start').classList.add('visible');
}

function startGame() {
    document.getElementById('start').classList.remove('visible');
    counter = startTimer();
    document.addEventListener('keydown', (event) => {
        console.log(event.key);
        switch(event.key) {
            case "ArrowLeft":
                move('left');
                break;
            case "ArrowRight":
                move('right');
                break;
            case "ArrowUp":
                move('top');
                break;
            case "ArrowDown":
                move('bottom');
                break;
        }         
    });
}

function move(direction) {
    // debugger;
    if(!currentCell.walls[direction]) {
        var [topLeftX, topLeftY, width, height] = getCellSize(currentCell);
        context.clearRect(topLeftX, topLeftY, width, height);
        context.fillRect(topLeftX, topLeftY, width, height);
        currentCell = currentCell.neighbors[direction];
        [topLeftX, topLeftY, width, height] = getCellSize(currentCell);;
        context.drawImage(monkeyImg, topLeftX, topLeftY, width, height);

        if(currentCell === end) {
            clearInterval(counter);
            getEventListeners().click.forEach((e)=>{e.remove()})
            document.getElementById('victory').classList.add('visible');
        }
    }
}

function startTimer() {
    return setInterval(() => {
        time++;
        timer.innerText = time;
    }, 1000);
}

class Cell {
    constructor(col, row) {
        this.col = col;
        this.row = row;
        this.neighbors = {};
        this.walls = {
            top: true,
            right: true,
            bottom: true,
            left: true
        };
        this.visited = false;
    }

    setNeighbors() {
        //top
        if(this.row - 1 >= 0) {
            this.neighbors.top = grid[this.col][this.row - 1]; 
        }
        //right     
        if (this.col + 1 < numCols) {
            this.neighbors.right = grid[this.col + 1][this.row];
        }
        //bottom
        if (this.row + 1 < numRows) {
            this.neighbors.bottom = grid[this.col][this.row + 1];
        }
        //left
        if (this.col - 1 >= 0) {
            this.neighbors.left = grid[this.col - 1][this.row];
        }
    }
}

// create 2d array of Cell objects
        // indexing as grid[col][row]
        // grid = [[(0,0), (1,0)], 
        //         [(0,1), (1,1)]]
function createGrid() {
    for (var col = 0; col < numCols; col++) {
        var colArr = []
        for (var row = 0;  row < numRows; row++) {
            var cell = new Cell(col, row);
            colArr.push(cell);
            drawGridLines(cell);
        }
        grid.push(colArr);
    }

    for (var row = 0;  row < numRows; row++) {
        for (var col = 0; col < numCols; col++) {
            grid[col][row].setNeighbors();
        }
    }
}

// return single neighbor randomized from all possible neighbors
function getNextNeighbor(cell) {
    if (cell.neighbors) {
        var neighbors = [];
        for (var neighbor in cell.neighbors) {
            if (cell.neighbors[neighbor].visited === false){
                neighbors.push([cell.neighbors[neighbor], neighbor]);
            }
        }  
    } 
    if(neighbors.length > 0) {
        return neighbors[Math.floor(Math.random() * neighbors.length)]; 
    } else {
        return [undefined, undefined];
    }
}

function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
} 

async function recursiveDFS(currentCell) {
    highlightCell(currentCell);
    currentCell.visited = true;
    var [next, direction] = getNextNeighbor(currentCell);

    while(typeof(next) != 'undefined') {
        await delay(20);
        removeWall(currentCell, next, direction);
        highlightCell(next);
        await recursiveDFS(next);
        [next, direction] = getNextNeighbor(currentCell);
    }
}

function highlightCell(newCell) {
    visitedCells.push(newCell);
    context.fillStyle = '#bfd8d9';
    visitedCells.forEach((cell) => {
        context.globalCompositeOperation='destination-over'; // fill rect under existing grid
        var topLeft = [(cell.col) * cellSize, (cell.row) * cellSize];
        context.fillRect(topLeft[0], topLeft[1], cellSize, cellSize);
    });
}

function removeWall(cell1, cell2, direction) {
    switch (direction) {
        case 'top':
            cell1.walls.top = false;
            cell2.walls.bottom = false;
            break;
        case 'right':
            cell1.walls.right = false;
            cell2.walls.left = false;
            break;
        case 'bottom':
            cell1.walls.bottom = false;
            cell2.walls.top = false;
            break;
        case 'left':
            cell1.walls.left = false;
            cell2.walls.right = false;
            break;
    }
    redrawGrid();
}

function redrawGrid() {
    context.clearRect(0, 0, numCols * cellSize, numRows * cellSize); // clear canvas
    for (var col = 0; col < numCols; col++) {
        for (var row = 0;  row < numRows; row++) {
            drawGridLines(grid[col][row]);
        }
    }
}

function drawGridLines(cell) {
    const topLeft =     [ cell.col         * cellSize,  cell.row          * cellSize];
    const topRight =    [(cell.col + 1)    * cellSize,  cell.row          * cellSize];
    const bottomLeft =  [ cell.col         * cellSize, (cell.row + 1)     * cellSize];
    const bottomRight = [(cell.col + 1)    * cellSize, (cell.row + 1)     * cellSize];

    //draw top line
    if(cell.walls.top){
        context.beginPath();
        context.moveTo(topLeft[0], topLeft[1]);
        context.lineTo(topRight[0], topRight[1]);
        context.stroke();
    }

    //draw right line
    if(cell.walls.right) {
        context.beginPath();
        context.moveTo(topRight[0], topRight[1]);
        context.lineTo(bottomRight[0], bottomRight[1]);
        context.stroke();
    }

    //draw bottom line
    if(cell.walls.bottom) {
        context.beginPath();
        context.moveTo(bottomRight[0], bottomRight[1]);
        context.lineTo(bottomLeft[0], bottomLeft[1]);
        context.stroke();
    }

    //draw left line
    if(cell.walls.left) {
        context.beginPath();
        context.moveTo(bottomLeft[0], bottomLeft[1]);
        context.lineTo(topLeft[0], topLeft[1]);
        context.stroke();
    }
}


init();

// function iterativeDFS(start) {
//     // iterative depth-first search
//     current = grid[0][0]; // start at top left
//     stack.push(current);
//     while(stack) {
//         current = stack.pop();
//         if (current.visited === false) {
//             current.visited = true;
//             stack.push(current);
//             stack.push(getNextNeighbor(current));
//         }
//     }
// }