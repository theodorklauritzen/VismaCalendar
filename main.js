require('dotenv').config()

const schools = require('./schools');

const phantom = require('phantom');

const express = require('express');
const app = express();

const exphbs = require('express-handlebars');
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: false
}));

function getTimetable(login_name, password, schoolLink, date, callback) {

  const FEIDE_LOGIN_PAGE = `${schoolLink}/Login.jsp?saml_idp=feide`;
  const VISMA_TIMETABLE_1 = `${schoolLink}/control/timetablev2/learner/`
  const VISMA_TIMETABLE_2 = "/fetch/ALL/0/current?forWeek=" + date;
  const VISMA_LEARNERID = `${schoolLink}/control/permissions/user/`;

  (async function () {

    const instance = await phantom.create();
    const page = await instance.createPage();

    let finishedLoading = 0;

    async function getTimetableJSON(userPermissions) {
      const status = await page.open(VISMA_TIMETABLE_1 + userPermissions.learnerId + VISMA_TIMETABLE_2);
      let content = await page.property('content');
      instance.exit();
      if (status != "success") {
        console.error("FAILED to get timetable");
        callback(null, "ERROR")
      } else {
        content = content.slice(84, content.length - 20)
        ret = {
          userPermissions: userPermissions,
          timetable: JSON.parse(content),
          fetched: Date.now()
        }
        callback(ret, null)
      }
    }

    await page.on('onUrlChanged', url => {
      switch (finishedLoading) {
        case 0:
          console.log("Loading Feide login");
          break;
        case 1:
          console.log("Loading Visma");
          break;
        case 2:
          console.log("Loading VisId");
          break;
        case 3:
          console.log("Loading Timetable");
          break;
      }
    })

    await page.on('onLoadFinished', () => {
      finishedLoading++
      if (finishedLoading == 1) {
        page.evaluate(function (username, password) {
          document.getElementById("username").value = username
          document.getElementById("password").value = password
          document.getElementsByName("f")[0].submit();
        }, login_name, password)
      }

      if (finishedLoading == 2) {
        (async function () {
          const res = await page.evaluate(function () {
            return document.title
          })
          if (res === "Log in with Feide" || res === "Logg inn med Feide" || res === "Visma InSchool | Innlogging") {
            console.log("FAILED to log in")
            instance.exit()
            callback(null, "Failed to login")
          } else {
            console.log("Login successful");
          }
        })();
      }

      if (finishedLoading == 3) {
        (async function () {
          let status = await page.open(VISMA_LEARNERID)
          let content = await page.property('content');
          if (status != "success") {
            console.error("FAILED to get timetable")
            callback(null, "ERROR")
            instance.exit()
          } else {
            content = content.slice(84, content.length - 20)
            getTimetableJSON(JSON.parse(content))
          }
        })();
      }
    })
    const status = await page.open(FEIDE_LOGIN_PAGE);
  })();
}

app.get('/', (req, res) => {
  res.redirect("/login")
})

app.get("/timetable", (req, res) => {
  res.redirect("/login")
})

app.get("/about", (req, res) => {
  res.render("about")
})

app.get("/terms", (req, res) => {
  res.render("terms")
})

function getSchool(name) {
  for (let i = 0; i < schools.length; i++) {
    if (schools[i].name === name) {
      return schools[i]
    }
  }
}

app.get("/login", (req, res) => {
  let data = {
    schools: schools
  }
  if (req.query.error == 401) data.errorMsg = "Feil brukernavn, passord eller skole"
  if (req.query.error == 500) data.errorMsg = "Vi kan dessverre ikke hente timeplanen din, grunnet en ukjent feil.  Årsaken er antageligvis en endring på nettsida til Visma."
  res.render("login", data)
})

function requstTimetable(login_name, password, schoolName, date, callback) {
  const loginName = login_name.toLowerCase();
  const school = getSchool(schoolName);

  function validateDate(date) {
    // This will not catch some invalid dates (31/04 or 29/02)
    if(date.match(/\d{2}\/\d{2}\/\d{4}/)) {
      s = date.split("/")
      return !isNaN(Date.parse(`${s[1]}/${s[0]}/${s[2]}`))
    }
    return false
  }

  if (!validateDate(date)) {
    //res.status(400).send("Invalid date")
    callback(400, null)
  } else if (school) {
    getTimetable(loginName, password, school.link, date, (data, err) => {
      if (err == "ERROR") {
        //res.redirect(`/login?error=500`)
        callback(500, null)
      } else if (err == "Failed to login") {
        //res.redirect(`/login?error=401`)
        callback(401, null)
      } else {
        //res.render("timetable", {
        //  data: JSON.stringify(data)
        //})
        callback(200, data)
      }
    })
  } else {
    //res.redirect("/login?error=401")
    callback(401, null)
  }
}

app.post("/timetable", (req, res) => {
  requstTimetable(req.body.login_name, req.body.password, req.body.school, req.body.date, (status, data) => {
    if (status === 200) {
      res.render("timetable", {
        data: JSON.stringify(data)
      })
    } else if (status === 400) {
      res.status(400).send("Invalid date")
    } else if (status === 401) {
      res.redirect("/login?error=401")
    } else if(status === 500) {
      res.redirect(`/login?error=500`)
    }
  })
})

app.post("/timetableJSON", (req, res) => {
  requstTimetable(req.body.login_name, req.body.password, req.body.school, req.body.date, (status, data) => {
    res.status(status).send(data)
  })
})

app.use(express.static('public'))

app.use((req, res) => {
  res.status(404).render("404")
})

app.listen(process.env.PORT || 80, () => console.log(`Listening on: ${process.env.PORT || 80}`))
