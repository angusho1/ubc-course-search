buildTimetable(9, 19); // init timetable from 9:00am - 7:00pm

function changeCell(e) {
    e.preventDefault();
    var cell = e.target;

    // if (cell.classList.contains('added-cell')) {
    //     cell.classList.remove('added-cell');
    // } else {
    //     cell.classList.add('added-cell');
    // }

    let colors = ["", "red", "yellow", "blue", "green", "black", "purple", "orange", "indigo", "pink", "aqua", "brown"];

    cell.style.backgroundColor = colors[Math.floor(Math.random() * 11) + 1];

    // cell.addEventListener('contextmenu', function() {
    //     e.preventDefault();
    //     // cell.style.backgroundColor = bgColor;
    //     // cell.style.border = border;
    //     if (cell.classList.contains('added-cell')) {
    //         cell.classList.remove('added-cell');
    //     }
        
    //     return false;
    // }, false);
}

function growCell(e) {
    // console.log(e);
    var cell = e.target;

    let span = 6;
    cell.rowSpan = span;
    let index = cell.cellIndex;
    let currRow = cell.parentElement.nextElementSibling;
    for (let i = 1; i < span; i++) {
        let nextRow = currRow.nextElementSibling;
        currRow.deleteCell(index);
        currRow = nextRow;
    }

    cell.removeEventListener('click', growCell);
    cell.addEventListener('click', shrinkCell);
}

function shrinkCell(e) {
    var cell = e.target;

    let span = 6;
    
    let index = cell.cellIndex;
    let currRow = cell.parentElement.nextElementSibling;

    for (let i = 1; i < span; i++) {
        let nextRow = currRow.nextElementSibling;
        currRow.insertCell(index);
        currRow.children[index].addEventListener('click', growCell);
        currRow = nextRow;
    }

    cell.rowSpan = 1;

    cell.removeEventListener('click', shrinkCell);
    cell.addEventListener('click', growCell);
}

// creates a timetable with the specified start and end time
function buildTimetable(start, end) {
    let tbody = document.querySelector('#timetable-body');
    let t = 0;

    for (var i = 0; i < (end - start) * 2; i++) {
        var row = tbody.insertRow();
        var cell = row.insertCell();
        if (i % 2 == 0) {
            cell.classList.add('time-cell-odd');
            cell.textContent = `${(start+t)}:00`;
        } else {
            cell.classList.add('time-cell-even');
            cell.textContent = `${(start+t)}:30`;
            t++;
        }
        var c1 = row.insertCell();
        c1.classList.add('timetable-cell');
        var c2 = row.insertCell();
        c2.classList.add('timetable-cell');
        var c3 = row.insertCell();
        c3.classList.add('timetable-cell');
        var c4 = row.insertCell();
        c4.classList.add('timetable-cell');
        var c5 = row.insertCell();
        c5.classList.add('timetable-cell');
        var c6 = row.insertCell();
        c6.classList.add('timetable-cell');
        var c7 = row.insertCell();
        c7.classList.add('timetable-cell');
    }

    var cells = document.querySelectorAll('.timetable-cell');
    for (var i = 0; i<cells.length; i++) {
        cells[i].addEventListener('contextmenu', changeCell, false);
        cells[i].addEventListener('click', growCell);
    }
}

caches.open('bg')
    .then( cache => {
        cache.add('bg.png')
            .then( () => {
                
            });
    });

