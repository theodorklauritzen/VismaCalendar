const puppeteer = require('puppeteer');

async function getTimetable(login_name, password, schoolLink, date, organization, callback) {
  const browser = await puppeteer.launch({
    headless: true, // Set to false to watch the bot
    args: ['--no-sandbox'] // Need this to work on Heroku
  });
  const page = await browser.newPage();

  // Gå til Feide
  await page.goto(`${schoolLink}/Login.jsp?saml_idp=feide`);

  await page.waitForSelector("#rememberme")

  // Velg fylke
  await page.evaluate((organization) => {
    document.getElementById("org-chooser").firstChild.value = "feide|realm|" + organization;
    document.getElementById("discoform_feide").submit();
  }, organization)

  // Vent til innloggingen
  await page.waitForSelector("#username");

  // Logg inn
  await page.evaluate((username, password) => {
    document.getElementById("username").value = username;
    document.getElementById("password").value = password;
    document.getElementsByName("f")[0].submit();
  }, login_name, password)

  // Vent til Visma har lasta inn (eventuelt feida har lasta inn)
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });

  // Sjekk om innlogginen var vellykket
  // Hent tittelen på siden
  const loginSuccess = await page.evaluate(() => {
    return document.title
  })

  // Sjekk om tittelen er til Visma
  // Hvis ikke er det feil brukernavn elelr passord
  if (loginSuccess != "Startside - Visma InSchool") {

    await browser.close();
    callback(null, "Failed to login")
  } else {

    // Get the learnerId of the user
    await page.goto(`${schoolLink}/control/permissions/user/`)
    let content = await page.content()
    let userPermissions = JSON.parse(content.slice(84, content.length - 20))
    const learnerId = userPermissions.learnerId

    // Fetch the timetable
    await page.goto(`${schoolLink}/control/timetablev2/learner/${learnerId}/fetch/ALL/0/current?forWeek=${date}`);
    content = await page.content()
    let timetable = JSON.parse(content.slice(84, content.length - 20))

    await browser.close();

    let retData = {
      userPermissions: userPermissions,
      timetable: timetable,
      fetched: Date.now()
    }

    callback(retData, null)
  }
}

module.exports = getTimetable
