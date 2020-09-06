const fetch = require('isomorphic-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

let globalData = {
    "departments" : {}
}

let buildingData = {};


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

            courses[course] = { "courseCode" : courseCode, "courseTitle": courseTitle, "course" : course };
        }
    }
    globalData.departments[subjCode]["courses"] = courses;
}

// Scrapes the information for each course in each department, including section info
function scrapeCourses() {
    fs.readFile(path.join(__dirname, 'public', 'departments.json'), 'utf8', async (err, data) => {
        globalData = JSON.parse(data);
        let promises = [];
        for (deptKey in globalData.departments) {
            const deptObj = globalData.departments[deptKey];
            for (courseKey in deptObj.courses) {
                console.log(deptKey, courseKey);
                const promise = await scrapeCourseSections(deptKey, courseKey);
                promises.push(promise);
            }
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
    });
}

async function scrapeCourseSections(deptKey, courseKey) {
    const responseText = await fetch(`https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-course&dept=${deptKey}&course=${courseKey}`)
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

    const courseData = globalData.departments[deptKey].courses[courseKey];
    
    courseData["description"] = description;
    courseData["credits"] = credits;
    courseData["prereqs"] = preReqs;
    courseData["coreqs"] = coReqs;
    courseData["sections"] = {};

    if (tbody != null) {
        for (row of tbody.children) {
            let status = row.children[0].textContent;
            let sectionCode = row.children[1].textContent;
            let section = sectionCode.split(' ')[2];
            const activity = row.children[2].textContent;

            let rowData = {
                "status" : status,
                "sectionCode" : sectionCode,
                "section" : section,
                "activity" : activity,
            };

            courseData.sections[section] = rowData;
        }
    }
}

function scrapeAllSections() {
    fs.readFile(path.join(__dirname, 'public', 'departments.json'), 'utf8', async (err, data) => {
        globalData = JSON.parse(data);
        let promises = [];
        for (deptKey in globalData.departments) {
            const deptObj = globalData.departments[deptKey];
            for (courseKey in deptObj.courses) {
                const courseObj = deptObj.courses[courseKey];
                for (sectionKey in courseObj.sections) {
                    const promise = await scrapeSection(deptKey, courseKey, sectionKey);
                    promises.push(promise);
                }
            }
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
    });
}

async function scrapeSection(deptKey, courseKey, sectionKey) {
    const responseText = await fetch(`https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-section&dept=${deptKey}&course=${courseKey}&section=${sectionKey}`)
        .then(res => res.text());
    const dom = new JSDOM(responseText);
    const document = dom.window.document;
    const sectionInfo = document.querySelector('.table-striped tbody');
    console.log(deptKey, courseKey, sectionKey);

    let classes = [];
    if (sectionInfo != null && sectionInfo.firstElementChild.children.length == 6) {
        for (row of sectionInfo.children) {
            if (row.children.length == 6) {
                let term = row.children[0].textContent;
                let days = row.children[1].textContent;
                let start = row.children[2].textContent;
                let end = row.children[3].textContent;
                let building = row.children[4].textContent;
                let room = row.children[5].textContent;
                let buildingInfoLink;
                if (/\S/.test(room) && row.children[5].firstElementChild) {
                    buildingInfoLink = row.children[5].firstElementChild.href;
                }
    
                classes.push({
                    "term": term,
                    "days" : days,
                    "start" : start,
                    "end" : end,
                    "location" : {
                        "building" : building,
                        "room" : room,
                    }
                });
            }
        }
    }

    let instructors = [];
    document.querySelectorAll('tr').forEach(tr => {
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
    document.querySelectorAll('th').forEach(th => {
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

    const sectionData = globalData.departments[deptKey].courses[courseKey].sections[sectionKey];

    sectionData["totalSeatsRem"] = totalSeats;
    sectionData["currentReg"] = currentlyReg;
    sectionData["generalSeatsRem"] = generalSeats;
    sectionData["restrictedSeatsRem"] = restrictedSeats;
    sectionData["instructors"] = instructors;
    sectionData["classes"] = classes;
    
    // for (field of Object.values(sectionData)) {
    //     console.log(field);
    // }
}

function scrapeBuildings() {
    fs.readFile(path.join(__dirname, 'public', 'departments.json'), 'utf8', async (err, data) => {
        globalData = JSON.parse(data);
        let promises = [];
        for (deptKey in globalData.departments) {
            const deptObj = globalData.departments[deptKey];
            for (courseKey in deptObj.courses) {
                const courseObj = deptObj.courses[courseKey];
                for (sectionKey in courseObj.sections) {
                    const sectionObj = courseObj.sections[sectionKey];
                    if (sectionKey != "undefined" && sectionObj.classes.length > 0) {
                        const building = sectionObj.classes[0].location.building;
                        if (!(building in buildingData) && /\S/.test(building)) {
                            const urls = await findBuildingLink(deptKey, courseKey, sectionKey);
                            if (urls != {}) {
                                for (b in urls) {
                                    console.log(deptKey, courseKey, sectionKey);
                                    console.log(b, urls[b]);
                                    const promise = await scrapeBuilding(urls[b], b);
                                    promises.push(promise);
                                }
                            }
                        }
                    }
                }
            }
        }

        await Promise.all(promises).then( values => {
            let time = new Date();

            fs.writeFile(path.join(__dirname, 'public', 'buildings.json'), JSON.stringify(buildingData), err => {
                if (err) throw err;
            });

            globalData["time"] = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
            console.log(time);
            console.timeEnd('Timed Run');
        });
    });
}

async function findBuildingLink(deptKey, courseKey, sectionKey) {
    const responseText = await fetch(`https://courses.students.ubc.ca/cs/courseschedule?pname=subjarea&tname=subj-section&dept=${deptKey}&course=${courseKey}&section=${sectionKey}`)
        .then(res => res.text());
    const dom = new JSDOM(responseText);
    const document = dom.window.document;
    const sectionInfo = document.querySelector('.table-striped tbody');

    let buildingLinks = {}

    if (sectionInfo != null && sectionInfo.firstElementChild.children.length == 6) {
        for (row of sectionInfo.children) {
            if (row.children.length == 6) {
                if (/\S/.test(row.children[5].textContent) && row.children[5].firstElementChild) {
                    const buildingName = row.children[4].textContent;
                    const url = row.children[5].firstElementChild.href;
                    buildingLinks[buildingName] = url;
                }
            }
        }
    }
    return buildingLinks;
}

async function scrapeBuilding(url, buildingKey) {
    console.log(url);
    const responseText = await fetch(url)
        .then(res => res.text());
    const dom = new JSDOM(responseText);
    const document = dom.window.document;

    let buildingName;
    let address;
    document.querySelectorAll('.displayBoxFields table tbody tr').forEach(tr => {
        if (/Building:/.test(tr.textContent)) {
            buildingName = tr.lastElementChild.textContent;
            // console.log(buildingName);
        }
        if (/Address:/.test(tr.textContent)) {
            address = tr.lastElementChild.textContent;
            // console.log(address);
        }
    });

    buildingData[buildingKey] = {
        "name" : buildingName,
        "address" : address
    }

    console.log(buildingName);
}

function countSections() {
    fs.readFile(path.join(__dirname, 'public', 'departments.json'), 'utf8', async (err, data) => {
        globalData = JSON.parse(data);

        c = 0;
        length = 0;

        for (deptKey in globalData.departments) {
            const deptObj = globalData.departments[deptKey];
            c += Object.keys(deptObj.courses).length;
            for (courseKey in deptObj.courses) {
                const courseObj = deptObj.courses[courseKey];
                length += Object.keys(courseObj.sections).length;
            }
        }
        console.log(c);
        console.log(length);
    });
}

console.time('Timed Run');
// scrapeDepts(); // takes about 74 seconds
// scrapeCourses(); // takes just under half an hour (29.6 mins) // 33.5 mins
// scrapeAllSections(); // took about 86 minutes

// scrapeBuildings(); // took about 21 minutes
// findBuildingLink('PSYC', '101', '008');

// scrapeSection('BIOL', '425', 'L01');
// countSections();



