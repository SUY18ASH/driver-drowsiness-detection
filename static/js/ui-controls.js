class UIController {
    constructor() {
        this.sidebar = document.getElementById('profileSidebar');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.currentModal = null;
        this.isDarkMode = localStorage.getItem('theme') === 'dark';
        
        this.initializeEventListeners();
        this.loadThemePreference();
        this.updateDateTime();
    }

    initializeEventListeners() {
        // Profile menu button
        const profileMenuBtn = document.getElementById('profileMenuBtn');
        if (profileMenuBtn) {
            profileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Close sidebar button
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
        }

        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.isDarkMode;
            darkModeToggle.addEventListener('change', () => this.toggleTheme());
        }

        // Modal backdrop click
        if (this.modalBackdrop) {
            this.modalBackdrop.addEventListener('click', () => {
                this.closeAllModals();
                this.closeSidebar();
            });
        }

        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeSidebar();
            }
        });

        // Update date time every second
        setInterval(() => this.updateDateTime(), 1000);
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('active');
            this.modalBackdrop.classList.toggle('active');
        }
    }

    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('active');
            this.modalBackdrop.classList.remove('active');
        }
    }

    openModal(modalId) {
        this.closeSidebar();
        const modal = document.getElementById(`${modalId}Modal`);
        if (modal) {
            this.currentModal = modal;
            modal.classList.add('active');
            this.modalBackdrop.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(`${modalId}Modal`);
        if (modal) {
            modal.classList.remove('active');
            this.modalBackdrop.classList.remove('active');
            this.currentModal = null;
        }
    }

    closeAllModals() {
        if (this.currentModal) {
            this.currentModal.classList.remove('active');
            this.modalBackdrop.classList.remove('active');
            this.currentModal = null;
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        
        // Update the toggle checkbox
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.isDarkMode;
        }
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.isDarkMode = savedTheme === 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update the toggle checkbox
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.isDarkMode;
        }
    }

    updateDateTime() {
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            const now = new Date();
            const formatted = now.toISOString().replace('T', ' ').substr(0, 19);
            dateTimeElement.textContent = formatted;
        }
    }
}

// Initialize UI Controller
let uiController;
document.addEventListener('DOMContentLoaded', () => {
    uiController = new UIController();
});

// Global functions for HTML onclick handlers
function openModal(modalId) {
    if (uiController) uiController.openModal(modalId);
}

function closeModal(modalId) {
    if (uiController) uiController.closeModal(modalId);
}

function toggleTheme() {
    if (uiController) uiController.toggleTheme();
}