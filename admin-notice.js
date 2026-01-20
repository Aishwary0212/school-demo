const token = localStorage.getItem("token");

loadNotices();

async function loadNotices() {
  const res = await fetch("http://localhost:5000/notices");
  const data = await res.json();

  const box = document.getElementById("noticeList");
  box.innerHTML = "";

  data.forEach((n) => {
    box.innerHTML += `
      <div class="notice">

        <h3>${n.title}</h3>

        <div class="date">
        ${new Date(n.createdAt).toDateString()}
        </div>

        <div class="desc">
        ${n.description}
        </div>

        <button class="del"
        onclick="del('${n._id}')">
        Delete
        </button>

      </div>
    `;
  });
}

async function addNotice() {
  const title = document.getElementById("title").value;

  const desc = document.getElementById("desc").value;

  const file = document.getElementById("file").files[0];

  if (!title || !desc) return alert("Fill all");

  const form = new FormData();
  form.append("title", title);
  form.append("description", desc);

  if (file) {
    form.append("file", file);
  }

  await fetch("http://localhost:5000/add-notice", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
    },
    body: form,
  });

  loadNotices();
}


async function del(id) {
  if (!confirm("Delete?")) return;

  await fetch("http://localhost:5000/notice/" + id, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  loadNotices();
}
