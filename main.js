require('dotenv').config()
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

function getTimetable(login_name, password, learnerID, callback) {
  const FEIDE_LOGIN_PAGE = "https://valler-vgs.inschool.visma.no/Login.jsp?saml_idp=feide";
  const VISMA_TIMETABLE = `https://valler-vgs.inschool.visma.no/control/timetablev2/learner/${learnerID}/fetch/ALL/0/current?forWeek=` + nearestMonday();

  (async function () {
    const instance = await phantom.create();
    const page = await instance.createPage();

    let finishedLoading = 0

    await page.on('onUrlChanged', url => {
      switch (finishedLoading) {
        case 0:
          console.log("Loading Feide login");
          break;
        case 1:
          console.log("Loading Visma");
          break;
        case 2:
          console.log("Loading Timetable");
          break;
      }
    })

    await page.on('onLoadFinished', status => {
      finishedLoading++
      //console.log("FINISHED LOADING", finishedLoading)

      if(finishedLoading == 1) {
        page.evaluate(function(username, password) {
          function click(el) {
            var ev = document.createEvent("MouseEvent");
            ev.initMouseEvent(
              "click",
              true /* bubble */, true /* cancelable */,
              window, null,
              0, 0, 0, 0, /* coordinates */
              false, false, false, false, /* modifier keys */
              0 /*left*/, null
            );
            el.dispatchEvent(ev);
          }

          document.getElementById("username").value = username
          document.getElementById("password").value = password
          submitBtn = document.getElementsByClassName("main")[0].getElementsByTagName("button")[0]
          click(submitBtn)
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
          await page.open(VISMA_TIMETABLE)
          let content = await page.property('content');
          await instance.exit()

          if(content.slice(0, 12) == "<!--ERROR-->") {
            console.error("FAILED to get timetable")
            callback(null, "ERROR")
          } else {
            content = content.slice(84, content.length - 20)
            callback(JSON.parse(content), null)
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

app.get("/join", (req, res) => {
  res.render("join")
})

app.get("/login", (req, res) => {
  let data = {}
  if (req.query.error == 401) data.errorMsg = "Feil brukernavn eller passord"
  if (req.query.error == 403) data.errorMsg = "Dette brukernavnet har ikke tillatelse til å bruke denne nettsida!"
  if (req.query.error == 500) data.errorMsg = "Ukjent serverfeil, vennlig prøv igjen eller rapporter problemet"
  res.render("login", data)
})

const learnerMap = {
  "lath2401": 7048632,
  "geha1002": 7048319,
  "osjo1703": 7048483,
  "huse2607": 7048669,
  "akli1204": 7048368,
  "roru0406": 7048199,
  "bisi2812": 7048729,
  "thkr2212": 7048608,
  "huma1608": 7048473,
  "gitu1710": 7048494,
  "imma0402": 7048192,
  "rova2209": 7048594,
  "moca2907": 7048740
}

app.post("/timetable", (req, res) => {
  const loginName = req.body.login_name.toLowerCase()
  if (learnerMap[loginName]) {
    getTimetable(loginName, req.body.password, learnerMap[loginName], (timetable, err) => {
      if(err == "ERROR") {
        res.redirect("/login?error=500")
      } else if(err == "Failed to login") {
        res.redirect("/login?error=401")
      } else {
        //console.log(timetable.timetableItems)
        //res.send(timetable)
        res.render("timetable", {
          timetable: JSON.stringify(timetable)
        })
      }
    })
  } else {
    res.redirect("/login?error=403")
  }
})

app.use(express.static('public'))

app.use((req, res) => {
  res.status(404).render("404")
})

app.listen(process.env.PORT, () => console.log(`Listening on: ${process.env.PORT}`))
