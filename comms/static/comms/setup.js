const fileInput = document.getElementById('profile-pic');
const preview = document.getElementById('profile-preview');

preview.addEventListener('click', () => {
  fileInput.click();  // open file selector on click
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;  // show uploaded image
    };
    reader.readAsDataURL(file);
  }
});
