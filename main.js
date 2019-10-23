require('dotenv').config()

const redirectDomain = "https://timeplan.herokuapp.com"

const express = require('express');
const app = express();

app.use((req, res) => {
  res.redirect(308, redirectDomain + req.originalUrl)
})

app.listen(process.env.PORT || 80, () => console.log(`Listening on: ${process.env.PORT || 80}`))
