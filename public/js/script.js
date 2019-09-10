// When deployed, use https
let url = window.location.href.split("/")
if(url[0] === "http:" && url[2] === "visma-calendar.herokuapp.com") {
  window.location.href = window.location.href.replace(/^http:\/\//i, 'https://')
}
