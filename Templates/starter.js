// Theme definitions for Starter template
const themes = {
    'default': {
        '--bg-color': '#ffffff',
        '--text-color': '#333333',
        '--accent-color': '#0066ff'
    },
    'dark-mode': {
        '--bg-color': '#1a1a1a',
        '--text-color': '#ffffff',
        '--accent-color': '#00d4ff'
    },
    'nature': {
        '--bg-color': '#f0f5e8',
        '--text-color': '#1b5e20',
        '--accent-color': '#2e7d32'
    },
    'ocean': {
        '--bg-color': '#e0f2f1',
        '--text-color': '#004d40',
        '--accent-color': '#006994'
    },
    'sunset': {
        '--bg-color': '#fff3e0',
        '--text-color': '#e65100',
        '--accent-color': '#ff6b35'
    },
    'berry': {
        '--bg-color': '#f3e5f5',
        '--text-color': '#4a148c',
        '--accent-color': '#b000ff'
    },
    'mono': {
        '--bg-color': '#f5f5f5',
        '--text-color': '#212121',
        '--accent-color': '#666666'
    }
};

// Initialize palette toggle button
const paletteToggle = document.querySelector('.palette-toggle');
const paletteDots = document.querySelector('.palette-dots');

paletteToggle.addEventListener('click', () => {
    paletteDots.classList.toggle('active');
});

// Close palette when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-palette')) {
        paletteDots.classList.remove('active');
    }
});

// Initialize theme selector
document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeName = e.target.getAttribute('data-theme');
        applyTheme(themeName);
        localStorage.setItem('starterTheme', themeName);
        paletteDots.classList.remove('active');
    });
});

// Apply theme function
function applyTheme(themeName) {
    const selectedTheme = themes[themeName];
    const root = document.documentElement;
    
    for (const [key, value] of Object.entries(selectedTheme)) {
        root.style.setProperty(key, value);
    }
}

// Load saved theme on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('starterTheme') || 'default';
    applyTheme(savedTheme);
});
