var search = document.getElementById('search-btn');
var inputs = document.querySelectorAll('input[type=text]');
const dept = document.getElementById('dept');
const course = document.getElementById('course');
const section = document.getElementById('section');

for (var i = 0; i<inputs.length; i++) {
    inputs[i].addEventListener('focus', hidePlaceHolder);
}

search.addEventListener('click', initSearch);

function initSearch(e) {
    e.preventDefault();

    const searchType = determineSearch();
    if (searchType.invalid) return;

    const deptVal = dept.value.toUpperCase().replace(/\s+/g, '');
    const courseVal = course.value.toUpperCase().replace(/\s+/g, '');
    const sectionVal = section.value.toUpperCase().replace(/\s+/g, '');
    resetInputs();

    searchFunc = searchType.searchFunc;
    searchFunc(deptVal, courseVal, sectionVal);

    // fetch('/api/data.json')
    //     .then(res => res.json())
    //     .then(displaySearchRes)
    //     .catch(searchFailed);
}

function searchDept(deptVal, courseVal, sectionVal) {
    fetch('departments.json')
        .then(res => res.json())
        .then(data => {
            for (let i = 0; i < data.departments.length; i++) {
                let dept = data.departments[i];
                if (dept.subjCode === deptVal) {
                    displayDeptRes({
                        "dept" : dept.subjCode,
                        "title" : dept.title,
                        "faculty" : dept.faculty,
                        "courses" : dept.courses
                    });
                    return;
                }
            }
            throw new err;
        })
        .catch(searchFailed);
}


function searchCourse(deptVal, courseVal, sectionVal) { // TOOO: implement
    console.log("searching course");
}

function searchSection(deptVal, courseVal, sectionVal) { // TOOO: implement
    console.log("searching section");
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


function displayDeptRes(dept_obj) {
    let displayBox = document.getElementById('display-box');

    // const courses = dept_obj.courses.map(course => `${course.courseCode} - ${course.courseTitle}`);
    const courses = dept_obj.courses;

    courseStr = `<ul>`;
    courses.forEach(course =>  {
        courseStr += `<li><b>${course.courseCode}</b> - ${course.courseTitle}</li>`;
    });
    courseStr += `</ul>`;

    displayBox.innerHTML = `<h3>${dept_obj.title} (${dept_obj.dept})</h3>
    ${dept_obj.faculty}
    </br>
    Courses: ${courseStr}`;

    unhideDisplay();
}

function displayCourseRes(dept_obj, course_obj) {
    let displayBox = document.getElementById('display-box');

    const prereqs = course_obj.prereqs.join(", ");
    let sectionsOutput = '';
    const sections = course_obj.sections.map(section => `${dept_obj.dept} ${course_obj.course} ${section.section}`);

    sectionStr = `<ul>`;
    sections.forEach(section =>  {
        sectionStr += `<li>${section}</li>`;
    });
    sectionStr += `</ul>`;
    
    displayBox.innerHTML = `<h3>${dept_obj.dept} ${course_obj.course}</h3>
    <b>${course_obj.title}</b>
    </br>
    Credits: <b>${course_obj.credits}</b>
    </br>
    Pre-Reqs: <b>${prereqs}</b>
    </br>
    Sections: <b>${sectionStr}</b>`;

    unhideDisplay();

}

function displaySectionRes(dept_obj, course_obj, section_obj) {

    let displayBox = document.getElementById('display-box');

    // let output = '';
    // for (field in section_obj) {
    //     output += `${field}: <b>${section_obj[field]}</b></br>`;
    // }
    // displayBox.innerHTML = output;

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

    let addButton = document.createElement('button');
    addButton.textContent = "+ Add Section";
    addButton.classList.add('btn', 'small-btn');
    addButton.id = 'add-button';
    addButton.addEventListener('click', addSection);
    displayBox.appendChild(addButton);

    let mapButton = document.createElement('button');
    mapButton.textContent = "Open Map";
    mapButton.classList.add('btn', 'small-btn');
    mapButton.addEventListener('click', openMap); // need to init
    displayBox.appendChild(mapButton);
    

    unhideDisplay();
}

function addSection() {
    let addButton = document.getElementById('add-button');
    addButton.textContent = '- Remove Section';

    


    addButton.addEventListener('click', removeSection);

    console.log("Section added");
}

function removeSection() {
    console.log("Remove attempted");

    let addButton = document.getElementById('add-button');
    addButton.textContent = '+ Add Section';

    addButton.removeEventListener('click', removeSection);
}

function unhideDisplay() {
    let displayBox = document.getElementById('display-box');
    if (displayBox.classList.contains('hidden')) {
        displayBox.classList.remove('hidden');
    }
}

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

function searchFailed(err) {
    let displayBox = document.getElementById('display-box');
    displayBox.innerHTML = `<h3>Search Not Found</h3>`;
    if (displayBox.classList.contains('hidden')) {
        displayBox.classList.remove('hidden');
    }
}

function buildlink() {
    let baseURL = "https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea";

    if (course === '') {
        baseURL += `&tname=subj-department&dept=${dept}`;
    } else if (section === '') {
        baseURL += `&tname=subj-course&dept=${dept}&course=${course}`;
    } else {
        baseURL += `&tname=subj-section&dept=${dept}&course=${course}&section=${section}`;
    }

    return baseURL;
}

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

function hidePlaceHolder(e) {
    var clickedInputBox = e.target;
    var placeholder = clickedInputBox.placeholder;
    clickedInputBox.placeholder = "";
    clickedInputBox.addEventListener('blur', function() {
        clickedInputBox.placeholder = placeholder;
    })
}