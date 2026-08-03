let board = new Array(81).fill(0);

function shuffle(array) {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }

   return array;
}

function cell(row, column) {return (row * 9 + column);} // convert row and column to cell index

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

      const backup = puzzle[pos];
      puzzle[pos] = 0;

      const testBoard = [...puzzle];
      const solutions = countSolutions(testBoard);

      if (solutions === 1) {
         removed++;
      } else {
         puzzle[pos] = backup;
      }
   }

   return puzzle;
}