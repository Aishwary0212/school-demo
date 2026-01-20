const ev = new URLSearchParams(location.search).get("e");

title.innerText = ev;

loadImages();

async function loadImages() {
  const res = await fetch(`http://localhost:5000/images/${ev}`);

  const data = await res.json();

  gallery.innerHTML = "";

  data.forEach((img) => {
    gallery.innerHTML += `
      <div class="event-card">

        <img src="http://localhost:5000/${img.path}">

        <div class="card-body">

          <a class="download-btn"
             href="http://localhost:5000/${img.path}"
             download>
             ⬇ Download
          </a>

        </div>

      </div>
    `;
  });
}
