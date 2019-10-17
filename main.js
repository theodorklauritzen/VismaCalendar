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

  (async function () {

    const instance = await phantom.create();
    const page = await instance.createPage();

    let finishedLoading = 0;

    async function getTimetableJSON(learnerID) {
      const status = await page.open(`${schoolLink}/control/timetablev2/learner/${learnerID}/fetch/ALL/0/current?forWeek=${date}`);
      let content = await page.property('content');
      instance.exit();
      if (status != "success") {
        console.error("FAILED to get timetable");
        callback(null, "ERROR")
      } else {
        content = content.slice(84, content.length - 20)
        callback(JSON.parse(content), null)
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
          let status = await page.open(`${schoolLink}/control/permissions/user/`)
          let content = await page.property('content');
          if (status != "success") {
            console.error("FAILED to get timetable")
            callback(null, "ERROR")
            instance.exit()
          } else {
            content = content.slice(84, content.length - 20)
            getTimetableJSON(JSON.parse(content).learnerId)
          }
        })();
      }
    })
    const status = await page.open(`${schoolLink}/Login.jsp?saml_idp=feide`);
  })();
}

app.get('/', (req, res) => {
  res.redirect("/login")
})

app.get("/about", (req, res) => {
  res.render("about")
})

app.get("/terms", (req, res) => {
  res.render("terms")
})

app.get("/login", (req, res) => {
  let data = {
    schools: schools
  }
  if (req.query.error == 401) data.errorMsg = "Feil brukernavn, passord eller skole"
  if (req.query.error == 500) data.errorMsg = "Vi kan dessverre ikke hente timeplanen din, grunnet en ukjent feil.  Årsaken er antageligvis en endring på nettsida til Visma."
  res.render("login", data)
})

app.post("/timetable", (req, res) => {
  const loginName = req.body.login_name.toLowerCase()
  let school;
  for (let i = 0; i < schools.length; i++) {
    if (schools[i].name === req.body.school) {
      school = schools[i]
    }
  }
  if (!req.body.date.match(/\d{2}\/\d{2}\/\d{4}/)) {
    res.status(400).send("Invalid date")
  } else if (school) {
    getTimetable(loginName, req.body.password, school.link, req.body.date, (timetable, err) => {
      if (err == "ERROR") {
        res.redirect(`/login?error=500`)
      } else if (err == "Failed to login") {
        res.redirect(`/login?error=401`)
      } else {
        res.render("timetable", {
          timetable: JSON.stringify(timetable)
        })
      }
    })
  } else {
    res.redirect("/login?error=401")
  }
})

app.use(express.static('public'))

app.use((req, res) => {
  res.status(404).render("404")
})

app.listen(process.env.PORT, () => console.log(`Listening on: ${process.env.PORT}`))
