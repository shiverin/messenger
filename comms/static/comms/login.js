import {
    isValidPhoneNumber
} from './phone.js';

const input = document.getElementById('number');

const nextButton = document.querySelector('.nextbutton');
nextButton.onclick = next;

const form = document.querySelector('.theform');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    console.log('Form submission prevented');
});

function next(e) {
    e.preventDefault();
    const input = document.getElementById('number');

    if (form.checkValidity()) {
        console.log("Form is valid!");

        const countryCode = document.getElementById('country-code').textContent.trim();
        const phoneNumber = input.value.trim();
        const fullPhone = countryCode + phoneNumber;

        if (isValidPhoneNumber(fullPhone)) {
            console.log("valid phone number.");

            const button = document.querySelector('.nextbutton');
            const csrftoken = getCookie('csrftoken');

            fetch('/check-phone/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({
                        phone: fullPhone
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.exists) {
                        const topformDiv = document.getElementById('topform');
                        topformDiv.innerHTML = `
                        <label for="number"><small>Phone Number</small></label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                            <span class="input-group-text" id="country-code">${countryCode}</span>
                            </div>
                            <input
                            class="form-control"
                            type="text"
                            name="number"
                            id="number"
                            placeholder="Enter phone number"
                            autocomplete="off"
                            required
                            value="${phoneNumber}"
                            >
                        </div>
                        `;
                        const bottomformDiv = document.getElementById('bottomform');
                        bottomformDiv.innerHTML = `
                        <label for="password"><small>Password</small></label>
                        <div class="input-group">
                            <input
                            class="form-control"
                            type="password"
                            name="password"
                            autocomplete="off"
                            id="password"
                            placeholder="Enter your password"
                            required
                            >
                        </div>
                        `;
                        nextButton.onclick = login;
                        nextButton.textContent = 'Sign In'
                    } else {
                        const topformDiv = document.getElementById('topform');
                        topformDiv.innerHTML = `
                        <label for="number"><small>Phone Number</small></label>
                        <div class="input-group">
                            <div class="input-group-prepend">
                            <span class="input-group-text" id="country-code">${countryCode}</span>
                            </div>
                            <input
                            class="form-control"
                            type="text"
                            name="number"
                            id="number"
                            placeholder="Enter phone number"
                            autocomplete="off"
                            required
                            value="${phoneNumber}"
                            >
                        </div>
                        `;
                        const bottomformDiv = document.getElementById('bottomform');
                        bottomformDiv.innerHTML = `
                        <label for="new-password"><small>New Password</small></label>
                        <div class="input-group">
                            <input
                            class="form-control"
                            type="password"
                            name="new-password"
                            autocomplete="off"
                            id="new-password"
                            placeholder="Enter your password"
                            required
                            >
                        </div>
                        <label for="conpassword"><small>Confirm Password</small></label>
                        <div class="input-group">
                            <input
                            class="form-control"
                            type="password"
                            name="conpassword"
                            id="conpassword"
                            placeholder="Confirm your password"
                            autocomplete="off"
                            required
                            >
                        </div>
                        `;
                        nextButton.onclick = register;
                        nextButton.textContent = 'Create Account'
                    }
                })
                .catch(error => console.error('Error:', error));

        } else {
            input.setCustomValidity("Please enter a valid phone number");
            input.reportValidity();
        }
    } else {
        form.reportValidity();
    }
}

function updateCode() {
    const select = document.getElementById("country");
    const code = select.value;
    document.getElementById("country-code").textContent = code;
}


function login() {
    const loginput = document.getElementById('number');
    const countryCode = document.getElementById('country-code').textContent.trim();
    const phoneNumber = document.getElementById('number').value.trim();
    const fullPhone = countryCode + phoneNumber;
    const password = document.getElementById('password').value.trim();
    const csrftoken = getCookie('csrftoken');
    loginput.addEventListener('input', () => {
        loginput.setCustomValidity('');
    });
    if (form.checkValidity()) {
        if (isValidPhoneNumber(fullPhone)) {
            fetch('/api/login/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({
                        fullPhone,
                        password
                    })
                })
                .then(response => {
                    document.getElementById('password').value="";
                    if (!response.ok) throw new Error('Login failed');
                    return response.json();
                })
                .then(data => {
                    window.location.href = '/';
                    console.log("Attempting to redirect to index page...");

                })
                .catch(error => {
                    alert('Error: ' + error.message);
                });
        } else {
            loginput.setCustomValidity("Please enter a valid phone number");
            loginput.reportValidity();
        }
    } else {
        form.reportValidity();
    }
}

function register() {
    const newinput = document.getElementById('number');
    const countryCode = document.getElementById('country-code').textContent.trim();
    const phoneNumber = document.getElementById('number').value.trim();
    const fullPhone = countryCode + phoneNumber;
    newinput.addEventListener('input', () => {
        newinput.setCustomValidity('');
    });
    if (form.checkValidity()) {
        if (isValidPhoneNumber(fullPhone)) {
            const password = document.getElementById('new-password')?.value;
            const confirmPassword = document.getElementById('conpassword')?.value;

            if (!password || !confirmPassword) {
                alert('Please enter and confirm your password.');
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            const csrftoken = getCookie('csrftoken');

            fetch('/register/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify({
                        phone: fullPhone,
                        password: password,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Registration failed');
                    }
                    return response.json();
                })
                .then(data => {
                    alert('Registration successful, proceed to login!');
                    console.log(data);
                    window.location.href = '/login/';
                })
                .catch(error => {
                    alert('Error: ' + error.message);
                    console.error('Error:', error);
                });
        } else {
            newinput.setCustomValidity("Please enter a valid phone number");
            newinput.reportValidity();
        }
    } else {
        form.reportValidity();
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

input.addEventListener('input', function() {
    input.setCustomValidity("");
});
