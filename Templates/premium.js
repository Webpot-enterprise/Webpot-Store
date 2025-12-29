// Initialize palette toggle button
const paletteToggle = document.querySelector('.palette-toggle');
const paletteVibes = document.querySelector('.palette-vibes');

paletteToggle.addEventListener('click', () => {
    paletteVibes.classList.toggle('active');
});

// Close palette when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.vibe-palette')) {
        paletteVibes.classList.remove('active');
    }
});

// Vibe definitions
const vibes = {
    'cyberpunk': {
        '--bg-gradient': 'linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #0f0f2e 100%)',
        '--glow-color': '#00d4ff',
        '--text-shadow': '0 0 20px rgba(0, 212, 255, 0.6)',
        '--accent-color': '#b000ff'
    },
    'sunset': {
        '--bg-gradient': 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #fdb833 100%)',
        '--glow-color': '#ff6b35',
        '--text-shadow': '0 0 20px rgba(255, 107, 53, 0.6)',
        '--accent-color': '#ff6b35'
    },
    'stealth': {
        '--bg-gradient': 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0a0a0a 100%)',
        '--glow-color': '#808080',
        '--text-shadow': '0 0 10px rgba(128, 128, 128, 0.4)',
        '--accent-color': '#404040'
    },
    'matrix': {
        '--bg-gradient': 'linear-gradient(135deg, #000000 0%, #001a00 50%, #000000 100%)',
        '--glow-color': '#00ff00',
        '--text-shadow': '0 0 20px rgba(0, 255, 0, 0.6)',
        '--accent-color': '#00dd00'
    },
    'galaxy': {
        '--bg-gradient': 'linear-gradient(135deg, #2d0052 0%, #6a0572 50%, #1a0033 100%)',
        '--glow-color': '#b000ff',
        '--text-shadow': '0 0 20px rgba(176, 0, 255, 0.6)',
        '--accent-color': '#ff00ff'
    },
    'lava': {
        '--bg-gradient': 'linear-gradient(135deg, #330000 0%, #991a00 50%, #660000 100%)',
        '--glow-color': '#ff6600',
        '--text-shadow': '0 0 20px rgba(255, 102, 0, 0.6)',
        '--accent-color': '#ff3300'
    },
    'holo': {
        '--bg-gradient': 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #001a33 100%)',
        '--glow-color': '#00ffff',
        '--text-shadow': '0 0 20px rgba(0, 255, 255, 0.6)',
        '--accent-color': '#ff00ff'
    }
};

// Apply vibe function
function applyVibe(vibeName) {
    const selectedVibe = vibes[vibeName];
    const root = document.documentElement;
    
    for (const [key, value] of Object.entries(selectedVibe)) {
        root.style.setProperty(key, value);
    }
    
    // Save preference to localStorage
    localStorage.setItem('premiumVibe', vibeName);
}

// Add click listeners to all vibe dots
document.querySelectorAll('.vibe').forEach(vibeElement => {
    vibeElement.addEventListener('click', () => {
        const vibeName = vibeElement.getAttribute('data-vibe');
        applyVibe(vibeName);
        paletteVibes.classList.remove('active');
    });
});

// Load saved vibe on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedVibe = localStorage.getItem('premiumVibe') || 'cyberpunk';
    applyVibe(savedVibe);
});
