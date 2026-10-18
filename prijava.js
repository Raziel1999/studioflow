const demoAccounts = [
  {
    email: "ana@studioflow.hr",
    password: "StudioflowUser26!",
    name: "Ana Horvat",
    role: "user",
    destination: "korisnik.html",
  },
  {
    email: "admin@studioflow.hr",
    password: "StudioflowAdmin26!",
    name: "Mia Studio",
    role: "admin",
    destination: "admin.html",
  },
];

const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");

document.querySelectorAll("[data-demo-account]").forEach((button) => {
  button.addEventListener("click", () => {
    const account = demoAccounts.find((demo) => demo.role === button.dataset.demoAccount);
    loginForm.elements.email.value = account.email;
    loginForm.elements.password.value = account.password;
    loginError.hidden = true;
    loginForm.elements.email.focus();
  });
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginError.hidden = true;

  const email = loginForm.elements.email.value.trim().toLowerCase();
  const password = loginForm.elements.password.value;
  const account = demoAccounts.find((demo) => demo.email === email && demo.password === password);

  if (!account) {
    loginError.textContent = "Podaci nisu prepoznati. Za demo upotrijebi jedan od prikazanih računa.";
    loginError.hidden = false;
    return;
  }

  sessionStorage.setItem("studioflow-demo-session", JSON.stringify({
    name: account.name,
    email: account.email,
    role: account.role,
  }));
  window.location.assign(account.destination);
});
