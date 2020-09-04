const fetch = require('isomorphic-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

let globalData = {
    "departments" : {}
}


// Scrape all departments on the SSC and store the object in departments.json
async function scrapeDepts() {
    const responseText = await fetch('https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-all-departments')
        .then(res => res.text());
    const dom = new JSDOM(responseText);
    const document = dom.window.document;
    const tbody = document.querySelector('#mainTable tbody');

    // let data = {
    //     "departments" : []
    // }
    let promises = [];

    for (row of tbody.children) {
        let subjCode = row.children[0].textContent;
        const subjTitle = row.children[1].textContent.trim();
        const faculty = row.children[2].textContent;

        const noCourses = /\s\*/;
        if (noCourses.test(subjCode)) {
            subjCode = subjCode.replace(" \*", "");
        }

        let rowData = {
            "subjCode" : subjCode,
            "title" : subjTitle,
            "faculty" : faculty,
            // "courses" : courses
        };
        
        globalData.departments[subjCode] = rowData;

        const promise = await scrapeDeptCourses(subjCode); // await
        promises.push(promise);
    }

    await Promise.all(promises).then( values => {
        let time = new Date();
        globalData["time"] = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
        console.log(time);
    
        fs.writeFile(path.join(__dirname, 'public', 'departments.json'), JSON.stringify(globalData), err => {
            if (err) throw err;
        });
    
        console.timeEnd('Timed Run');
    });
}

async function scrapeDeptCourses(subjCode) {

    const baseURL = 'https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea' + '&tname=subj-department&dept=';

    const responseText = await fetch(baseURL + subjCode)
        .then(res => res.text());
    const dom = new JSDOM(responseText);
    const document = dom.window.document;
    const tbody = document.querySelector('#mainTable tbody');

    let courses = {};

    if (tbody != null) {
        for (row of tbody.children) {
            const courseCode = row.children[0].textContent.trim();
            const course = courseCode.split(' ')[1];
            const courseTitle = row.children[1].textContent;

            courses[course] = { "courseCode" : courseCode, "courseTitle": courseTitle };
        }
    }
    globalData.departments[subjCode]["courses"] = courses;
}

// Scrapes the information for each course in each department, including section info
function scrapeCourses() {
    fs.readFile(path.join(__dirname, 'public', 'departments.json'), 'utf8', async (err, data) => {
        const obj = JSON.parse(data);
        for (deptObj of obj.departments) {
            // if (deptObj.subjCode === dept) {
                for (course of deptObj.courses) {
                    const arr = course.courseCode.split(" ");
                    const subj = arr[0];
                    const code = arr[1];
                    let courseObj = await scrapeSections(subj, code);
                    course["description"] = courseObj.description;
                    course["credits"] = courseObj.credits;
                    course["prereqs"] = courseObj.prereqs;
                    course["coreqs"] = courseObj.coreqs;
                    course["sections"] = courseObj.sections;
                }
            // }
        }
        fs.writeFile(path.join(__dirname, 'public', 'departments.json'), JSON.stringify(obj), err => {
            if (err) throw err;
        });
        // console.timeEnd('Timed Run');
    });
}

async function scrapeSections(subj, code) {
    const responseText = await fetch(`https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-course&dept=${subj}&course=${code}`)
        .then(res => res.text());
    const dom = new JSDOM(responseText);
    const document = dom.window.document;
    const tbody = document.querySelector('.section-summary tbody');

    const description = document.querySelector('.content.expand p').textContent;
    const pTags = document.querySelectorAll('p');
    const credits = pTags[1].textContent.replace("Credits: ", "");
    let preReqs = "";
    let coReqs = "";

    if (pTags[2] != null && /Pre-reqs:/.test(pTags[2].textContent)) {
        preReqs = pTags[2].textContent.replace("Pre-reqs:", "").trim();
    }

    if (pTags[3] != null && /Co-reqs:/.test(pTags[3].textContent)) {
        coReqs = pTags[3].textContent.replace("Co-reqs:", "").trim();
    }

    let courseData = {
        "description" : description,
        "credits" : credits,
        "prereqs" : preReqs,
        "coreqs" : coReqs,
        "sections" : []
    }

    if (tbody != null) {
        for (row of tbody.children) {
            let status = row.children[0].textContent;
            let sectionCode = row.children[1].textContent;
            const activity = row.children[2].textContent;
            // const term = row.children[3].textContent;
            // const days = row.children[5].textContent;
            // const start = row.children[6].textContent;
            // const end = row.children[7].textContent;

            let rowData = {
                "status" : status,
                "sectionCode" : sectionCode,
                "activity" : activity,
                // "term" : term,
                // "days" : days,
                // "start" : start,
                // "end" : end
            };

            courseData.sections.push(rowData);
        }
    }
    return courseData;
}

async function scrapeSection(dept, course, section) {
    const responseText = await fetch(`https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-section&dept=${dept}&course=${course}&section=${section}`)
        .then(res => res.text());
    const dom = new JSDOM(responseText);
    const document = dom.window.document;
    const sectionInfo = document.querySelector('.table-striped tbody tr');
    
    let term;
    let days;
    let start;
    let end;
    let building;
    let room;

    if (sectionInfo != null) {
        term = sectionInfo.children[0].textContent;
        days = sectionInfo.children[1].textContent;
        start = sectionInfo.children[2].textContent;
        end = sectionInfo.children[3].textContent;
        building = sectionInfo.children[4].textContent;
        room = sectionInfo.children[5].textContent;
        let buildingInfoLink;
        if (/\S/.test(building)) {
            buildingInfoLink = sectionInfo.children[5].firstElementChild.href;
        }
    }

    let instructors = [];
    document.querySelectorAll('table tbody tr').forEach(tr => {
        if (/Instructor:/.test(tr.firstElementChild.textContent)) {
            for (row of tr.parentElement.children) {
                instructors.push(row.children[1].textContent);
            }
        }
    });

    let totalSeats;
    let currentlyReg;
    let generalSeats;
    let restrictedSeats;
    document.querySelectorAll('table thead tr th').forEach(th => {
        if (/Seat Summary/.test(th.textContent)) {
            const tbody = th.parentElement.parentElement.parentElement.lastElementChild;
            
            for (tr of tbody.children) {
                if (/Total Seats Remaining:/.test(tr.textContent)) {
                    totalSeats = parseInt(tr.lastElementChild.textContent);
                    // console.log(totalSeats);
                }
                if (/Currently Registered/.test(tr.textContent)) {
                    currentlyReg =  parseInt(tr.lastElementChild.textContent);
                    // console.log(currentlyReg);
                }
                if (/General Seats Remaining/.test(tr.textContent)) {
                    generalSeats = parseInt(tr.lastElementChild.textContent);
                    // console.log(generalSeats);
                }
                if (/Restricted Seats/.test(tr.textContent)) {
                    restrictedSeats = parseInt(tr.lastElementChild.textContent);
                    // console.log(restrictedSeats);
                }
            }
        }
    });

    let sectionObj = {
        "term": term,
        "days" : days,
        "start" : start,
        "end" : end,
        "instructors" : instructors,
        "building" : building,
        "room" : room,
        "totalSeatRem" : totalSeats,
        "currentReg" : currentlyReg,
        "generalSeatsRem" : generalSeats,
        "restrictedSeatsRem": restrictedSeats
    }

    for (field of Object.values(sectionObj)) {
        console.log(field);
    }
}

console.time('Timed Run');
scrapeDepts(); // takes about 74 seconds

// scrapeCourses(); // takes just under half an hour (29.6 mins)

// scrapeSection('CPSC', '221', '201');



