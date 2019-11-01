const data = JSON.parse(rawData);
const timetable = data.timetable

const daysOfWeek = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag"]

const subjects = ["Matematikk", "Fransk", "Spansk", "Tysk", "Fysikk", "Kjemi", "Biologi", "Programmering", "Kunst", "Design", "Kroppsøving", "Geografi", "Norsk", "Samfunnsfag", "Engelsk", "Naturfag", "Filosofi", "Historie", "Sosiologi", "Politikk", "Psykologi", "Rettslære", "Samfunnsøkonomi", "Økonomistyring", "Ledelse", "Teknologi", "Religion", "Toppidrett"]
const colors = ["#AACCEE", "rgb(230, 180, 230)", "rgb(180, 230, 230)", "rgb(180, 180, 230)", "rgb(180, 230, 180)", "rgb(230, 180, 180)", "rgb(120, 230, 230)", "rgb(120, 120, 230)", "rgb(120, 230, 120)", "rgb(230, 120, 120)", "rgb(120, 180, 230)", "rgb(180, 120, 230)", "rgb(120, 230, 180)", "rgb(180, 230, 120)", "rgb(230, 180, 120)", "rgb(230, 120, 180)", "#FFABAB", "#e6beff", "#BFFCC6", "rgb(255, 96, 96)", "rgb(255, 175, 96)", "rgb(255, 255, 96)", "rgb(175, 255, 96)", "rgb(96, 255, 96)", "rgb(96, 255, 175)", "rgb(96, 255, 255)", "rgb(96, 175, 255)", "rgb(96, 96, 255)", "rgb(175, 96, 255)", "rgb(255, 96, 255)", "rgb(255, 96, 175)"]

// Create layout
// https://getbootstrap.com/docs/4.3/components/collapse/#accordion-example
function createDOM(id, date) {
  let dom = document.createElement("div")
  dom.classList.add("card")

  let domHeader = document.createElement("div")
  domHeader.classList.add("card-header")
  domHeader.setAttribute('id', id)

  let domH2 = document.createElement("h2")
  domH2.classList.add("mb-0")

  let domButton = document.createElement("button")
  domButton.classList.add("btn")
  domButton.classList.add("btn-link")
  domButton.classList.add("dayHeading")
  domButton.setAttribute("data-toggle", "collapse")
  domButton.setAttribute("data-target", `#${id}Collapse`)
  domButton.setAttribute("aria-expanded", "true")
  domButton.setAttribute("aria-controls", `${id}Collapse`)
  domButton.innerHTML = id + " " + date

  domH2.appendChild(domButton)
  domHeader.appendChild(domH2)
  dom.appendChild(domHeader)

  let domCollapse = document.createElement("div")
  domCollapse.classList.add("collapse")
  domCollapse.setAttribute("id", `${id}Collapse`)
  domCollapse.setAttribute("aria-labelledby", `${id}`)
  domCollapse.setAttribute("data-parent", "#timetable")

  let domCardBody = document.createElement("div")
  domCardBody.classList.add("cardBody")
  //domCardBody.innerHTML = id

  domCollapse.appendChild(domCardBody)
  dom.appendChild(domCollapse)

  return dom
}

function addUpdatedInfo() {
  dom = document.getElementById("updatedInfo")
  let d = new Date(data.fetched)
  dom.innerHTML = `Navn: ${data.userPermissions.displayName}<br>Oppdatert: ${d.toLocaleString("no-nb")}`
}

window.onload = () => {
  let rootTimetable = document.getElementById("timetable")

  let date = new Date()
  let todayNum = date.getDay()
  let showDay = todayNum <= 5 ? daysOfWeek[todayNum - 1] : daysOfWeek[0]

  // Get the date of the day in this week
  function dateOfDay(day) {
    let dayNum = 0
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (daysOfWeek[i] == day) {
        dayNum = i + 1
      }
    }
    let date = new Date();
    date.setDate(date.getDate() + (dayNum - todayNum))

    return `${date.getDate()}.${date.getMonth() + 1}`
  }

  // Add the days to the dom
  daysOfWeek.forEach(i => {
    rootTimetable.appendChild(createDOM(i, dateOfDay(i)))
  })

  function getDay(date) {
    let dateSplit = date.split("/")
    let lessonDay = new Date(`${dateSplit[1]}/${dateSplit[0]}/${dateSplit[2]}`)
    return daysOfWeek[lessonDay.getDay() - 1]
  }

  function generateLesson(lesson) {
    let ret = document.createElement("div")
    ret.classList.add("lesson")

    ret.style.backgroundImage = "linear-gradient(to left, #fea3aa,#f8b88b,#faf884,#baed91,#b2cefe,#f2a2e8) ";

    if (lesson.subject) {
      for (i = 0; i < subjects.length; i++) {
        if (lesson.subject.includes(subjects[i])) {
          ret.style.backgroundColor = colors[i];
          ret.style.backgroundImage = "";
        }
      }
    }

    let subjectHeading = document.createElement("h6")
    subjectHeading.innerHTML = (lesson.subject) ? `<strong>${lesson.subject}</strong>` : "<strong>Myserietime</strong";
    ret.appendChild(subjectHeading)

    let st = lesson.startTime ? lesson.startTime : "Ikke satt"
    let et = lesson.endTime ? lesson.endTime : "Ikke satt"
    let loc = lesson.locations[0] ? lesson.locations[0] : "Ikke satt"
    let tn = lesson.teacherName ? lesson.teacherName : "Ikke satt"
    let time = document.createElement("div")
    time.innerHTML = `Tid: ${st} - ${et}`
    let location = document.createElement("div")
    location.innerHTML = `Rom: ${loc}`
    let teacher = document.createElement("div")
    teacher.innerHTML = `Lærer: ${tn}`
    ret.appendChild(time)
    ret.appendChild(location)
    ret.appendChild(teacher)


    return ret
  }

  let lessons = timetable.timetableItems

  // Sort lessons after startTime and dates
  lessons.sort((a, b) => {
    function datetimeEq(e) {
      let d = e.date.split("/")
      let t = e.startTime.split(":")
      return parseInt(d[2]) * 10000 * 24 * 60 + parseInt(d[1]) * 100 * 24 * 60 + parseInt(d[0]) * 24 * 60 + parseInt(t[0]) * 60 + parseInt(t[1])
    }

    return datetimeEq(a) > datetimeEq(b) ? 1 : (datetimeEq(a) == datetimeEq(b) ? 0 : -1)
  })

  // TODO: deep copy
  /*let showLessons = []
  for (let i = 0; i < lessons.length; i++) {
    if (i < lessons.length - 1) {
      if(lessons[i].endTime === lessons[i + 1].startTime && lessons[i].teachingGroupId === lessons[i + 1].teachingGroupId) {
        let l = lessons[i]
        l.endTime = lessons[i + 1].endTime
        showLessons.push(l)
        i++
      } else {
        showLessons.push(lessons[i])
      }
    } else {
      showLessons.push(lessons[i])
    }
  }*/

  lessons.forEach(i => {
    let day = getDay(i.date)

    let parentNode = document.getElementById(`${day}Collapse`).firstChild
    parentNode.appendChild(generateLesson(i))
  })

  // Show current day
  document.getElementById(`${showDay}Collapse`).classList.add("show")
  document.getElementById(showDay).scrollIntoView()

  addUpdatedInfo()
}
