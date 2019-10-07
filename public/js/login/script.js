window.onload = function() {
  const schoolInput = document.getElementById('school');
  schoolInput.value = localStorage.getItem('school') ? localStorage.getItem('school') : "valler"
  schoolInput.addEventListener('input', e => {
    localStorage.setItem('school', e.target.value);
  });
}
