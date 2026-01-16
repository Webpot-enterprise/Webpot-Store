/* =============================================
   ADMIN DASHBOARD - JAVASCRIPT FUNCTIONALITY
   ============================================= */

// =============================================
// ADMIN AUTHENTICATION SYSTEM
// =============================================

const ADMIN_CREDENTIALS = {
    username: 'Webpotadmin',
    password: 'Webpot-2026!!'
};

let isAdminAuthenticated = false;

// Check authentication on page load
window.addEventListener('load', function() {
    // Check if already authenticated in this session
    const sessionAuth = sessionStorage.getItem('adminAuthenticated');
    if (sessionAuth === 'true') {
        isAdminAuthenticated = true;
        closeLoginModal();
    } else {
        // Show login modal
        showLoginModal();
    }
});

// Show Login Modal
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        // Disable interaction with rest of page
        document.body.style.overflow = 'hidden';
    }
}

// Close Login Modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Handle Admin Login
function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';
    
    // Validate credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Authentication successful
        isAdminAuthenticated = true;
        sessionStorage.setItem('adminAuthenticated', 'true');
        
        // Clear form
        document.getElementById('loginForm').reset();
        
        // Close modal
        closeLoginModal();
        
        // Show welcome notification
        showNotification('Welcome Admin! Access Granted.', 'success');
        
        // Initialize dashboard
        initializeDashboard();
    } else {
        // Authentication failed
        errorDiv.textContent = '❌ Invalid username or password. Please try again.';
        errorDiv.classList.add('show');
        
        // Log failed attempt (in production, send to server)
        console.warn('⚠️ Failed login attempt', {
            timestamp: new Date().toISOString(),
            attemptedUsername: username
        });
        
        // Shake effect on error
        const modal = document.querySelector('.login-modal');
        if (modal) {
            modal.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => {
                modal.style.animation = '';
            }, 300);
        }
        
        // Clear password field
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// Logout Admin
function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear authentication
        isAdminAuthenticated = false;
        sessionStorage.removeItem('adminAuthenticated');
        
        // Show notification
        showNotification('You have been logged out.', 'success');
        
        // Show login modal again
        setTimeout(() => {
            showLoginModal();
            // Reset all forms
            document.getElementById('loginForm').reset();
            document.getElementById('username').focus();
        }, 500);
    }
}

// Prevent direct access to dashboard without login
window.addEventListener('beforeunload', function() {
    if (!isAdminAuthenticated) {
        // Page is being reloaded/closed, clear session
        sessionStorage.removeItem('adminAuthenticated');
    }
});

// Initialize Dashboard (only after successful login)
function initializeDashboard() {
    // Set dashboard as active page
    const dashboardPage = document.getElementById('dashboard-page');
    if (dashboardPage) {
        dashboardPage.classList.add('active');
    }
    
    // Set dashboard link as active
    const dashboardLink = document.querySelector('a[href="#dashboard"]');
    if (dashboardLink) {
        dashboardLink.classList.add('active');
    }
    
    // Set dashboard menu item as active
    const menuItems = document.querySelectorAll('.menu-item');
    if (menuItems.length > 0) {
        menuItems[0].classList.add('active');
    }
}

// PAGE SWITCHING FUNCTIONALITY
// =============================================
function switchPage(pageName) {
    // Check if admin is authenticated
    if (!isAdminAuthenticated) {
        showLoginModal();
        showNotification('Please login first', 'error');
        return;
    }
    
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageName + '-page');
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Update navbar links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    event.target.closest('.nav-link')?.classList.add('active');

    // Update sidebar menu
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.menu-item')?.classList.add('active');
    
    // Load contacts data when switching to contacts page
    if (pageName === 'contacts') {
        loadContacts();
    }
}

// Update Order Status
function updateOrderStatus(selectElement, orderId) {
    const newStatus = selectElement.value;
    const row = selectElement.closest('tr');
    const statusCell = row.querySelector('td:nth-child(7)');
    
    // Remove old badge classes
    const badge = statusCell.querySelector('.badge');
    badge.classList.remove('badge-pending', 'badge-partial', 'badge-completed');
    
    // Add new badge classes based on status
    switch(newStatus) {
        case 'pending':
            badge.classList.add('badge-pending');
            badge.textContent = 'Pending';
            break;
        case 'processing':
            badge.classList.add('badge-partial');
            badge.textContent = 'Processing';
            break;
        case 'delivered':
            badge.classList.add('badge-completed');
            badge.textContent = 'Delivered';
            break;
        case 'cancelled':
            badge.classList.add('badge-pending');
            badge.textContent = 'Cancelled';
            break;
    }
    
    // Show notification
    showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
}

// Update User Status
function updateUserStatus(selectElement, userId) {
    const newStatus = selectElement.value;
    const card = selectElement.closest('.user-card');
    const statusIndicator = card.querySelector('.user-status');
    
    // Update status indicator
    statusIndicator.classList.remove('online', 'offline');
    statusIndicator.classList.add(newStatus);
    
    // Update title
    statusIndicator.title = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    
    // Show notification
    const userName = card.querySelector('.user-card-body h3').textContent;
    showNotification(`${userName} status updated to ${newStatus}`, 'success');
}

// Notification System
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('style[data-notification]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notification', 'true');
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-left: 4px solid #22c55e;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
                max-width: 350px;
            }

            .notification-success {
                border-left-color: #22c55e;
            }

            .notification-error {
                border-left-color: #ef4444;
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .notification-content i {
                font-size: 1.25rem;
            }

            .notification-success .notification-content i {
                color: #22c55e;
            }

            .notification-error .notification-content i {
                color: #ef4444;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 1.25rem;
                cursor: pointer;
                color: #666;
                transition: all 0.3s ease;
                flex-shrink: 0;
            }

            .notification-close:hover {
                color: #000;
                transform: rotate(90deg);
            }

            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @media (max-width: 768px) {
                .notification {
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Load Contacts Data on Page Switch
function loadContacts() {
    const contactsTableBody = document.getElementById('contactsTableBody');
    if (!contactsTableBody) return; // Contacts page not loaded yet
    
    // Show loading state
    contactsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Loading contacts...</td></tr>';
    
    // Fetch contacts from backend
    fetch('https://script.google.com/macros/s/AKfycbxb5XesTNnxNySyUVuDBU6Vjyk2PBDia5pbyULneRBVYnGExxisZY7zXFBJ48nDekwe/exec?action=getContacts')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification(`Error loading contacts: ${data.error}`, 'error');
                contactsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Failed to load contacts</td></tr>';
                return;
            }
            
            const contacts = data.contacts || [];
            
            if (contacts.length === 0) {
                contactsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #999;">No contacts yet</td></tr>';
                return;
            }
            
            // Populate table with contact data
            contactsTableBody.innerHTML = contacts.map(contact => {
                const messagePreview = contact.message.substring(0, 50) + (contact.message.length > 50 ? '...' : '');
                const submittedDate = new Date(contact.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                return `
                    <tr>
                        <td>${escapeHtml(contact.contact_id)}</td>
                        <td>${escapeHtml(contact.name)}</td>
                        <td>${escapeHtml(contact.email)}</td>
                        <td>${escapeHtml(contact.subject || 'N/A')}</td>
                        <td title="${escapeHtml(contact.message)}">${escapeHtml(messagePreview)}</td>
                        <td>${submittedDate}</td>
                        <td>${escapeHtml(contact.source || 'website')}</td>
                        <td>
                            <button class="action-btn view-btn" onclick="viewContact('${escapeHtml(contact.contact_id)}', event)" title="View full message">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="deleteContact('${escapeHtml(contact.contact_id)}', event)" title="Delete contact">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            showNotification('Failed to load contacts', 'error');
            contactsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Error loading contacts</td></tr>';
        });
}

// View Full Contact Message
function viewContact(contactId, event) {
    if (event) event.preventDefault();
    
    const table = document.getElementById('contactsTableBody');
    const row = Array.from(table.querySelectorAll('tr')).find(r => r.cells[0].textContent === contactId);
    
    if (row) {
        const cells = row.cells;
        const messagePreview = cells[4].getAttribute('title') || cells[4].textContent;
        
        alert(`Contact Details:\n\nID: ${cells[0].textContent}\nName: ${cells[1].textContent}\nEmail: ${cells[2].textContent}\nSubject: ${cells[3].textContent}\n\nMessage:\n${messagePreview}`);
    }
}

// Delete Contact
function deleteContact(contactId, event) {
    if (event) event.preventDefault();
    
    if (confirm(`Are you sure you want to delete contact ${contactId}?`)) {
        const row = document.querySelector(`tr:has(td:first-child:contains("${contactId}"))`);
        if (row) {
            row.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                row.remove();
                showNotification(`Contact ${contactId} has been deleted`, 'success');
            }, 300);
        }
    }
}

// Export Contacts as CSV
function exportContacts() {
    const table = document.getElementById('contactsTableBody');
    const rows = table.querySelectorAll('tr');
    
    if (rows.length === 0) {
        showNotification('No contacts to export', 'error');
        return;
    }
    
    let csv = 'Contact ID,Name,Email,Subject,Message Preview,Submitted At,Source\n';
    
    rows.forEach(row => {
        if (row.cells.length > 0) {
            const contactId = row.cells[0].textContent;
            const name = row.cells[1].textContent;
            const email = row.cells[2].textContent;
            const subject = row.cells[3].textContent;
            const message = row.cells[4].getAttribute('title') || row.cells[4].textContent;
            const date = row.cells[5].textContent;
            const source = row.cells[6].textContent;
            
            csv += `"${contactId}","${name}","${email}","${subject}","${message}","${date}","${source}"\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification('Contacts exported successfully', 'success');
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Search Functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            // Check which page we're on
            const activePage = document.querySelector('.page-content.active');
            
            if (activePage.id === 'orders-page') {
                filterOrders(searchTerm);
            } else if (activePage.id === 'users-page') {
                filterUsers(searchTerm);
            } else if (activePage.id === 'contacts-page') {
                filterContacts(searchTerm);
            }
        });
    }

    // Filter Select Functionality
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', function(e) {
            const filterValue = e.target.value;
            
            const activePage = document.querySelector('.page-content.active');
            
            if (activePage.id === 'orders-page') {
                filterOrdersByStatus(filterValue);
            } else if (activePage.id === 'users-page') {
                filterUsersByStatus(filterValue);
            }
        });
    }
});

// Filter Orders by Search
function filterOrders(searchTerm) {
    const table = document.querySelector('.data-table tbody');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const orderId = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const clientName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        
        if (orderId.includes(searchTerm) || clientName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter Orders by Status
function filterOrdersByStatus(status) {
    const table = document.querySelector('.data-table tbody');
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (!status) {
            row.style.display = '';
        } else {
            const statusCell = row.querySelector('td:nth-child(9) select');
            if (statusCell && statusCell.value === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Filter Users by Search
function filterUsers(searchTerm) {
    const userCards = document.querySelectorAll('.user-card');
    
    userCards.forEach(card => {
        const name = card.querySelector('.user-card-body h3').textContent.toLowerCase();
        const email = card.querySelector('.user-detail:nth-child(2) p').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || email.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter Users by Status
function filterUsersByStatus(status) {
    const userCards = document.querySelectorAll('.user-card');
    
    userCards.forEach(card => {
        if (!status) {
            card.style.display = '';
        } else {
            const statusIndicator = card.querySelector('.user-status');
            if (statusIndicator.classList.contains(status)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Filter Contacts by Search
function filterContacts(searchTerm) {
    const table = document.querySelector('#contacts-page .data-table tbody');
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.cells.length >= 3) {
            const name = row.cells[1].textContent.toLowerCase();
            const email = row.cells[2].textContent.toLowerCase();
            const subject = row.cells[3].textContent.toLowerCase();
            
            if (name.includes(searchTerm) || email.includes(searchTerm) || subject.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Review Action Buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.review-action-btn')) {
        const btn = e.target.closest('.review-action-btn');
        const reviewCard = btn.closest('.review-card');
        const reviewerName = reviewCard.querySelector('.reviewer-info h4').textContent;
        
        if (btn.classList.contains('delete')) {
            if (confirm(`Delete review from ${reviewerName}?`)) {
                reviewCard.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => reviewCard.remove(), 300);
                showNotification(`Review from ${reviewerName} has been deleted`, 'success');
            }
        } else if (btn.innerHTML.includes('Helpful')) {
            showNotification('Thank you! Review marked as helpful.', 'success');
        } else if (btn.innerHTML.includes('Reply')) {
            showNotification('Reply feature coming soon!', 'success');
        }
    }
});

// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
window.addEventListener('load', function() {
    // NOTE: Authentication check is done at the top of this file
    // Dashboard will only initialize after successful login
});

// Responsive Sidebar Toggle (Mobile)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Close sidebar when clicking on a menu item (mobile)
document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.sidebar');
    const menuItem = e.target.closest('.menu-item');
    
    if (menuItem && window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
    }
});

// Add smooth page transitions
function smoothTransition(callback) {
    document.body.style.opacity = '0.95';
    setTimeout(() => {
        callback();
        document.body.style.opacity = '1';
    }, 150);
}

// Export data functionality (example)
function exportTableData(format) {
    showNotification(`Export to ${format.toUpperCase()} feature coming soon!`, 'success');
}

// Real-time stats update (simulated)
function updateStats() {
    const stats = document.querySelectorAll('.stat-value');
    // You can connect this to a real API endpoint
    // This is a placeholder for demonstration
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});
