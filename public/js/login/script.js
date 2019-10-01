window.onload = function() {
  const schoolInput = document.getElementById('school');
  schoolInput.value = localStorage.getItem('school') ? localStorage.getItem('school') : schoolInput.value
  schoolInput.addEventListener('input', e => {
    localStorage.setItem('school', e.target.value);
  });
}
