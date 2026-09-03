async function loginUser() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const message = document.getElementById('message');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      message.style.color = 'green';
      message.innerText = 'Login successful...';

      // Store token (VERY IMPORTANT)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/dashboard.html';
        }
      }, 1000);

    } else {
      message.style.color = 'red';
      message.innerText = data.message;
    }

  } catch (error) {
    message.style.color = 'red';
    message.innerText = 'Server error';
  }
}