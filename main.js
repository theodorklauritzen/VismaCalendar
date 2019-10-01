require('dotenv').config()

const schools = require('./schools');

const phantom = require('phantom');

const express = require('express')
const app = express()

const exphbs = require('express-handlebars');
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: false
}));

function nearestMonday() {
  let today = new Date()
  let dayofWeek = today.getDay()

  if (dayofWeek <= 6) {
    today.setDate(today.getDate() - dayofWeek + 1)
  } else {
    today.setDate(today.getDate() + 1)
  }

  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = today.getFullYear();
  return dd + "/" + mm + "/" + yyyy
}

function getTimetable(login_name, password, school, callback) {
  const FEIDE_LOGIN_PAGE = `https://${school}.inschool.visma.no/Login.jsp?saml_idp=feide`;
  //const VISMA_TIMETABLE = `https://valler-vgs.inschool.visma.no/control/timetablev2/learner/${learnerID}/fetch/ALL/0/current?forWeek=` + nearestMonday();
  const VISMA_TIMETABLE_1 = `https://${school}.inschool.visma.no/control/timetablev2/learner/`
  const VISMA_TIMETABLE_2 = "/fetch/ALL/0/current?forWeek=" + nearestMonday();
  const VISMA_LEARNERID = `https://${school}.inschool.visma.no/control/permissions/user/`;

  (async function () {
    const instance = await phantom.create();
    const page = await instance.createPage();

    let finishedLoading = 0
    let userPermissions = {}

    async function getTimetableJSON() {
      let status = await page.open(VISMA_TIMETABLE_1 + userPermissions.learnerId + VISMA_TIMETABLE_2)
      let content = await page.property('content');
      await instance.exit()

      if(status != "success") {
        console.error("FAILED to get timetable")
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
          console.log("Loading VisId")
          break;
        case 3:
          console.log("Loading Timetable");
          break;
      }
    })

    await page.on('onLoadFinished', status => {
      finishedLoading++
      //console.log("FINISHED LOADING", finishedLoading)

      if(finishedLoading == 1) {
        page.evaluate(function(username, password) {
          document.getElementById("username").value = username
          document.getElementById("password").value = password
          document.getElementsByName("f")[0].submit();
        }, login_name, password)
      }

      if(finishedLoading == 2) {
        //page.render("example.png")
        (async function() {
          let res = await page.evaluate(function() {
            return document.title
          })
          console.log(res)
          if(res === "Log in with Feide" || res === "Logg inn med Feide") {
            console.log("FAILED to log in")
            await instance.exit()
            callback(null, "Failed to login")
          } else {
            console.log("Login successfull");
          }

          return true;
        })();
      }

      if(finishedLoading == 3) {
        (async function() {
          let status = await page.open(VISMA_LEARNERID)
          let content = await page.property('content');

          if(status != "success") {
            console.error("FAILED to get timetable")
            callback(null, "ERROR")
            await instance.exit()
          } else {
            content = content.slice(84, content.length - 20)
            userPermissions = JSON.parse(content)
            getTimetableJSON()
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

app.get("/about", (req, res) => {
  res.render("about")
})

app.get("/terms", (req, res) => {
  res.render("terms")
})

function getSchool(name) {
  for (let i = 0; i < schools.length; i++) {
    if(schools[i].name === name) {
      return schools[i]
    }
  }

  return null
}

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
  const school = getSchool(req.body.school)
  if (school) {
    getTimetable(loginName, req.body.password, school.link, (timetable, err) => {
      if(err == "ERROR") {
        res.redirect(`/login?error=500`)
      } else if(err == "Failed to login") {
        res.redirect(`/login?error=401`)
      } else {
        //console.log(timetable.timetableItems)
        //res.send(timetable)
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
