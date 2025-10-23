let userId = localStorage.getItem('pintblog_userId');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('pintblog_userId', userId);
}

window.addEventListener('DOMContentLoaded', async () => {
    handleOAuthCallback();
    await checkAuthStatus();
    setupEventListeners();
});

async function checkAuthStatus() {
    try {
        const response = await fetch(`/api/auth-status?userId=${userId}`);
        const data = await response.json();
        
        // Hide lding
        document.getElementById('loadingSection').style.display = 'none';
        
        if (data.pinterest && data.blogger) {
            // show frm
            document.getElementById('formSection').style.display = 'block';
            loadBoards();
            loadBlogs();
        } else {
            // show auth
            document.getElementById('authSection').style.display = 'block';
            updateAuthButton('pinterest', data.pinterest);
            updateAuthButton('blogger', data.blogger);
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('authSection').style.display = 'block';
    }
}

function updateAuthButton(platform, isAuthorized) {
    const btn = document.getElementById(`${platform}AuthBtn`);
    const badge = document.getElementById(`${platform}Badge`);
    
    if (isAuthorized) {
        badge.textContent = 'Connected';
        badge.classList.add('connected');
        btn.textContent = '✓ Connected';
        btn.disabled = true;
    }
}

function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('pinterest') === 'success' || urlParams.get('blogger') === 'success') {
        showToast('Account connected successfully!', 'success');
        window.history.replaceState({}, document.title, '/');
        
    }
    
    if (urlParams.get('error')) {
        showToast('Authorization failed. Please try again.', 'error');
        window.history.replaceState({}, document.title, '/');
    }
}

function setupEventListeners() {
    document.getElementById('pinterestAuthBtn').addEventListener('click', async () => {
        try {
            const response = await fetch(`/auth/pinterest?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to get auth URL');
            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            showToast('Failed to initiate Pinterest authorization', 'error');
        }
    });
    
    document.getElementById('bloggerAuthBtn').addEventListener('click', async () => {
        try {
            const response = await fetch(`/auth/blogger?userId=${userId}`);
            if (!response.ok) throw new Error('Failed to get auth URL');
            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            showToast('Failed to initiate Blogger authorization', 'error');
        }
    });
    
    const descriptionInput = document.getElementById('description');
    const charCount = document.getElementById('charCount');
    
    descriptionInput.addEventListener('input', () => {
        charCount.textContent = descriptionInput.value.length;
    });
    
    const imageInput = document.getElementById('images');
    const imagePreview = document.getElementById('imagePreview');
    const fileText = document.getElementById('fileText');
    
    imageInput.addEventListener('change', (e) => {
        const files = e.target.files;
        imagePreview.innerHTML = '';
        
        if (files.length > 0) {
            fileText.textContent = `${files.length} image(s) selected`;
            
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    imagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        } else {
            fileText.textContent = 'Choose images or drag and drop';
        }
    });
    
    document.getElementById('postForm').addEventListener('submit', handleFormSubmit);
}

async function loadBoards() {
    try {
        const response = await fetch(`/api/pinterest/boards?userId=${userId}`);
        const data = await response.json();
        
        const boardSelect = document.getElementById('boardId');
        boardSelect.innerHTML = '<option value="">Select board</option>';
        
        if (data.boards && data.boards.length > 0) {
            data.boards.forEach(board => {
                const option = document.createElement('option');
                option.value = board.id;
                option.textContent = board.name;
                boardSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading boards:', error);
    }
}

async function loadBlogs() {
    try {
        const response = await fetch(`/api/blogger/blogs?userId=${userId}`);
        const data = await response.json();
        
        const blogSelect = document.getElementById('blogId');
        blogSelect.innerHTML = '<option value="">Select blog</option>';
        
        if (data.blogs && data.blogs.length > 0) {
            data.blogs.forEach(blog => {
                const option = document.createElement('option');
                option.value = blog.id;
                option.textContent = blog.name;
                blogSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading blogs:', error);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const spinner = document.getElementById('spinner');
    
    submitBtn.disabled = true;
    submitText.textContent = 'Publishing...';
    spinner.style.display = 'block';
    
    try {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('category', document.getElementById('category').value);
        formData.append('link', document.getElementById('link').value);
        formData.append('keywords', document.getElementById('keywords').value);
        formData.append('blogId', document.getElementById('blogId').value);
        formData.append('boardId', document.getElementById('boardId').value);
        
        const images = document.getElementById('images').files;
        for (let i = 0; i < images.length; i++) {
            formData.append('images', images[i]);
        }
        
        const response = await fetch('/api/post', {
            method: 'POST',
            body: formData
        });
        
        const results = await response.json();
        displayResults(results);
        
        if (results.pinterest.success || results.blogger.success) {
            document.getElementById('postForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            document.getElementById('fileText').textContent = 'Choose images or drag and drop';
            showToast('Content published successfully!', 'success');
        }
    } catch (error) {
        showToast('Failed to publish. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitText.textContent = 'Publish Content';
        spinner.style.display = 'none';
    }
}

function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    
    resultsGrid.innerHTML = '';
    
    const pinterestCard = document.createElement('div');
    pinterestCard.className = `result-card ${results.pinterest.success ? 'success' : 'error'}`;
    
    let pinterestContent = `<h3>📌 Pinterest</h3>`;
    pinterestContent += `<p><strong>Status:</strong> ${results.pinterest.success ? '✓ Success' : '✗ Failed'}</p>`;
    
    if (results.pinterest.success && results.pinterest.urls.length > 0) {
        results.pinterest.urls.forEach((url, index) => {
            pinterestContent += `<a href="${url}" target="_blank">View Pin ${index + 1} →</a><br>`;
        });
    } else if (results.pinterest.error) {
        pinterestContent += `<p>${results.pinterest.error}</p>`;
    }
    
    pinterestCard.innerHTML = pinterestContent;
    resultsGrid.appendChild(pinterestCard);
    
    const bloggerCard = document.createElement('div');
    bloggerCard.className = `result-card ${results.blogger.success ? 'success' : 'error'}`;
    
    let bloggerContent = `<h3>📝 Blogger</h3>`;
    bloggerContent += `<p><strong>Status:</strong> ${results.blogger.success ? '✓ Success' : '✗ Failed'}</p>`;
    
    if (results.blogger.success && results.blogger.url) {
        bloggerContent += `<a href="${results.blogger.url}" target="_blank">View Blog Post →</a>`;
    } else if (results.blogger.error) {
        bloggerContent += `<p>${results.blogger.error}</p>`;
    }
    
    bloggerCard.innerHTML = bloggerContent;
    resultsGrid.appendChild(bloggerCard);
    
    resultsSection.style.display = 'block';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
