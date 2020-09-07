let startTime = 9;
let endTime = 19;
const dayMap = {'Sun' : 0, 'Mon' : 1, 'Tue' : 2, 'Wed' : 3, 'Thu' : 4, 'Fri' : 5, 'Sat' : 6}; // maps day to corresponding column in timetable
let matrix = new Array(7); // keeps track of the state of cells in timetable
let addedSections = [];

buildTimetable(startTime, endTime); // init timetable from 9:00am - 7:00pm

console.log(addedSections);

// creates a timetable with the specified start and end time
function buildTimetable(start, end) {
    let tbody = document.querySelector('#timetable-body');
    let t = 0;
    const rows = (end - start) * 2;

    for (let i = 0; i < 7; i++) {
        matrix[i] = Array(rows);
    }
    console.log(matrix);

    for (let i = 0; i < rows; i++) {
        let row = tbody.insertRow();
        let timeCell = row.insertCell();
        if (i % 2 == 0) {
            timeCell.classList.add('time-cell-odd');
            timeCell.textContent = `${(start+t)}:00`;
        } else {
            timeCell.classList.add('time-cell-even');
            timeCell.textContent = `${(start+t)}:30`;
            t++;
        }

        for (let j = 0; j < 7; j++) {
            let c = row.insertCell();
            c.classList.add('timetable-cell');
            matrix[j][i] = {
                "cell" : c,
                "occupied" : false,
                "replaced" : false,
                "rowSpan" : 1
            };
        }
    }
    // let cells = document.querySelectorAll('.timetable-cell');
    // for (let i = 0; i<cells.length; i++) {
    //     cells[i].addEventListener('contextmenu', changeCell, false);
    //     cells[i].addEventListener('click', growCell);
    // }
}

function changeCell(e) {
    e.preventDefault();
    let cell = e.target;

    let colors = ["", "red", "yellow", "blue", "green", "black", "purple", "orange", "indigo", "pink", "aqua", "brown"];

    cell.style.backgroundColor = colors[Math.floor(Math.random() * 11) + 1];
}


// modifies the cell at matrix[column][row] to include course info, expands it to appropriate hour length, and deletes replaced cells
function fillCell(column, row, sectionObj, classLength) {
    const cellObj = matrix[column][row];
    const cell = cellObj.cell;
    cellObj.occupied = true;
    cellObj['sectionObj'] = sectionObj;
    cellObj.rowSpan = classLength;

    // removes cells that will be filled up with the current cell
    for (let i = 1; i < classLength; i++) {
        let cellToDeleteObj = matrix[column][row+i];
        if (! cellToDeleteObj.occupied) {
            let cellToDelete = cellToDeleteObj.cell;
            cellToDeleteObj.cell = null;

            // finds the correct index of the cell to be removed in the current row
            let rowReplacedCells = 0;
            for (let j = 0; j < column; j++) {
                if (matrix[j][row+i].replaced) rowReplacedCells++;
            }
            let index = column - rowReplacedCells + 1; // +1 to take the time column into account
            // console.log(cellToDeleteObj);
            // console.log(`index: ${index}, column: ${column}, row: ${row+i}`);
            // console.log(cellToDelete);

            cellToDelete.parentElement.deleteCell(index);
            cellToDeleteObj.replaced = true;
            cellToDeleteObj.occupied = true;
        } else {
            throw new Error('Cannot Remove - cell is occupied');
        }
    }

    // updates the modified cell with section info and appropriate styles
    cell.rowSpan = classLength;
    cell.textContent = `${sectionObj.sectionCode} (${sectionObj.activity})`;
    cell.classList = 'added-cell';

    return cell;
}

// returns the cell at matrix[column][row] to its original state, and restores cells that have been replaced
function removeCell(column, row) {
    const cellObj = matrix[column][row];
    const cell = cellObj.cell;

    console.log(`Column ${column}, Row ${row}`);
    
    cell.rowSpan = 1;
    cell.textContent = '';
    cell.classList.remove('added-cell');
    cell.classList = 'timetable-cell';
    cellObj.occupied = false;
    cellObj.sectionObj = null;

    // adds cells that were replaced by the current cell when the section was added
    let currRow = cell.parentElement.nextElementSibling;
    for (let i = 1; i < cellObj.rowSpan; i++) {
        let cellToAddObj = matrix[column][row+i];

        if (cellToAddObj.occupied) {
            // finds the correct index to add a cell in the current row
            let rowReplacedCells = 0;
            for (let j = 0; j < column; j++) {
                if (matrix[j][row+i].replaced) rowReplacedCells++;
            }
            let index = column - rowReplacedCells + 1; // +1 to take the time column into account
            currRow.insertCell(index);

            // updates the corresponding cell in the matrix
            cellToAddObj.cell = currRow.children[index];
            cellToAddObj.cell.classList = 'timetable-cell';
            cellToAddObj.occupied = false;
            cellToAddObj.replaced = false;
            cellToAddObj.sectionObj = null;

        } else {
            console.log('nothing to remove');
        }
        currRow = currRow.nextElementSibling;
    }
    cellObj.rowSpan = 1;
}

// adds the searched section to the timetable
// returns true if the section is successfully added
function addSection(e) {
    const sectionButton = e.target;
    const deptObj = deptOnDisplay;
    const courseObj = courseOnDisplay;
    const sectionObj = sectionOnDisplay;
    sectionButton.blur();

    // if (!canAddSection(sectionObj)) return false;

    for (classObj of sectionObj.classes) {
        const start = convertTime(classObj.start);
        const end = convertTime(classObj.end);
        const classLength = (end - start) * 2;
        const days = classObj.days.trim().split(' ');

        days.forEach(day => {
            let column = dayMap[day];
            let row = (start - startTime) * 2;
            let cell = fillCell(column, row, sectionObj, classLength);
            cell.addEventListener('click', e => {
                displaySectionRes(deptObj, courseObj, sectionObj);
            })
        });
    }

    if (!addedSections.includes(addedSections)) {
        addedSections.push(sectionObj.sectionCode);
    }
    sectionButton.removeEventListener('click', addSection);
    sectionButton.addEventListener('click', removeSection);
    sectionButton.textContent = '- Remove Section';
}

// removes the selected section from the timetable
function removeSection(e) {
    const sectionButton = e.target;
    const sectionObj = sectionOnDisplay;

    for (classObj of sectionObj.classes) {
        const start = convertTime(classObj.start);
        const days = classObj.days.trim().split(' ');

        days.forEach(day => {
            let column = dayMap[day];
            let row = (start - startTime) * 2;
            removeCell(column, row);
        });
    }

    let index = addedSections.indexOf(sectionObj.sectionCode);
    addedSections.splice(index, 1);
    sectionButton.removeEventListener('click', removeSection);
    sectionButton.addEventListener('click', addSection);
    sectionButton.textContent = '+ Add Section';

    console.log(addedSections);
}

// TODO
// returns true if the section can be added to the timetable
function canAddSection(sectionObj) {
    if (sectionObj.sectionCode in addedSections) {
        return false;
    } else if (sectionObj) {
        // return false;
    }
    return true;
}


// converts time string formatted as "HH:MM" and returns a number
// ex: 14:30 -> 14.5
function convertTime(str) {
    const timeArray = str.split(':');
    const hours = parseInt(timeArray[0]);
    const minutes = parseInt(timeArray[1]) / 60;
    // console.log(`${str} -> ${hours + minutes}`);
    return hours + minutes;
}

caches.open('bg')
    .then( cache => {
        cache.add('bg.png')
            .then( () => {
                
            });
    });

