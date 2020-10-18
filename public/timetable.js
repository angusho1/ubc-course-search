/**
 * Provides functionality for creating interactive timetables
*/

// maps day to corresponding column in timetable
const DAY_MAP = {'Sun' : 0, 'Mon' : 1, 'Tue' : 2, 'Wed' : 3, 'Thu' : 4, 'Fri' : 5, 'Sat' : 6};

class Timetable {
    matrix = new Array(7); // keeps track of the state of cells in timetable
    addedSections = [];

    /**
     * Creates a timetable with the specified start and end time
     * 
     * @param {number} start  The default start time of the timetable
     * @param {number} end  The default end time of the timetable
     */
    constructor(start, end) {
        this.startTime = start;
        this.endTime = end;

        const tbody = document.getElementById('timetable-body');
        let t = 0;
        const rows = (end - start) * 2;
    
        for (let i = 0; i < 7; i++) {
            this.matrix[i] = Array(rows);
        }
    
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
                this.matrix[j][i] = {
                    "cell" : c,
                    "occupied" : false,
                    "replaced" : false,
                    "rowSpan" : 1
                };
            }
        }
    }

    /**
     * Adds new rows to the timetable based on start and end times of the course
     * 
     * @param {number} start 
     * @param {number} end
     * 
     * @requires start and end are natural numbers
     */
    addNewRows(start, end) {
        const tbody = document.getElementById('timetable-body');

        let rows;
        let indexTime;
        let startIndex;
        if (start < this.startTime) {
            rows = (startTime - start) * 2;
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < rows; j++) {
                    this.matrix[i].splice(j, 0, {});
                }
            }
    
            this.startTime = start;
            indexTime = start;
            startIndex = 0;
    
        } else if (end > this.endTime) {
            rows = (end - this.endTime) * 2;
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < rows; j++) {
                    this.matrix[i].push({});
                }
            }
    
            startIndex = (this.endTime - this.startTime) * 2;
            indexTime = this.endTime;
            this.endTime = end;
        
        } else {
            console.log('No need to add new time');
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
                this.matrix[j][r] = {
                    "cell" : c,
                    "occupied" : false,
                    "replaced" : false,
                    "rowSpan" : 1
                };
            }
        }
    }


     /**
      * adds the given section to the timetable
      * 
      * @param {event} e 
      * 
      * @return Boolean
      */
    addSection(deptObj, courseObj, sectionObj) {
        // if (!canAddSection(sectionObj)) return false;
    
        for (let classObj of sectionObj.classes) {
            const start = this.convertTime(classObj.start);
            const end = this.convertTime(classObj.end);
            const classLength = (end - start) * 2;
            const days = classObj.days.trim().split(' ');
    
            if (start < this.startTime || end > this.endTime) addNewRows(start, end);
    
            days.forEach(day => {
                let column = DAY_MAP[day];
                let row = (start - this.startTime) * 2;
                let cellObj = this.fillCell(column, row, deptObj, courseObj, sectionObj, classLength);
                cellObj.cell.addEventListener('click', e => {
                    displaySectionRes(cellObj.deptObj, cellObj.courseObj, cellObj.sectionObj);
                });
            });
        }
    
        if (!this.addedSections.includes(this.addedSections)) {
            this.addedSections.push(sectionObj.sectionCode);
        }
    }

    /**
     * removes the selected section from the timetable
     * 
     * @param {event*} e 
     */
    removeSection(sectionObj) {
        for (let classObj of sectionObj.classes) {
            const start = this.convertTime(classObj.start);
            const days = classObj.days.trim().split(' ');
    
            days.forEach(day => {
                let column = DAY_MAP[day];
                let row = (start - this.startTime) * 2;
                this.removeCell(column, row);
            });
        }
    
        let index = this.addedSections.indexOf(sectionObj.sectionCode);
        this.addedSections.splice(index, 1);
    }

    /**
     * modifies the cell at matrix[column][row] to include course info, expands it to appropriate hour
     * length, and deletes replaced cells
     * 
     * @param {number} column  the index of the column of the cell
     * @param {number} row  the index of the row of the cell
     * @param {object} deptObj  object containing department info
     * @param {object} courseObj  object containing course info
     * @param {object} sectionObj  object containing section info
     * @param {number} classLength  object containing department info
     * 
     * @returns {object}    an object containing all info about the modified cell
     */
    fillCell(column, row, deptObj, courseObj, sectionObj, classLength) {
        const cellObj = this.matrix[column][row];
        const cell = cellObj.cell;
        cellObj.occupied = true;
        cellObj['deptObj'] = deptObj;
        cellObj['courseObj'] = courseObj;
        cellObj['sectionObj'] = sectionObj;
        cellObj.rowSpan = classLength;

        // removes cells that will be filled up with the current cell
        for (let i = 1; i < classLength; i++) {
            let cellToDeleteObj = this.matrix[column][row+i];
            if (! cellToDeleteObj.occupied) {
                let cellToDelete = cellToDeleteObj.cell;
                cellToDeleteObj.cell = null;

                // finds the correct index of the cell to be removed in the current row
                let rowReplacedCells = 0;
                for (let j = 0; j < column; j++) {
                    if (this.matrix[j][row+i].replaced) rowReplacedCells++;
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

    /**
     * modifies the cell at matrix[column][row] to its original state, and restores cells that have been
     * replaced
     * 
     * @param {number} column  the index of the column of the cell to remove
     * @param {number} row  the index of the row of the cell to remove
     */
    removeCell(column, row) {
        const cellObj = this.matrix[column][row];
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
            let cellToAddObj = this.matrix[column][row+i];

            if (cellToAddObj.occupied) {
                // finds the correct index to add a cell in the current row
                let rowReplacedCells = 0;
                for (let j = 0; j < column; j++) {
                    if (this.matrix[j][row+i].replaced) rowReplacedCells++;
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

    /**
     * returns true if the section can be added to the timetable
     * @todo implement this
     * 
     * @param {object} sectionObj  object containing section info
     * 
     * @returns {boolean}
     */
    canAddSection(sectionObj) {
        if (sectionObj.sectionCode in this.addedSections) {
            return false;
        } else if (sectionObj) {
            // return false;
        }
        return true;
    }

    /**
     * converts time string formatted as "HH:MM" and returns a number
     * ex: 14:30 -> 14.5
     * 
     * @param {string} str  the time string to convert
     * 
     * @returns {number} the converted time
     */
    convertTime(str) {
        const timeArray = str.split(':');
        const hours = parseInt(timeArray[0]);
        const minutes = parseInt(timeArray[1]) / 60;
        // console.log(`${str} -> ${hours + minutes}`);
        return hours + minutes;
    }
}
