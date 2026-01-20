// API endpoint
const API_URL = 'http://localhost:3000/api/notices';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadNotices();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchBox = document.getElementById('searchBox');
    const categoryFilter = document.getElementById('categoryFilter');
    const noticeForm = document.getElementById('noticeForm');
    const manageSearchBox = document.getElementById('manageSearchBox');

    if (searchBox) {
        searchBox.addEventListener('input', filterNotices);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterNotices);
    }

    if (noticeForm) {
        noticeForm.addEventListener('submit', handleFormSubmit);
        
        // Character counters
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        
        if (titleInput) {
            titleInput.addEventListener('input', updateCharCount);
        }
        if (contentInput) {
            contentInput.addEventListener('input', updateCharCount);
        }
    }

    // Load and setup manage notices if on add-notice page
    if (manageSearchBox) {
        loadManageNotices();
        manageSearchBox.addEventListener('input', filterManageNotices);
    }
}

// Load notices from API
function loadNotices() {
    const noticesContainer = document.getElementById('noticesContainer');
    const noNotices = document.getElementById('noNotices');

    if (!noticesContainer) return;

    fetch(API_URL)
        .then(response => response.json())
        .then(notices => {
            if (notices.length === 0) {
                noticesContainer.style.display = 'none';
                noNotices.style.display = 'block';
                return;
            }

            noticesContainer.style.display = 'grid';
            noNotices.style.display = 'none';

            // Sort by date (newest first)
            notices.sort((a, b) => new Date(b.date) - new Date(a.date));

            noticesContainer.innerHTML = notices
                .map(notice => createNoticeCard(notice))
                .join('');
        })
        .catch(error => {
            console.error('Error loading notices:', error);
            noNotices.style.display = 'block';
            noNotices.innerHTML = '<p>Error loading notices. Please try again later.</p>';
        });
}

// Create notice card HTML
function createNoticeCard(notice) {
    const cardClass = `notice-card ${notice.category.toLowerCase()}`;
    
    const formattedDate = formatDate(notice.date);
    
    let attachmentLink = '';
    if (notice.attachmentPath) {
        const fileName = notice.attachmentName || 'Download File';
        const fileSize = formatFileSize(notice.attachmentSize);
        attachmentLink = `<a href="${notice.attachmentPath}" download class="attachment-link">📥 ${fileName} (${fileSize})</a>`;
    }

    return `
        <div class="${cardClass}" data-id="${notice.id}">
            <div class="notice-header">
                <div>
                    <h3 class="notice-title">${escapeHtml(notice.title)}</h3>
                </div>
            </div>
            
            <div class="notice-meta">
                <div class="meta-item">
                    📅 <strong>${formattedDate}</strong>
                </div>
            </div>

            <p class="notice-content">${escapeHtml(notice.content)}</p>

            ${attachmentLink}
        </div>
    `;
}

// Filter notices
function filterNotices() {
    const searchBox = document.getElementById('searchBox');
    const categoryFilter = document.getElementById('categoryFilter');
    
    const searchTerm = searchBox ? searchBox.value.toLowerCase() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : '';

    fetch(API_URL)
        .then(response => response.json())
        .then(notices => {
            const filtered = notices.filter(notice => {
                const matchesSearch = notice.title.toLowerCase().includes(searchTerm) ||
                                    notice.content.toLowerCase().includes(searchTerm) ||
                                    notice.author.toLowerCase().includes(searchTerm);
                const matchesCategory = !selectedCategory || notice.category === selectedCategory;
                return matchesSearch && matchesCategory;
            });

            const noticesContainer = document.getElementById('noticesContainer');
            const noNotices = document.getElementById('noNotices');

            if (filtered.length === 0) {
                noticesContainer.style.display = 'none';
                noNotices.style.display = 'block';
                noNotices.innerHTML = '<p>No notices match your search.</p>';
            } else {
                noticesContainer.style.display = 'grid';
                noNotices.style.display = 'none';

                // Sort by date (newest first)
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

                noticesContainer.innerHTML = filtered
                    .map(notice => createNoticeCard(notice))
                    .join('');
            }
        })
        .catch(error => {
            console.error('Error filtering notices:', error);
            showError('Error filtering notices');
        });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const priority = document.getElementById('priority').value;
    const author = document.getElementById('author').value.trim();
    const content = document.getElementById('content').value.trim();
    const attachmentFile = document.getElementById('attachment') ? document.getElementById('attachment').files[0] : null;

    // Validation
    if (!title || !category || !date || !author || !content) {
        showError('Please fill in all required fields');
        return;
    }

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('date', date);
    formData.append('priority', priority);
    formData.append('author', author);
    formData.append('content', content);
    
    if (attachmentFile) {
        // Validate file size (50MB max)
        if (attachmentFile.size > 50 * 1024 * 1024) {
            showError('File size exceeds 50MB limit');
            return;
        }
        formData.append('attachment', attachmentFile);
    }

    // Send to API
    fetch(API_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Notice posted successfully!');
            document.getElementById('noticeForm').reset();
            updateCharCount();
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showError(data.message || 'Failed to post notice');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error posting notice. Please try again.');
    });
}

// Handle delete
function handleDelete(e) {
    const noticeId = parseInt(e.target.getAttribute('data-id'));

    if (confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
        fetch(`${API_URL}/${noticeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const card = document.querySelector(`[data-id="${noticeId}"]`);
                if (card) {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    
                    setTimeout(() => {
                        loadNotices();
                    }, 300);
                }
            } else {
                showError(data.message || 'Failed to delete notice');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Error deleting notice');
        });
    }
}

// Update character count
function updateCharCount(e) {
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const titleCount = document.getElementById('titleCount');
    const contentCount = document.getElementById('contentCount');

    if (titleInput && titleCount) {
        titleCount.textContent = titleInput.value.length;
    }

    if (contentInput && contentCount) {
        contentCount.textContent = contentInput.value.length;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Show success message
function showSuccess(message) {
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.textContent = '✓ ' + message;
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);
    }
}

// Show error message
function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) {
        errorMsg.textContent = '✗ ' + message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 3000);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Load all notices for management
function loadManageNotices() {
    const manageContainer = document.getElementById('manageNoticesContainer');
    const noNotices = document.getElementById('noManageNotices');

    if (!manageContainer) return;

    fetch(API_URL)
        .then(response => response.json())
        .then(notices => {
            if (notices.length === 0) {
                manageContainer.style.display = 'none';
                noNotices.style.display = 'block';
                return;
            }

            manageContainer.style.display = 'flex';
            noNotices.style.display = 'none';

            // Sort by date (newest first)
            notices.sort((a, b) => new Date(b.date) - new Date(a.date));

            manageContainer.innerHTML = notices
                .map(notice => createManageNoticeItem(notice))
                .join('');

            // Add delete event listeners
            document.querySelectorAll('.btn-delete-manage').forEach(btn => {
                btn.addEventListener('click', handleManageDelete);
            });
        })
        .catch(error => {
            console.error('Error loading notices:', error);
            noNotices.style.display = 'block';
            noNotices.innerHTML = '<p>Error loading notices.</p>';
        });
}

// Create manage notice item HTML
function createManageNoticeItem(notice) {
    const formattedDate = formatDate(notice.date);
    
    return `
        <div class="manage-notice-item" data-id="${notice.id}">
            <div class="manage-notice-info">
                <div class="manage-notice-title">${escapeHtml(notice.title)}</div>
                <div class="manage-notice-meta">
                    <span class="manage-notice-badge">${notice.category}</span>
                    📅 ${formattedDate} • by ${escapeHtml(notice.author)}
                </div>
            </div>
            <div class="manage-notice-actions">
                <a href="edit-notice.html?id=${notice.id}" class="btn-edit-manage">Edit</a>
                <button class="btn-delete-manage" data-id="${notice.id}">Delete</button>
            </div>
        </div>
    `;
}

// Handle delete from manage page
function handleManageDelete(e) {
    const noticeId = parseInt(e.target.getAttribute('data-id'));
    const noticeItem = document.querySelector(`[data-id="${noticeId}"]`);
    const noticeTitle = noticeItem.querySelector('.manage-notice-title').textContent;

    if (confirm(`Delete "${noticeTitle}"? This action cannot be undone.`)) {
        fetch(`${API_URL}/${noticeId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                noticeItem.style.opacity = '0';
                noticeItem.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    loadManageNotices();
                }, 300);
            } else {
                showError(data.message || 'Failed to delete notice');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Error deleting notice');
        });
    }
}

// Filter manage notices
function filterManageNotices() {
    const manageSearchBox = document.getElementById('manageSearchBox');
    const searchTerm = manageSearchBox ? manageSearchBox.value.toLowerCase() : '';

    fetch(API_URL)
        .then(response => response.json())
        .then(notices => {
            const filtered = notices.filter(notice => 
                notice.title.toLowerCase().includes(searchTerm) ||
                notice.author.toLowerCase().includes(searchTerm) ||
                notice.category.toLowerCase().includes(searchTerm)
            );

            const manageContainer = document.getElementById('manageNoticesContainer');
            const noNotices = document.getElementById('noManageNotices');

            if (filtered.length === 0) {
                manageContainer.style.display = 'none';
                noNotices.style.display = 'block';
                noNotices.innerHTML = '<p>No notices match your search.</p>';
            } else {
                manageContainer.style.display = 'flex';
                noNotices.style.display = 'none';

                // Sort by date (newest first)
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

                manageContainer.innerHTML = filtered
                    .map(notice => createManageNoticeItem(notice))
                    .join('');

                // Add delete event listeners
                document.querySelectorAll('.btn-delete-manage').forEach(btn => {
                    btn.addEventListener('click', handleManageDelete);
                });
            }
        })
        .catch(error => {
            console.error('Error filtering notices:', error);
            showError('Error filtering notices');
        });
}

// Load notice for editing
function loadNoticeForEdit(noticeId) {
    fetch(API_URL)
        .then(response => response.json())
        .then(notices => {
            const notice = notices.find(n => n.id === noticeId);
            
            if (!notice) {
                showError('Notice not found');
                setTimeout(() => window.location.href = 'add-notice.html', 2000);
                return;
            }

            // Populate form fields
            document.getElementById('title').value = notice.title;
            document.getElementById('category').value = notice.category;
            document.getElementById('date').value = notice.date;
            document.getElementById('priority').value = notice.priority;
            document.getElementById('author').value = notice.author;
            document.getElementById('content').value = notice.content;

            // Update character counts
            updateCharCount();

            // Show current attachment if exists
            if (notice.attachmentName) {
                const currentAttachmentDiv = document.getElementById('currentAttachment');
                document.getElementById('currentAttachmentName').textContent = notice.attachmentName;
                currentAttachmentDiv.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading notice:', error);
            showError('Error loading notice');
            setTimeout(() => window.location.href = 'add-notice.html', 2000);
        });
}

// Handle edit form submission
function handleEditFormSubmit(e) {
    e.preventDefault();

    const noticeId = new URLSearchParams(window.location.search).get('id');
    if (!noticeId) {
        showError('Notice ID not found');
        return;
    }

    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const priority = document.getElementById('priority').value;
    const author = document.getElementById('author').value.trim();
    const content = document.getElementById('content').value.trim();
    const attachmentFile = document.getElementById('attachment') ? document.getElementById('attachment').files[0] : null;
    const removeAttachment = document.getElementById('removeAttachment') ? document.getElementById('removeAttachment').checked : false;

    // Validation
    if (!title || !category || !date || !author || !content) {
        showError('Please fill in all required fields');
        return;
    }

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('date', date);
    formData.append('priority', priority);
    formData.append('author', author);
    formData.append('content', content);
    formData.append('removeAttachment', removeAttachment);
    
    if (attachmentFile) {
        // Validate file size (50MB max)
        if (attachmentFile.size > 50 * 1024 * 1024) {
            showError('File size exceeds 50MB limit');
            return;
        }
        formData.append('attachment', attachmentFile);
    }

    // Send to API
    fetch(`${API_URL}/${noticeId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Notice updated successfully!');
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'add-notice.html';
            }, 2000);
        } else {
            showError(data.message || 'Failed to update notice');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Error updating notice. Please try again.');
    });
}
