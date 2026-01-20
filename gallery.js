loadEvents();

async function loadEvents() {
  const res = await fetch("https://cyan-sheep-842659.hostingersite.com/public-events");

  const data = await res.json();

  document.getElementById("total").innerText = data.length;

  const box = document.getElementById("events");
  box.innerHTML = "";

  data.forEach((ev) => {
    box.innerHTML += `
      <div class="event-card"
      onclick="openEvent('${ev.event}')">

        <img src="https://cyan-sheep-842659.hostingersite.com/${ev.cover}">

        <div class="card-body">

          <h3>${ev.event}</h3>

          <div class="meta">
            <span class="date">
              📅 28 Nov
            </span>

            <span class="count">
              🖼 ${ev.count || 0}
            </span>
          </div>

          <div class="desc">
            Description: ${ev.event}
          </div>

        </div>
      </div>
    `;
  });
}

function openEvent(name) {
  location = `event.html?e=${name}`;
}

