// Brand color definitions for Basic template
const brandColors = {
    'corporate-blue': {
        '--primary-color': '#001f5c',
        '--secondary-color': '#f0f0f0'
    },
    'energetic-red': {
        '--primary-color': '#c41e3a',
        '--secondary-color': '#ffe6e6'
    },
    'luxury-gold': {
        '--primary-color': '#d4af37',
        '--secondary-color': '#1a1a1a'
    },
    'finance-green': {
        '--primary-color': '#1b5e20',
        '--secondary-color': '#e8f5e9'
    },
    'creative-purple': {
        '--primary-color': '#7b1fa2',
        '--secondary-color': '#f3e5f5'
    },
    'health-teal': {
        '--primary-color': '#00897b',
        '--secondary-color': '#e0f2f1'
    },
    'tech-slate': {
        '--primary-color': '#37474f',
        '--secondary-color': '#eceff1'
    }
};

// Initialize palette toggle button
const paletteToggle = document.querySelector('.palette-toggle');
const paletteSwatches = document.querySelector('.palette-swatches');

paletteToggle.addEventListener('click', () => {
    paletteSwatches.classList.toggle('active');
});

// Close palette when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.brand-palette')) {
        paletteSwatches.classList.remove('active');
    }
});

// Initialize swatch selector
document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        e.stopPropagation();
        const brandName = e.target.getAttribute('data-brand');
        applyBrand(brandName);
        localStorage.setItem('basicBrand', brandName);
        paletteSwatches.classList.remove('active');
    });
});

// Apply brand function
function applyBrand(brandName) {
    const selectedBrand = brandColors[brandName];
    const root = document.documentElement;
    
    for (const [key, value] of Object.entries(selectedBrand)) {
        root.style.setProperty(key, value);
    }
}

// Load saved brand on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedBrand = localStorage.getItem('basicBrand') || 'corporate-blue';
    applyBrand(savedBrand);
});
