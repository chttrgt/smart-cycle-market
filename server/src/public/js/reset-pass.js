const form = document.getElementById("form");
const messageTag = document.getElementById("message");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const notification = document.getElementById("notification");
const btnSubmit = document.getElementById("submit");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

form.style.display = "none";

let token, id;

window.addEventListener("DOMContentLoaded", async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });

  token = params.token;
  id = params.id;

  const res = await fetch("/api/auth/verify-pass-reset-token", {
    method: "POST",
    body: JSON.stringify({ token, id }),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });

  if (!res.ok) {
    const { message } = await res.json();
    messageTag.innerText = message;
    messageTag.classList.add("error");
    return;
  }

  messageTag.style.display = "none";
  form.style.display = "block";
});

const displayNotification = (message, type) => {
  notification.style.display = "block";
  notification.innerText = message;
  notification.classList.add(type);
};

const handleSubmit = async (e) => {
  e.preventDefault();

  // validate
  if (!passwordRegex.test(password.value)) {
    return displayNotification("Invalid password format!", "error");
  }

  if (password.value !== confirmPassword.value) {
    return displayNotification("Passwords do not match", "error");
  }

  // submit
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Please Wait...";

  const response = await fetch("/api/auth/reset-pass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      id,
      token,
      password: password.value,
    }),
  });

  btnSubmit.disabled = false;
  btnSubmit.innerText = "Update Password";

  if (!response.ok) {
    const { message } = await response.json();
    return displayNotification(message, "error");
  }

  messageTag.style.display = "block";
  messageTag.innerText = "Your password updated successfully!";
  form.style.display = "none";
};

form.addEventListener("submit", handleSubmit);
