let board = new Array(81).fill(0);
let userBoard = [];
let selected = null;
let difficulties = {
   easy: 35,
   medium: 45,
   hard: 55
}
let difficulty = "easy";
let timer = 0;
let timerInterval = null;
let notes = [];
let notesMode = false;
let inputDisabled = false;
let hints = 3;

function start() {
   clearInterval(timerInterval);
   clearInterval(solveInterval);

   hints = 3;
   document.getElementById("hint").disabled = false;
   document.getElementById("hint").innerHTML = `Hints: ${hints}`;

   disableInput(false);
   document.getElementById("solve").disabled = false;
   inputDisabled = false;

   document.getElementById("timer").innerHTML = "00:00";
   timer = 0;

   selected = null;
   document.querySelectorAll(".sudoku-cell").forEach(c => {
      c.classList.remove("selected");
      c.classList.remove("highlighted");
   })


   let solved = new Array(81).fill(0);
   solve(solved);
   let puzzle = digHoles(solved, difficulties[difficulty]);
   userBoard = [...puzzle];
   notes = Array.from({ length: 81 }, () => new Set());
   render(userBoard);

   timerInterval = setInterval(() => {
      timer++;

      const minutes = Math.floor(timer / 60);
      const seconds = timer % 60;

      const formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

      document.getElementById("timer").innerHTML = formatted;
   }, 1000);
}

function shuffle(array) {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }

   return array;
}

function cell(row, column) { return (row * 9 + column); } // convert row and column to cell index

function isValid(board, row, column, number) {
   for (let i = 0; i < 9; i++) {
      if (board[cell(row, i)] === number) return false; // check if number is in row
      if (board[cell(i, column)] === number) return false; // check if number is in column
   }

   const boxRow = Math.floor(row / 3) * 3;
   const boxColumn = Math.floor(column / 3) * 3;
   for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxColumn; c < boxColumn + 3; c++) {
         if (board[cell(r, c)] === number) return false; // check if number is in box
      }
   }

   return (true); // if none apply then the number is valid
}

function solve(board) {
   for (let i = 0; i < 81; i++) {
      if (board[i] === 0) { // if cell is empty
         const row = Math.floor(i / 9);
         const column = i % 9;
         const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

         for (const number of numbers) {
            if (isValid(board, row, column, number)) {
               board[i] = number; // try this number

               if (solve(board)) {
                  return true; // if it's solved then return
               }

               board[i] = 0; // if it's not solved then try the next number 
            }
         }

         return false;
      }
   }

   return true; // solved
}

function digHoles(board, holes) {
   const puzzle = [...board];
   const positions = shuffle([...Array(81).keys()])
   let removed = 0;

   for (const position of positions) {
      if (removed >= holes) break;

      const backup = puzzle[position];
      puzzle[position] = 0;

      const testBoard = [...puzzle];
      const solutions = countSolutions(testBoard);

      if (solutions === 1) {
         removed++;
      } else {
         puzzle[position] = backup;
      }


   }

   return puzzle;
}

function countSolutions(board) {
   let count = 0;

   function helper(board) {
      if (count >= 2) return;

      for (let i = 0; i < 81; i++) {
         if (board[i] === 0) {
            const row = Math.floor(i / 9);
            const column = i % 9;

            for (let number = 1; number <= 9; number++) {
               if (isValid(board, row, column, number)) {
                  board[i] = number;
                  helper(board);
                  board[i] = 0;

                  if (count >= 2) return;
               }
            }

            return;
         }
      }

      count++;
   }

   helper(board);
   return count;
}

function render(puzzle) {
   for (let i = 0; i < 81; i++) {
      const element = document.getElementById(`sudoku-${i + 1}`);
      const value = puzzle[i];

      element.innerHTML = value === 0 ? "" : value;
      element.classList.remove("notes-view", "invalid", "selected", "highlighted");

      if (value !== 0) {
         element.classList.add("given");
         element.classList.remove("editable");
      } else {
         element.classList.add("editable");
         element.classList.remove("given");
      }
   }
}

function fillCell(number) {
   if (selected === null) return;

   const element = document.getElementById(`sudoku-${selected + 1}`);
   if (!element.classList.contains("editable")) return;

   if (notesMode) {
      toggleNote(selected, number);
      return;
   }

   const row = Math.floor(selected / 9);
   const column = selected % 9;

   userBoard[selected] = number;
   notes[selected].clear();
   renderCell(selected);

   const tempBoard = [...userBoard];
   tempBoard[selected] = 0;
   const valid = isValid(tempBoard, row, column, number);

   element.classList.toggle("invalid", !valid);

   highlightRelated(selected);

   if (checkWin()) {
      clearInterval(timerInterval);
      document.getElementById("solve").disabled = true;
      disableInput(true);

      const minutes = Math.floor(timer / 60);
      const seconds = timer % 60;
      const formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

      setTimeout(() => {alert("You completed this puzzle in " + formatted + "!");}, 100);
   }
}

function clearCell() {
   if (selected === null) return;

   const element = document.getElementById(`sudoku-${selected + 1}`);
   if (!element.classList.contains("editable")) return;

   userBoard[selected] = 0;
   notes[selected].clear();
   renderCell(selected);
   element.classList.remove("invalid");

   highlightRelated(selected);
}

function checkWin() {
   if (userBoard.includes(0)) return false;

   for (let i = 0; i < 81; i++) {
      const row = Math.floor(i / 9);
      const column = i % 9;
      const number = userBoard[i];

      const tempBoard = [...userBoard];
      tempBoard[i] = 0;

      if (!isValid(tempBoard, row, column, number)) {
         return false;
      }
   }

   return true;
}

function highlightRelated(cell) {
   document.querySelectorAll(".sudoku-cell").forEach(c => c.classList.remove("highlighted"));

   const row = Math.floor(cell / 9);
   const column = cell % 9;
   const boxRow = Math.floor(row / 3) * 3;
   const boxColumn = Math.floor(column / 3) * 3;
   const number = userBoard[cell];

   for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9);
      const c = i % 9;

      const sameRow = r === row;
      const sameColumn = c === column;
      const sameBox = r >= boxRow && r < boxRow + 3 && c >= boxColumn && c < boxColumn + 3;
      const sameNumber = number !== 0 && userBoard[i] === number;

      if (i !== cell && (sameRow || sameColumn || sameBox || sameNumber)) {
         document.getElementById(`sudoku-${i + 1}`).classList.add("highlighted");
      }
   }
}

function toggleNote(cell, number) {
   if (userBoard[cell] !== 0) return;

   if (notes[cell].has(number)) {
      notes[cell].delete(number);
   } else {
      notes[cell].add(number);
   }

   renderCell(cell);
}

function renderCell(cell) {
   const element = document.getElementById(`sudoku-${cell + 1}`);

   if (userBoard[cell] !== 0) {
      element.innerHTML = userBoard[cell];
      element.classList.remove("notes-view");
   } else if (notes[cell].size > 0) {
      let notesHTML = "";
      for (let n = 1; n <= 9; n++) {
         notesHTML += `<span class="note">${notes[cell].has(n) ? n : ""}</span>`;
      }
      element.innerHTML = notesHTML;
      element.classList.add("notes-view");
   } else {
      element.innerHTML = "";
      element.classList.remove("notes-view");
   }
}

function disableInput(disabled) {
   inputDisabled = disabled;

   document.querySelectorAll(".number").forEach(btn => btn.disabled = disabled);
   document.getElementById("notes-toggle").disabled = disabled;
   document.getElementById("solve").disabled = disabled;
   document.getElementById("hint").disabled = disabled || hints <= 0;

   document.querySelectorAll(".sudoku-cell").forEach(c => {
      c.style.pointerEvents = disabled ? "none" : "";
   });
}
























// USER INTERFACE
document.querySelectorAll(".sudoku-cell").forEach((element, index) => {
   element.addEventListener("click", () => {
      if (!element.classList.contains("editable")) return;
      selected = index;

      document.querySelectorAll(".sudoku-cell").forEach(c => c.classList.remove("selected"));
      element.classList.add("selected");

      highlightRelated(index);
   })
});

document.addEventListener("keydown", (e) => {
   if (inputDisabled) return;

   const key = e.key;

   if (key >= "1" && key <= "9") {
      fillCell(parseInt(key));
   }

   if (key === "Backspace" || key === "Delete") {
      clearCell();
   }
});

document.querySelectorAll(".number").forEach((btn) => {
   if (btn.id === "clear") return;

   const number = parseInt(btn.innerHTML);
   btn.addEventListener("click", () => fillCell(number));
});

document.querySelectorAll(".difficulty").forEach((btn) => {
   btn.addEventListener("click", () => {
      difficulty = btn.dataset.level;

      document.querySelectorAll(".difficulty").forEach(b => b.classList.remove("difficulty-selected"));
      btn.classList.add("difficulty-selected");
   })
});

document.getElementById("notes-toggle").addEventListener("click", () => {
   notesMode = !notesMode;
   document.getElementById("notes-toggle").classList.toggle("toggled", notesMode);
});

let solveInterval = null;
document.getElementById("solve").addEventListener("click", () => {
   clearInterval(timerInterval);
   clearInterval(solveInterval);

   selected = null;
   document.querySelectorAll(".sudoku-cell").forEach(c => {
      c.classList.remove("selected");
      c.classList.remove("highlighted");
   })

   for (let i = 0; i < 81; i++) {
      const element = document.getElementById(`sudoku-${i + 1}`);
      if (element.classList.contains("editable")) {
         userBoard[i] = 0;
         notes[i].clear();
      }
   }
   render(userBoard);

   disableInput(true);
   document.getElementById("start").disabled = true;

   const solvedBoard =[...userBoard];
   solve(solvedBoard);

   const emptyCells = [];
   for (let i = 0; i < 81; i++) {
      if (userBoard[i] === 0) {
         emptyCells.push({ index: i, value: solvedBoard[i]});
      }
   }

   shuffle(emptyCells);

   solveInterval = setInterval(() => {
      if (emptyCells.length === 0) {
         clearInterval(solveInterval);
         return;
      }

      const { index, value} = emptyCells.shift();
      userBoard[index] = value;
      renderCell(index);
   }, 50);

   setTimeout(() => {
      document.getElementById("start").disabled = false;
   }, 50 * emptyCells.length);
});

document.getElementById("hint").addEventListener("click", () => {
   if (inputDisabled) return;
   if (hints <= 0) {
      document.getElementById("hint").disabled = true;
      return;
   };

   const emptyCells = [];
   for (let i = 0; i < 81; i++) {
      if (userBoard[i] === 0) {
         emptyCells.push(i);
      }
   }

   if(emptyCells.length === 0) return;

   const solvedBoard = [...userBoard];
   solve(solvedBoard);

   const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
   const value = solvedBoard[randomIndex];

   userBoard[randomIndex] = value;
   notes[randomIndex].clear();
   renderCell(randomIndex);

   const element = document.getElementById(`sudoku-${randomIndex + 1}`);
   element.classList.remove("invalid");
   element.classList.add("editable");

   hints--;
   document.getElementById("hint").innerHTML = `Hints: ${hints}`;
   if (hints <= 0) {
      document.getElementById("hint").disabled = true;
   }

   selected = randomIndex;
   document.querySelectorAll(".sudoku-cell").forEach(c => {
      c.classList.remove("selected");
      c.classList.remove("highlighted");
   })
   element.classList.add("selected");
   

   highlightRelated(randomIndex);

   if (checkWin()) {
      clearInterval(timerInterval);
      document.getElementById("solve").disabled = true;
      disableInput(true);

      const minutes = Math.floor(timer / 60);
      const seconds = timer % 60;
      const formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
      setTimeout(() => { alert("You completed this puzzle in " + formatted + "!"); }, 100);
   }
});