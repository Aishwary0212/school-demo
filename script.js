// REGISTER
async function register() {
  const res = await fetch("https://cyan-sheep-842659.hostingersite.com/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: regName.value,
      email: regEmail.value,
      password: regPassword.value,
    }),
  });

  const data = await res.json();
  alert(data.msg);

  if (data.msg === "Registered successfully") {
    location = "login.html";
  }
}

// LOGIN
async function login() {
  const res = await fetch("https://cyan-sheep-842659.hostingersite.com/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: loginEmail.value,
      password: loginPassword.value,
    }),
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    location = "dashboard.html";
  } else {
    alert(data.msg);
  }
}
