// =============================================
// TERMS & CONDITIONS PAGE - JAVASCRIPT
// =============================================

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Terms & Conditions page initialized successfully!');
});

// Switch between T&C tabs
function switchTCTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tc-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tc-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    event.target.closest('.tc-tab-btn').classList.add('active');
}
