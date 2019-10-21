// When deployed, use https
let url = window.location.href.split("/")
if(url[0] === "http:" && url[2] === "timeplan.herokuapp.com") {
  window.location.href = window.location.href.replace(/^http:\/\//i, 'https://')
}

// Ensure all users aggree on the terms
/*if(!localStorage.getItem('school')) {
  alert("Før du bruker nettsiden må du godta betningelsene.  De finner du på visma-calendar.herokuapp.com/terms")
  localStorage.setItem('school', "valler")
}*/
