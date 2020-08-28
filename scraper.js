const fetch = require('isomorphic-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

async function scrapeDepts() {
    const responseText = await fetch('https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-all-departments')
        .then(res => res.text());
    const dom = await new JSDOM(responseText);
    const document = dom.window.document;
    const tbody = document.querySelector('#mainTable tbody');

    let data = {
        "departments" : []
    }

    for (row of tbody.children) {
        let subjCode = row.children[0].textContent;
        const subjTitle = row.children[1].textContent.trim();
        const faculty = row.children[2].textContent;
        const courses = await scrapeDeptCourses(subjCode);

        const noCourses = /\s\*/;
        if (noCourses.test(subjCode)) {
            subjCode = subjCode.replace(" \*", "");
        }

        let rowData = {
            "subjCode" : subjCode,
            "title" : subjTitle,
            "faculty" : faculty,
            "courses" : courses
        };
        
        data.departments.push(rowData);
    }

    fs.writeFile(path.join(__dirname, 'public', 'departments.json'), JSON.stringify(data), err => {
        if (err) throw err;
    });
    console.timeEnd('Timed Run');
}

async function scrapeDeptCourses(subjCode) {

    const baseURL = 'https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea' + '&tname=subj-department&dept=';

    const responseText = await fetch(baseURL + subjCode)
        .then(res => res.text());
    const dom = await new JSDOM(responseText);
    const document = dom.window.document;
    const tbody = document.querySelector('#mainTable tbody');

    let courses = []

    if (tbody != null) {
        for (row of tbody.children) {
            const courseCode = row.children[0].textContent.trim();
            const courseTitle = row.children[1].textContent;
    
            courses.push( { "courseCode" : courseCode, "courseTitle": courseTitle });
        }
    }

    return courses;
}

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
    });
}

async function scrapeSections(subj, code) {
    const responseText = await fetch(`https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-course&dept=${subj}&course=${code}`)
        .then(res => res.text());
    const dom = await new JSDOM(responseText);
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

    for (row of tbody.children) {
        let status = row.children[0].textContent;
        let sectionCode = row.children[1].textContent;
        const activity = row.children[2].textContent;
        const term = row.children[3].textContent;
        const days = row.children[5].textContent;
        const start = row.children[6].textContent;
        const end = row.children[7].textContent;

        let rowData = {
            "status" : status,
            "sectionCode" : sectionCode,
            "activity" : activity,
            "term" : term,
            "days" : days,
            "start" : start,
            "end" : end
        };

        courseData.sections.push(rowData);
    }

    return courseData;
}

console.time('Timed Run');
// scrapeDepts();

scrapeCourses();

