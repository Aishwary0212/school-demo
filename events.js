// Protect page
(async function () {
  const token = localStorage.getItem("token");

  if (!token) {
    location = "login.html";
    return;
  }
})();

// Load events
async function loadEvents() {
  const res = await fetch("https://cyan-sheep-842659.hostingersite.com/events");
  const data = await res.json();

  const box = document.getElementById("eventList");
  box.innerHTML = "";

  for (let ev of data) {
    // get image count
    const r = await fetch(
      `https://cyan-sheep-842659.hostingersite.com/images/${ev}`,
    );
    const imgs = await r.json();

    box.innerHTML += `
      <div class="event-card">
        <h3>${ev}</h3>
        <p>${imgs.length} Photos</p>

        <button onclick="viewEvent('${ev}')">View</button>
        <button onclick="renamePrompt('${ev}')">Rename</button>
        <button class="del" 
          onclick="deleteEvent('${ev}')">
          Delete
        </button>
      </div>
    `;
  }
}

loadEvents();

// VIEW
function viewEvent(ev) {
  location = `admin-gallery.html?e=${ev}`;
}

// RENAME
async function renamePrompt(oldName) {
  const newName = prompt("Enter new name", oldName);

  if (!newName) return;

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
        oldEvent: oldName,
        newEvent: newName,
      }),
    },
  );

  const data = await res.json();
  alert(data.msg);
  loadEvents();
}

// DELETE
async function deleteEvent(ev) {
  if (!confirm("Delete event?")) return;

  const token = localStorage.getItem("token");

  const res = await fetch(
    `https://cyan-sheep-842659.hostingersite.com/delete-event/${ev}`,
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

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  location = "login.html";
}
