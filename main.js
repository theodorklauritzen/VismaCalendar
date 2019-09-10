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
            return (document.title === "Log in with Feide")
          })
          if(res) {
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

app.get("/login", (req, res) => {
  res.render("login")
})

const learnerMap = {
  "lath2401": 7048632,
  "geha1002": 7048319
}

app.post("/timetable", (req, res) => {
  getTimetable(req.body.login_name, req.body.password, learnerMap[req.body.login_name], (timetable, err) => {
    //console.log(timetable.timetableItems)
    //res.send(timetable)
    res.render("timetable", {
      timetable: timetable
    })
  })
})

app.use(express.static('public'))

app.use((req, res) => {
  res.redirect("/")
})

app.listen(process.env.PORT, () => console.log(`Listening on: ${process.env.PORT}`))
