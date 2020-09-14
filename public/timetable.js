let startTime = 9;
let endTime = 18;
const dayMap = {'Sun' : 0, 'Mon' : 1, 'Tue' : 2, 'Wed' : 3, 'Thu' : 4, 'Fri' : 5, 'Sat' : 6}; // maps day to corresponding column in timetable
let matrix = new Array(7); // keeps track of the state of cells in timetable
buildTimetable(startTime, endTime); // init timetable from 9:00am - 7:00pm
let addedSections = [];


// creates a timetable with the specified start and end time
function buildTimetable(start, end) {
    const tbody = document.getElementById('timetable-body');
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
            timeCell.classList.add('time-cell');
            timeCell.textContent = `${(start+t)}:00`;
        } else {
            timeCell.classList.add('time-cell');
            timeCell.textContent = `${(start+t)}:30`;
            t++;
        }

        for (let j = 0; j < 7; j++) {
            let c = row.insertCell();
            c.classList.add('timetable-cell');
            if (j % 2 == 0) {
                c.classList.add('white-cell');
            }
            matrix[j][i] = {
                "cell" : c,
                "occupied" : false,
                "replaced" : false,
                "rowSpan" : 1
            };
        }
    }
}


// adds new rows to the timetable based on start and end times of the course
// requires start and end to be natural numbers
function addNewRows(start, end) {
    const tbody = document.getElementById('timetable-body');

    let rows;
    let indexTime;
    let startIndex;
    if (start < startTime) {
        rows = (startTime - start) * 2;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < rows; j++) {
                matrix[i].splice(j, 0, {});
            }
        }

        startTime = start;
        indexTime = start;
        startIndex = 0;

    } else if (end > endTime) {
        rows = (end - endTime) * 2;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < rows; j++) {
                matrix[i].push({});
            }
        }

        startIndex = (endTime - startTime) * 2;
        indexTime = endTime;
        endTime = end;
    
    } else {
        console.log('no need to add new time');
        return;
    }

    t = 0;
    for (let r = startIndex; r < rows + startIndex; r++) { // r = index to start adding rows at
        let newRow = tbody.insertRow(r);
        let timeCell = newRow.insertCell();
        if (r % 2 == 0) {
            timeCell.classList.add('time-cell');
            timeCell.textContent = `${(indexTime+t)}:00`;
        } else {
            timeCell.classList.add('time-cell');
            timeCell.textContent = `${(indexTime+t)}:30`;
            t++;
        }

        for (let j = 0; j < 7; j++) {
            let c = newRow.insertCell();
            c.classList.add('timetable-cell');
            if (j % 2 == 0) {
                c.classList.add('white-cell');
            }
            matrix[j][r] = {
                "cell" : c,
                "occupied" : false,
                "replaced" : false,
                "rowSpan" : 1
            };
        }
    }

}

function changeCell(e) {
    e.preventDefault();
    let cell = e.target;

    let colors = ["", "red", "yellow", "blue", "green", "black", "purple", "orange", "indigo", "pink", "aqua", "brown"];

    cell.style.backgroundColor = colors[Math.floor(Math.random() * 11) + 1];
}


// modifies the cell at matrix[column][row] to include course info, expands it to appropriate hour length, and deletes replaced cells
function fillCell(column, row, deptObj, courseObj, sectionObj, classLength) {
    const cellObj = matrix[column][row];
    const cell = cellObj.cell;
    cellObj.occupied = true;
    cellObj['deptObj'] = deptObj;
    cellObj['courseObj'] = courseObj;
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

    return cellObj;
}

// returns the cell at matrix[column][row] to its original state, and restores cells that have been replaced
function removeCell(column, row) {
    const cellObj = matrix[column][row];
    const cell = cellObj.cell;

    // console.log(`Column ${column}, Row ${row}`);
    
    cell.rowSpan = 1;
    cell.textContent = '';
    cell.classList.remove('added-cell');
    cell.classList = 'timetable-cell';
    if (column % 2 == 0) cell.classList.add('white-cell');
    cellObj.occupied = false;
    cellObj.deptObj = null;
    cellObj.courseObj = null;
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
            if (column % 2 == 0) cellToAddObj.cell.classList.add('white-cell');
            cellToAddObj.occupied = false;
            cellToAddObj.replaced = false;

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

        if (start < startTime || end > endTime) addNewRows(start, end);

        days.forEach(day => {
            let column = dayMap[day];
            let row = (start - startTime) * 2;
            let cellObj = fillCell(column, row, deptObj, courseObj, sectionObj, classLength);
            cellObj.cell.addEventListener('click', e => {
                displaySectionRes(cellObj.deptObj, cellObj.courseObj, cellObj.sectionObj);
            });
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

    // console.log(addedSections);
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


