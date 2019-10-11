window.onload = function() {
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
