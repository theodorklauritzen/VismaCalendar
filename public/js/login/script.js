function agree() {
  localStorage.setItem('agree', true);

  document.getElementById("security-alert").innerHTML = ""
  document.getElementById("loginBtn").disabled = false
}

window.onload = function() {
  if (localStorage.getItem('agree') != "true") {
    document.getElementById("loginBtn").disabled = true
    document.getElementById("security-alert").innerHTML = '<div class="alert alert-danger alert-security"><strong>ADVARSEL:</strong> Før du logger inn må du være klar over <a class="alert-link" href="/about#risk">sikkerhetsrisikoen</a> og du må godta <a class="alert-link" href="/terms">betingelsene</a>.<br><button class="btn btn-security-alert" type="button" onclick="agree()">Jeg forstår</button></div>'
  }

  const schoolInput = document.getElementById('school');
  schoolInput.value = localStorage.getItem('school') ? localStorage.getItem('school') : "valler"
  schoolInput.addEventListener('input', e => {
    localStorage.setItem('school', e.target.value);
  });

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

  document.getElementById("weekDate").value = nearestMonday();
}
