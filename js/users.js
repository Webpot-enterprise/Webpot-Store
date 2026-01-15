// Users Module - User authentication and profile management

/**
 * Update UI based on authentication status
 */
function updateAuthUI() {
  const isAuth = isAuthenticated();
  const loginBtn = document.getElementById('loginBtn');
  const userMenu = document.getElementById('userMenu');
  
  if (loginBtn) loginBtn.style.display = isAuth ? 'none' : 'inline-block';
  if (userMenu) userMenu.style.display = isAuth ? 'flex' : 'none';
  
  if (isAuth) {
    const userData = getUserData();
    if (userData) {
      const userName = document.getElementById('userName');
      const userProfilePic = document.getElementById('userProfilePic');
      
      if (userName) userName.textContent = userData.name || 'User';
      if (userProfilePic) {
        userProfilePic.src = userData.profilePic || 'default pfp.webp';
        userProfilePic.onerror = function() {
          this.src = 'default pfp.webp';
        };
      }
    }
  }
}

/**
 * Toggle user dropdown menu
 * @param {Event} event - Click event
 */
function toggleUserMenu(event) {
  event.stopPropagation();
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) {
    userDropdown.classList.toggle('active');
  }
}

/**
 * Close user dropdown when clicking outside
 */
document.addEventListener('click', function(e) {
  const userDropdown = document.getElementById('userDropdown');
  const userMenuBtn = document.querySelector('.user-profile-btn');
  
  if (userDropdown && !userDropdown.contains(e.target) && !userMenuBtn?.contains(e.target)) {
    userDropdown.classList.remove('active');
  }
});

/**
 * Logout user
 */
function logoutUser() {
  clearAuthToken();
  clearUserData();
  updateAuthUI();
  
  // Close user menu
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) userDropdown.classList.remove('active');
  
  // Redirect to home
  window.location.href = '/';
}

/**
 * Redirect to dashboard
 */
function goToDashboard() {
  if (requireAuth()) {
    window.location.href = 'dashboard-webpot/user dashboard/html/index.html';
  }
}
