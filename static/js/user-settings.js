class UserSettings {
    constructor() {
        this.currentProfile = null;
        this.profiles = new Map();
        this.defaultSettings = {
            alertVolume: 70,
            soundEnabled: true,
            notificationsEnabled: false,
            thresholds: {
                drowsiness: 20,
                lowAlert: 30,
                mediumAlert: 50,
                highAlert: 70
            },
            theme: 'light',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        this.loadProfiles();
        this.initializeEventListeners();
    }

    async loadProfiles() {
        try {
            const response = await fetch('/api/profiles');
            const profiles = await response.json();
            this.profiles = new Map(Object.entries(profiles));
            
            // Load current user's profile
            const currentUser = document.getElementById('userLogin').textContent;
            this.currentProfile = this.profiles.get(currentUser) || this.createNewProfile(currentUser);
            
            this.applySettings(this.currentProfile.settings);
            this.updateProfileUI();
        } catch (error) {
            console.error('Error loading profiles:', error);
            addLog('Failed to load user profile', 'error');
        }
    }

    createNewProfile(username) {
        const newProfile = {
            username: username,
            settings: { ...this.defaultSettings },
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        this.profiles.set(username, newProfile);
        this.saveProfiles();
        return newProfile;
    }

    async saveProfiles() {
        try {
            await fetch('/api/profiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(this.profiles))
            });
            addLog('Settings saved successfully');
        } catch (error) {
            console.error('Error saving profiles:', error);
            addLog('Failed to save settings', 'error');
        }
    }

    applySettings(settings) {
        // Apply alert settings
        if (alertSystem) {
            alertSystem.setVolume(settings.alertVolume);
            alertSystem.toggleSound(settings.soundEnabled);
        }

        // Apply thresholds
        document.getElementById('thresholdSlider').value = settings.thresholds.drowsiness;
        document.getElementById('lowAlertThreshold').value = settings.thresholds.lowAlert;
        document.getElementById('mediumAlertThreshold').value = settings.thresholds.mediumAlert;
        document.getElementById('highAlertThreshold').value = settings.thresholds.highAlert;

        // Apply other settings
        document.getElementById('soundToggle').checked = settings.soundEnabled;
        document.getElementById('notificationToggle').checked = settings.notificationsEnabled;
        document.getElementById('volumeSlider').value = settings.alertVolume;
        document.getElementById('volumeValue').textContent = `${settings.alertVolume}%`;

        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme);
    }

    updateProfileUI() {
        const settingsInfo = document.getElementById('settingsInfo');
        if (settingsInfo && this.currentProfile) {
            settingsInfo.innerHTML = `
                <div class="profile-header">
                    <div class="profile-avatar">${this.currentProfile.username[0].toUpperCase()}</div>
                    <div class="profile-details">
                        <div class="profile-name">${this.currentProfile.username}</div>
                        <div class="profile-meta">Last modified: ${new Date(this.currentProfile.lastModified).toLocaleString()}</div>
                    </div>
                </div>
            `;
        }
    }

    initializeEventListeners() {
        // Threshold changes
        document.getElementById('thresholdSlider').addEventListener('change', (e) => {
            this.updateSetting('thresholds.drowsiness', parseInt(e.target.value));
        });

        // Alert threshold changes
        ['low', 'medium', 'high'].forEach(level => {
            document.getElementById(`${level}AlertThreshold`).addEventListener('change', (e) => {
                this.updateSetting(`thresholds.${level}Alert`, parseInt(e.target.value));
            });
        });

        // Volume change
        document.getElementById('volumeSlider').addEventListener('change', (e) => {
            this.updateSetting('alertVolume', parseInt(e.target.value));
        });

        // Toggle changes
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.updateSetting('soundEnabled', e.target.checked);
        });

        document.getElementById('notificationToggle').addEventListener('change', (e) => {
            this.updateSetting('notificationsEnabled', e.target.checked);
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('change', (e) => {
            this.updateSetting('theme', e.target.checked ? 'dark' : 'light');
        });
    }

    updateSetting(path, value) {
        if (!this.currentProfile) return;

        // Update nested settings using path (e.g., 'thresholds.drowsiness')
        const parts = path.split('.');
        let current = this.currentProfile.settings;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;

        this.currentProfile.lastModified = new Date().toISOString();
        this.saveProfiles();
        this.updateProfileUI();
    }
}