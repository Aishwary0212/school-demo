(async function () {
  const token = localStorage.getItem("token");

  if (!token) {
    location = "login.html";
    return;
  }

  const res = await fetch(
    "https://cyan-sheep-842659.hostingersite.com/dashboard",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    },
  );

  const data = await res.json();

  if (data.msg !== "Welcome") {
    location = "login.html";
  }
})();

// ======================
// LOAD EVENTS (DROPDOWN)
// ======================
async function loadEvents() {
  const res = await fetch("https://cyan-sheep-842659.hostingersite.com/events");
  const data = await res.json();

  const select = document.getElementById("eventSelect");
  select.innerHTML = '<option value="">Select Event</option>';

  data.forEach((ev) => {
    const op = document.createElement("option");
    op.value = ev;
    op.innerText = ev;
    select.appendChild(op);
  });
}

loadEvents();

async function createEvent() {
  const event = document.getElementById("newEvent").value;

  if (!event) {
    alert("Enter event name");
    return;
  }

  const token = localStorage.getItem("token");

  const res = await fetch(
    "https://cyan-sheep-842659.hostingersite.com/create-event",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ event }),
    },
  );

  const data = await res.json();
  alert(data.msg);

  if (data.msg === "Event created") {
    document.getElementById("newEvent").value = "";
    loadEvents(); // refresh dropdown
  }
}

// ======================
// UPLOAD IMAGE
// ======================
async function upload() {
  const event = document.getElementById("eventSelect").value;
  const files = document.getElementById("image").files; // multiple

  if (!event || files.length === 0) {
    alert("Select event and images");
    return;
  }

  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("event", event);

  // append all images
  for (let file of files) {
    formData.append("images", file); // backend expects "images"
  }

  const res = await fetch(
    "https://cyan-sheep-842659.hostingersite.com/upload",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: formData,
    },
  );

  const data = await res.json();
  alert(data.msg);
}
async function createNewEvent() {
  const event = document.getElementById("newEvent").value;

  if (!event) {
    alert("Enter event name");
    return;
  }

  const token = localStorage.getItem("token");

  const res = await fetch(
    "https://cyan-sheep-842659.hostingersite.com/create-event",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ event }),
    },
  );

  const data = await res.json();
  alert(data.msg);

  if (data.msg === "Event created") {
    document.getElementById("newEvent").value = "";
    loadEvents();
  }
}

async function deleteEvent() {
  const event = document.getElementById("eventSelect").value;

  if (!event) {
    alert("Select event");
    return;
  }

  if (!confirm("Are you sure?")) return;

  const token = localStorage.getItem("token");

  const res = await fetch(
    `https://cyan-sheep-842659.hostingersite.com/delete-event/${event}`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    },
  );

  const data = await res.json();
  alert(data.msg);

  loadEvents();
}
async function deleteEvent(){

  const event = document.getElementById("eventSelect").value;

  if(!event){
    alert("Select event");
    return;
  }

  if(!confirm("Are you sure?")) return;

  const token = localStorage.getItem("token");

  const res = await fetch(
    `https://cyan-sheep-842659.hostingersite.com/delete-event/${event}`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    },
  );

  const data = await res.json();
  alert(data.msg);

  loadEvents();
}
async function renameEvent() {
  const oldEvent = document.getElementById("eventSelect").value;
  const newEvent = document.getElementById("renameEvent").value;

  if (!oldEvent || !newEvent) {
    alert("Select event & enter new name");
    return;
  }

  const token = localStorage.getItem("token");

  const res = await fetch(
    "https://cyan-sheep-842659.hostingersite.com/rename-event",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        oldEvent,
        newEvent,
      }),
    },
  );

  const data = await res.json();
  alert(data.msg);

  if (data.msg === "Event renamed") {
    document.getElementById("renameEvent").value = "";
    loadEvents();
  }
}


// ======================
// LOGOUT
// ======================
function logout() {
  localStorage.removeItem("token");
  location = "login.html";
}
