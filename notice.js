loadNotices();

async function loadNotices() {
  const res = await fetch(
    "https://cyan-sheep-842659.hostingersite.com/notices",
  );
  const data = await res.json();

  const box = document.getElementById("noticeList");

  box.innerHTML = "";

  data.forEach((n) => {
    const isNew = checkNew(n.createdAt);

    box.innerHTML += `
    <div class="notice">

      ${isNew ? `<span class="badge">NEW</span>` : ""}

      <h3>${n.title}</h3>

      <div class="date">
      ${new Date(n.createdAt).toDateString()}
      </div>

      <div class="desc">
      ${n.description}
      </div>

      ${
        n.file
          ? `<a 
        href="/${n.file}"
        target="_blank"
        class="download">
        Download File
        </a>`
          : ""
      }

    </div>
  `;
  });
}

function checkNew(date) {
  const now = new Date();
  const created = new Date(date);

  const diff = (now - created) / (1000 * 60 * 60 * 24);

  return diff <= 3;
}
