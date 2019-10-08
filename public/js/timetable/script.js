const timetable = JSON.parse(timetableString);

const daysOfWeek = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag"]

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

    let subjectHeading = document.createElement("h6")
    subjectHeading.innerHTML = `<strong>${lesson.subject}</strong>`
    ret.appendChild(subjectHeading)

    let body = document.createElement("div")
    let st = lesson.startTime ? lesson.startTime : "Ikke satt"
    let loc = lesson.locations ? lesson.locations[0] : "Ikke satt"
    let tn = lesson.teacherName ? lesson.teacherName : "Ikke satt"
    body.innerHTML = `Starter: ${st}<br>Rom: ${loc}<br>Lærer: ${tn}`
    ret.appendChild(body)

    return ret
  }

  let sortedLessons = timetable.timetableItems

  sortedLessons.sort((a, b) => {
    // No nedd to sort date, the time is the only important part

    let sortValueA = a.startTime;
    let sortValueB = b.startTime;

    function minutesEq(t) {
      t = t.split(":")
      return parseInt(t[0]) * 60 + parseInt(t[1])
    }

    return minutesEq(sortValueA) < minutesEq(sortValueB) ? 1 : (minutesEq(sortValueA) == minutesEq(sortValueB) ? 0 : -1)
  })

  sortedLessons.forEach(i => {
    let day = getDay(i.date)

    let parentNode = document.getElementById(`${day}Collapse`).firstChild
    parentNode.appendChild(generateLesson(i))
  })

  // Show current day
  document.getElementById(`${showDay}Collapse`).classList.add("show")
  document.getElementById(showDay).scrollIntoView()
}
