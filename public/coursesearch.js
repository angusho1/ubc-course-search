buildTimetable();

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
}

function buildTimetable() {
    var tbody = document.querySelector('#timetable-body');
    var start = 9;
    var t = 0;

    for (var i = 0; i < 20; i++) {
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


function addSection(e) {
    e.target.blur();
}

function onClick1(e) {
    e.preventDefault();

    var xhr = new XMLHttpRequest();
    
    xhr.open('GET', '', true);

    console.log(xhr);

    xhr.onload = function() {
        if (this.status == 200) {
            // console.log(xhr);
            console.log(this.responseText);
        }
    }

    xhr.send();

}
