document.addEventListener("DOMContentLoaded", () => {
  const spinner = document.getElementById("spinner");
  const gallery = document.getElementById("gallery");
  const modal = document.getElementById("modal");
  const modalImg = document.getElementById("modalImg");
  const title = document.getElementById("title");
  const toastBox = document.getElementById("toast");

  const ev = new URLSearchParams(location.search).get("e");
  title.innerText = "Event : " + ev;

  const token = localStorage.getItem("token");

  loadImages();

  async function loadImages() {
    spinner.style.display = "block";

    try {
      const res = await fetch(`https://cyan-sheep-842659.hostingersite.com/images/${ev}`);
      const data = await res.json();

      spinner.style.display = "none";
      gallery.innerHTML = "";

      data.forEach((img) => {
        gallery.innerHTML += `
     <div class="card">

      <span class="trash"
       data-id="${img._id}"
       data-path="${img.path}">🗑</span>

      <span class="cover"
       data-id="${img._id}"
       style="background:${img.isCover ? "#22c55e" : "rgba(0,0,0,.6)"}">
       ⭐
      </span>

      <img src="https://cyan-sheep-842659.hostingersite.com/${img.path}">
     </div>
    `;
      });
    } catch (err) {
      spinner.style.display = "none";
      showToast("Failed to load images");
    }
  }

  /* CLICK HANDLER */
  gallery.addEventListener("click", async (e) => {
    /* DELETE */
    if (e.target.classList.contains("trash")) {
      const id = e.target.dataset.id;
      const path = e.target.dataset.path;

      if (!confirm("Delete this image?")) return;

      const card = e.target.closest(".card");
      card.classList.add("deleting");

      try {
        await fetch("https://cyan-sheep-842659.hostingersite.com/delete-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ id, path }),
        });

        showToast("Image deleted");
        loadImages();
      } catch (err) {
        card.classList.remove("deleting");
        showToast("Delete failed");
      }
    }

    /* SET COVER */
    if (e.target.classList.contains("cover")) {
      const id = e.target.dataset.id;

      try {
        const res = await fetch("https://cyan-sheep-842659.hostingersite.com/set-cover", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ event: ev, id }),
        });

        const d = await res.json();
        showToast(d.msg);
        loadImages();
      } catch (err) {
        showToast("Failed to set cover");
      }
    }

    /* PREVIEW */
    if (e.target.tagName === "IMG") {
      modal.style.display = "flex";
      modalImg.src = e.target.src;
    }
  });

  /* CLOSE MODAL */
  window.closeModal = () => {
    modal.style.display = "none";
  };

  /* ESC KEY CLOSE */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.style.display = "none";
  });

  /* CLICK OUTSIDE CLOSE */
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
});

/* TOAST */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  }, 2500);
}
