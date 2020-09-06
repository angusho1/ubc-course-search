// Deals with all front end search functionality

//  
const searchBtn = document.getElementById('search-btn');
const inputs = document.querySelectorAll('input[type=text]');
const dept = document.getElementById('dept');
const course = document.getElementById('course');
const section = document.getElementById('section');
let coursesData; // object containing all course data
let buildingData;

preFetchData();
initSearchBox();
searchBtn.addEventListener('click', initSearch);


// calls back end for JSON file containing all course data
async function preFetchData() {
    await fetch('departments.json')
        .then(res => res.json())
        .then(data => {
            coursesData = data;
            console.log(coursesData);
        });

    await fetch('buildings.json')
    .then(res => res.json())
    .then(data => {
        buildingData = data;
        console.log(buildingData);
    });
}

// Add placeholder listeners
function initSearchBox() {
    for (var i = 0; i<inputs.length; i++) {
        inputs[i].addEventListener('focus', hidePlaceHolder);
    }
}

// Called when search is entered
// Determines search type (department, course, or section), and calls the appropriate function to display results
function initSearch(e) {
    e.preventDefault();

    const searchType = determineSearch();
    if (searchType.invalid) return;

    const deptKey = dept.value.toUpperCase().replace(/\s+/g, '');
    const courseKey = course.value.toUpperCase().replace(/\s+/g, '');
    const sectionKey = section.value.toUpperCase().replace(/\s+/g, '');
    resetInputs();

    searchFunc = searchType.searchFunc;
    searchFunc(deptKey, courseKey, sectionKey);
}

// searches course data object for department-specific information
function searchDept(deptKey, courseKey, sectionKey) {
    const deptObj = coursesData.departments[deptKey];
    if (deptObj != null) {
        displayDeptRes(deptObj);
    } else {
        searchFailed('department', deptKey);
        markInput(inputs[0], false);
    }
}

// searches courseData object for course-specific information
function searchCourse(deptKey, courseKey, sectionKey) {
    const deptObj = coursesData.departments[deptKey];
    if (deptObj != null) {
        const courseObj = deptObj.courses[courseKey];
        if (courseObj != null) {
            displayCourseRes(deptObj, courseObj);
        } else {
            searchFailed('course code', `${deptKey} ${courseKey}`);
            markInput(inputs[1], false);
        }
    } else {
        searchFailed('department', deptKey);
        markInput(inputs[0], false);
    }
}

// searches courseData object for section-specific information
function searchSection(deptKey, courseKey, sectionKey) {
    const deptObj = coursesData.departments[deptKey];
    if (deptObj != null) {
        const courseObj = deptObj.courses[courseKey];
        if (courseObj != null) {
            const sectionObj = courseObj.sections[sectionKey];
            if (sectionObj != null) {
                displaySectionRes(deptObj, courseObj, sectionObj);
            } else {
                searchFailed('section code', `${deptKey} ${courseKey} ${sectionKey}`)
                markInput(inputs[2], false);
            }
        } else {
            searchFailed('course code', `${deptKey} ${courseKey}`);
            markInput(inputs[1], false);
        }
    } else {
        searchFailed('department', deptKey);
        markInput(inputs[0], false);
    }
}

// allow inputs to be reset after search has been initiated
function resetInputs() {
    inputs.forEach(input => {
        if (!(/^\s*$/.test(input.value))) {
            input.classList.add('searched-input');
            input.addEventListener('focus', (e) => {
                e.target.value = '';
                e.target.classList.remove('searched-input');
            })
        }
        input.blur();
    })
}

// display search results from a department search
function displayDeptRes(deptObj) {
    let displayBox = document.getElementById('display-box');

    // const courses = dept_obj.courses.map(course => `${course.courseCode} - ${course.courseTitle}`);
    const courses = deptObj.courses;

    courseStr = `<ul>`;
    Object.values(courses).forEach(course =>  {
        courseStr += `<li><b>${course.courseCode}</b> - ${course.courseTitle}</li>`;
    });
    courseStr += `</ul>`;

    displayBox.innerHTML = `<h3>${deptObj.title} (${deptObj.subjCode})</h3>
    ${deptObj.faculty}
    </br>
    Courses: ${courseStr}`;

    unhideDisplay();
}

// display search results from a course search
function displayCourseRes(deptObj, courseObj) {
    let displayBox = document.getElementById('display-box');

    const prereqs = courseObj.prereqs;
    const sections = Object.entries(courseObj.sections).map(sectionObj => sectionObj[1].sectionCode);

    let sectionStr = `<ul>`;
    sections.forEach(section =>  {
        sectionStr += `<li>${section}</li>`;
    });
    sectionStr += `</ul>`;
    
    displayBox.innerHTML = `<h3>${deptObj.subjCode} ${courseObj.courseCode.split(" ")[1]}</h3>
    <b>${courseObj.courseTitle}</b>
    </br>
    Credits: <b>${courseObj.credits}</b>
    </br>
    Pre-Reqs: <b>${prereqs}</b>
    </br>
    Sections: <b>${sectionStr}</b>`;

    unhideDisplay(); 
}

// display search results from a section search
function displaySectionRes(deptObj, courseObj, sectionObj) {

    let displayBox = document.getElementById('display-box');

    let classDivs = '';
    sectionObj.classes.forEach(classObj => {
        let dayString;

        dayString = classObj.days.trim().split(' ').join(' / ');

        let locationInfo = /\S/.test(classObj.location.building) && /\S/.test(classObj.location.room) ? 
        `Building: <b>${classObj.location.building}</b>
       </br>
       Room: <b>${classObj.location.room}</b>` : '';

        classDiv = document.createElement('div');
        classDiv.classList = 'class-div';
        classDiv.innerHTML = `
        <b>${dayString}</b> <span style="float:right; font-style: italic">TERM ${classObj.term}</span>
        </br>
        Start: <b>${classObj.start}</b>
        </br>
        End: <b>${classObj.end}</b>
        </br>
        ${locationInfo}`;
        // classDiv.appendChild(createMapBtn());
        classDivs += classDiv.outerHTML;
    })

    displayBox.innerHTML = `<h3>${deptObj.subjCode} ${courseObj.course} ${sectionObj.section} (${sectionObj.activity})</h3>
    <b>${courseObj.courseTitle}</b>
    </br>`;

    const instructors = sectionObj.instructors.length > 1 ? `Instructors: <ul style="padding-bottom: 10px"><li><b>${sectionObj.instructors.join('</b></li><li><b>')}</b></li></ul>` : `Instructor: <b>${sectionObj.instructors[0]}</b></br>`;

    displayBox.innerHTML += `${instructors}
    Credits: <b>${courseObj.credits}</b>
    </br>
    ${classDivs}
    Total Seats Remaining: <b>${sectionObj.totalSeatsRem}</b>`;

    for (let i=0; i<sectionObj.classes.length; i++) {
        const building = sectionObj.classes[i].location.building;
        if (/\S/.test(building) && /\S/.test(sectionObj.classes[i].location.room)) {
            const address = buildingData[building].address;
            document.querySelectorAll('.class-div')[i].appendChild(createMapBtn(building, address, i));
        }
    }

    displayBox.appendChild(createAddSectionBtn());
    
    unhideDisplay();
}


// creates a button for adding a section to the timetable
function createAddSectionBtn() {
    let addButton = document.createElement('button');
    addButton.textContent = "+ Add Section";
    addButton.classList.add('btn', 'small-btn');
    addButton.id = 'add-button';
    addButton.addEventListener('click', addSection);
    return addButton;
}

// creates a button for opening a map of the current section
function createMapBtn(building, address, id) {
    loadMap(building, address, id);
    let mapButton = document.createElement('button');
    mapButton.textContent = "Open Map";
    mapButton.classList.add('btn', 'small-btn', 'map-btn');
    mapButton.id = `map-btn-${id}`;
    mapButton.addEventListener('click', (e) => {
        openMap(building, `map-${id}`);
    });
    return mapButton;
}


// adds the searched section to the timetable
function addSection(e) {
    e.target.blur();

    let addButton = document.getElementById('add-button');
    addButton.textContent = '- Remove Section';

    addButton.addEventListener('click', removeSection);

    console.log("Section added");
}

// removes the selected section from the timetable
function removeSection() {
    console.log("Remove attempted");

    let addButton = document.getElementById('add-button');
    addButton.textContent = '+ Add Section';

    addButton.removeEventListener('click', removeSection);
}

// unhides the search results box
function unhideDisplay() {
    let displayBox = document.getElementById('display-box');
    if (displayBox.classList.contains('hidden')) {
        displayBox.classList.remove('hidden');
    }
}

// determines if the search is syntactically valid, and determines the type of search initiated (department, course, or section)
// Marks valid and invalid inputs depending on the type of search
function determineSearch() {
    let val = { invalid: false, searchFunc: searchDept };
    let r1 = /^\s*[a-z]{2,4}\s*$/i;  // regex for dept code
    let r2 = /^\s*[a-z0-9]{3,4}\s*$/i; // regex for course and section code
    let re = /^\s*$/; // regex for blank field

    let deptKeyid = r1.test(dept.value);
    let courseKeyid = r2.test(course.value);
    let sectionValid = r2.test(section.value);
    let deptEmpty = re.test(dept.value);
    let courseEmpty = re.test(course.value);
    let sectionEmpty = re.test(section.value);

    if (!sectionEmpty) {
        if (courseEmpty || !courseKeyid) {
            markInput(course, false);
            val.invalid = true;
        } else {
            markInput(course, true);
        }
        if (deptEmpty || !deptKeyid) {
            markInput(dept, false);
            val.invalid = true;
        } else {
            markInput(dept, true);
        }
        markInput(section, sectionValid);
        if (!sectionValid) val.invalid = true;
        val.searchFunc = searchSection;
    } else if (!courseEmpty) {
        if (deptEmpty || !deptKeyid) {
            markInput(dept, false);
            val.invalid = true;
        } else {
            markInput(dept, true);
        }
        markInput(course, courseKeyid);
        markInput(section, true);
        if (!courseKeyid) val.invalid = true;
        val.searchFunc = searchCourse;
    } else if (deptEmpty || !deptKeyid) {
        markInput(dept, false);
        val.invalid = true;
        markInput(course, true);
        markInput(section, true);
    } else {
        markInput(dept, true);
        markInput(course, true);
        markInput(section, true);
    }
    return val;
}

// displays "Search Not Found" on the results display box
function searchFailed(searchType, input) {
    let displayBox = document.getElementById('display-box');
    displayBox.innerHTML = `<h3>Search Not Found</h3>
                            <h4 style="font-style: italic;">'${input}' is not a valid ${searchType}</h4>`;
    if (displayBox.classList.contains('hidden')) {
        displayBox.classList.remove('hidden');
    }
}


// function buildlink() { // Probably don't need this anymore
//     let baseURL = "https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea";

//     if (course === '') {
//         baseURL += `&tname=subj-department&dept=${dept}`;
//     } else if (section === '') {
//         baseURL += `&tname=subj-course&dept=${dept}&course=${course}`;
//     } else {
//         baseURL += `&tname=subj-section&dept=${dept}&course=${course}&section=${section}`;
//     }

//     return baseURL;
// }

// marks an input box as either valid (green) or invalid (red)
function markInput(input, valid) {
    if (valid) {
        if (input.classList.contains('error-border')) {
            input.classList.remove('error-border');
        }
    } else {
        if (!input.classList.contains('error-border')) {
            input.classList.add('error-border');
        }
    }
}

// removes the placeholder from an input box
function hidePlaceHolder(e) {
    var clickedInputBox = e.target;
    var placeholder = clickedInputBox.placeholder;
    clickedInputBox.placeholder = "";
    clickedInputBox.addEventListener('blur', function() {
        clickedInputBox.placeholder = placeholder;
    })
}