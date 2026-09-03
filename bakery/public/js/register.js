async function registerUser() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('message');

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await response.json();

    if (response.ok) {
      message.style.color = 'green';
      message.innerText = 'Registration successful... redirecting';

      // redirect to login after short delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);

    } else {
      message.style.color = 'red';
      message.innerText = data.message;
    }

  } catch (error) {
    message.style.color = 'red';
    message.innerText = 'Server error';
  }
}