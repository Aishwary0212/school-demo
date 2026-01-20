 let allNotices = [];

    // Load Data
    function loadData() {
      const data = JSON.parse(localStorage.getItem('adminData') || '{}');
      allNotices = data.notices || [];
      displayNotices(allNotices);
    }

    // Display Notices
    function displayNotices(notices) {
      const grid = document.getElementById('noticeGrid');

      if (notices.length === 0) {
        grid.innerHTML = `
          <div class="notice-empty">
            <i class="fa-solid fa-inbox"></i>
            <p>No notices available at the moment.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = notices.map(notice => `
        <div class="notice-card ${notice.priority.toLowerCase()} reveal">
          <div class="notice-badge">${notice.priority}</div>
          <h3 class="notice-title">${notice.title}</h3>
          <p class="notice-content">${notice.content}</p>
          <div class="notice-date">
            <i class="fa-solid fa-calendar"></i>
            ${notice.date}
          </div>
          ${notice.file ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);">
              <button onclick="downloadNoticeFile(${notice.id})" style="background: var(--accent-teal); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: all 0.3s ease;">
                <i class="fa-solid fa-download"></i> ${notice.file.name}
              </button>
            </div>
          ` : ''}
        </div>
      `).join('');

      // Observe for animation
      observeElements();
    }

    // Download Notice File
    function downloadNoticeFile(noticeId) {
      let data = JSON.parse(localStorage.getItem('adminData') || '{"notices": []}');
      const notice = data.notices.find(n => n.id === noticeId);
      
      if (notice && notice.file) {
        const link = document.createElement('a');
        link.href = notice.file.data;
        link.download = notice.file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    // Filter Notices
    function filterNotices(e, priority) {
      e.preventDefault();

      // Update active button
      document.querySelectorAll('.filter-bar .filter-btn').forEach((btn, idx) => {
        if (idx === 0) {
          btn.classList.toggle('active', priority === 'all');
        } else if (btn.textContent.includes(priority)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Filter and display
      const filtered = priority === 'all' ? allNotices : allNotices.filter(n => n.priority === priority);
      displayNotices(filtered);
    }

    // Intersection Observer for Animations
    function observeElements() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    // Initialize
    window.addEventListener('load', () => {
      loadData();
      observeElements();
    });

    // Reload data when admin makes changes
    window.addEventListener('storage', () => {
      loadData();
    });