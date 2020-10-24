let TimetableOnDisplay;

/** 
 * Search objects that are currently on display
*/
let deptOnDisplay;
let courseOnDisplay;
let sectionOnDisplay;

const timetable1 = new Timetable(9, 18, "1");
const timetable2 = new Timetable(9, 18, "2");
console.log(timetable1);

defaultSetUp();

function defaultSetUp() {
    timetable2.table.style.display = 'none';
}



caches.open('bg')
    .then( cache => {
        cache.add('bg.png')
            .then( () => {
                
            });
    });

function sunOrSat() {
    for (deptKey in coursesData.departments) {
        const deptObj = coursesData.departments[deptKey];
        for (courseKey in deptObj.courses) {
            const courseObj = deptObj.courses[courseKey];
            for (sectionKey in courseObj.sections) {
                const sectionObj = courseObj.sections[sectionKey];
                for (classObj of sectionObj.classes) {
                    if (/Sat/.test(classObj.days) || /Sun/.test(classObj.days)) {
                        console.log(sectionObj.sectionCode);
                    }
                }
            }
        }
    }
}