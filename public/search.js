// Deals with all front end search functionality

//  
const searchBtn = document.getElementById('search-btn');
const inputs = document.querySelectorAll('input[type=text]');
const dept = document.getElementById('dept');
const course = document.getElementById('course');
const section = document.getElementById('section');
let coursesData; // object containing all course data

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

    const deptVal = dept.value.toUpperCase().replace(/\s+/g, '');
    const courseVal = course.value.toUpperCase().replace(/\s+/g, '');
    const sectionVal = section.value.toUpperCase().replace(/\s+/g, '');
    resetInputs();

    searchFunc = searchType.searchFunc;
    searchFunc(deptVal, courseVal, sectionVal)

    // fetch('/api/data.json')
    //     .then(res => res.json())
    //     .then(displaySearchRes)
    //     .catch(searchFailed);
}

// searches course data object for department-specific information
function searchDept(deptVal, courseVal, sectionVal) {
    const deptObj = coursesData.departments[deptVal];
    if (deptObj != null) {
        displayDeptRes(deptObj);
    // if (deptObj != null) {
    //     displayDeptRes({
    //         "dept" : deptObj.subjCode,
    //         "title" : deptObj.title,
    //         "faculty" : deptObj.faculty,
    //         "courses" : deptObj.courses
    //     });
    } else {
        searchFailed();
    }
    // for (deptObj of coursesData.departments) {
    //     if (deptObj.subjCode === deptVal) {
    //         displayDeptRes({
    //             "dept" : deptObj.subjCode,
    //             "title" : deptObj.title,
    //             "faculty" : deptObj.faculty,
    //             "courses" : deptObj.courses
    //         });
    //         return;
    //     }
    // }
    // searchFailed();
}

// searches courseData object for course-specific information
function searchCourse(deptVal, courseVal, sectionVal) {
    for (deptObj of coursesData.departments) {
        if (deptObj.subjCode === deptVal) {
            for (courseObj of deptObj.courses) {
                if (courseObj.courseCode === `${deptVal} ${courseVal}`) {
                    displayCourseRes({
                        "dept" : deptObj.subjCode,
                        "title" : deptObj.title,
                        "faculty" : deptObj.faculty
                        // "courses" : deptObj.courses
                    },
                    {
                        "title" : courseObj.courseTitle,
                        "courseCode" : courseObj.courseCode,
                        "credits" : courseObj.credits,
                        "prereqs" : courseObj.prereqs,
                        "sections" : courseObj.sections
                    });
                    return;
                }
            }
            searchFailed();
            return;
        }
    }
    searchFailed();
}

// searches courseData object for section-specific information
function searchSection(deptVal, courseVal, sectionVal) {

}


function displaySearchRes(res) { // TOOO: replace entirely
    const deptVal = dept.value.toUpperCase().replace(/\s+/g, '');
    const courseVal = course.value.toUpperCase().replace(/\s+/g, '');
    const sectionVal = section.value.toUpperCase().replace(/\s+/g, '');
    resetInputs();
    
    let dept_obj;
    for (d of res) {
        if (d.dept == deptVal) {
            dept_obj = d;
        }
    }

    if (courseVal == '') {
        // displayDeptRes(dept_obj);
        displayDeptResNew(deptVal);

    } else {
        let course_obj;
        for (c of dept_obj.courses) {
            if (c.course == courseVal) {
                course_obj = c;
            }
        }

        if (sectionVal == '') {
            displayCourseRes(dept_obj, course_obj);
        } else {
            let instr;
            let section_obj;
            for (s of course_obj.sections) {
                if (s.section == sectionVal) {
                    section_obj = s;
                    instr = section_obj.instructor[0]
                }
            }
            displaySectionRes(dept_obj, course_obj, section_obj);
        }
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
function displayCourseRes(dept_obj, course_obj) {
    let displayBox = document.getElementById('display-box');

    const prereqs = course_obj.prereqs;
    const sections = course_obj.sections.map(section => section.sectionCode);

    let sectionStr = `<ul>`;
    sections.forEach(section =>  {
        sectionStr += `<li>${section}</li>`;
    });
    sectionStr += `</ul>`;
    
    displayBox.innerHTML = `<h3>${dept_obj.dept} ${course_obj.courseCode.split(" ")[1]}</h3>
    <b>${course_obj.title}</b>
    </br>
    Credits: <b>${course_obj.credits}</b>
    </br>
    Pre-Reqs: <b>${prereqs}</b>
    </br>
    Sections: <b>${sectionStr}</b>`;

    unhideDisplay();

}

// display search results from a section search
function displaySectionRes(dept_obj, course_obj, section_obj) {

    let displayBox = document.getElementById('display-box');

    loadMap(section_obj.logistics[0].building.address, section_obj.logistics[0].building.name);

    displayBox.innerHTML = `<h3>${dept_obj.dept} ${course_obj.course} ${section_obj.section} (${section_obj.activity})</h3>
    <b>${course_obj.title}</b>
    </br>
    Instructor: <b>${section_obj.instructor}</b>
    </br>
    Credits: <b>${course_obj.credits}</b>
    </br>
    Building: <b>${section_obj.logistics[0].building.name}</b>
    </br>
    Room: <b>${section_obj.logistics[0].room}</b>
    </br>
    Start: <b>${section_obj.logistics[0].start}</b>
    </br>
    End: <b>${section_obj.logistics[0].end}</b>
    </br>
    Total Seats Remaining: <b>${section_obj.total_seats_rem}</b>`;

    displayBox.appendChild(createAddSectionBtn());
    displayBox.appendChild(createMapBtn());
    

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
function createMapBtn() {
    let mapButton = document.createElement('button');
    mapButton.textContent = "Open Map";
    mapButton.classList.add('btn', 'small-btn');
    mapButton.addEventListener('click', openMap); // need to init
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

    let deptValid = r1.test(dept.value);
    let courseValid = r2.test(course.value);
    let sectionValid = r2.test(section.value);
    let deptEmpty = re.test(dept.value);
    let courseEmpty = re.test(course.value);
    let sectionEmpty = re.test(section.value);

    if (!sectionEmpty) {
        if (courseEmpty || !courseValid) {
            markInput(course, false);
            val.invalid = true;
        } else {
            markInput(course, true);
        }
        if (deptEmpty || !deptValid) {
            markInput(dept, false);
            val.invalid = true;
        } else {
            markInput(dept, true);
        }
        markInput(section, sectionValid);
        if (!sectionValid) val.invalid = true;
        val.searchFunc = searchSection;
    } else if (!courseEmpty) {
        if (deptEmpty || !deptValid) {
            markInput(dept, false);
            val.invalid = true;
        } else {
            markInput(dept, true);
        }
        markInput(course, courseValid);
        markInput(section, true);
        if (!courseValid) val.invalid = true;
        val.searchFunc = searchCourse;
    } else if (deptEmpty || !deptValid) {
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
function searchFailed(err) {
    let displayBox = document.getElementById('display-box');
    displayBox.innerHTML = `<h3>Search Not Found</h3>`;
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