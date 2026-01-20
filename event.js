const ev = new URLSearchParams(location.search).get("e");

title.innerText = ev;

loadImages();

async function loadImages() {
  const res = await fetch(
    `https://cyan-sheep-842659.hostingersite.com/images/${ev}`,
  );

  const data = await res.json();

  gallery.innerHTML = "";

  data.forEach((img) => {
    gallery.innerHTML += `
      <div class="event-card">

        <img src="https://cyan-sheep-842659.hostingersite.com/${img.path}">

        <div class="card-body">

          <a class="download-btn"
             href="https://cyan-sheep-842659.hostingersite.com/${img.path}"
             download>
             ⬇ Download
          </a>

        </div>

      </div>
    `;
  });
}
