class AlertSystem {
    constructor() {
      this.alertLevels = {
        LOW:    { threshold: 30, sound: '/static/sounds/alert1.mp3' },
        MEDIUM: { threshold: 50, sound: '/static/sounds/alert2.mp3' },
        HIGH:   { threshold: 70, sound: '/static/sounds/alert3.mp3' }
      };
      this.soundEnabled = true;
      this.alertSounds = {};
      this.currentLevel = null;
      this.initializeSounds();
    }
  
    initializeSounds() {
      // Preload each sound once
      Object.entries(this.alertLevels).forEach(([level, cfg]) => {
        const audio = new Audio(cfg.sound);
        audio.preload = 'auto';
        this.alertSounds[level] = audio;
      });
    }
  
    getAlertLevel(drowsinessLevel) {
      if (drowsinessLevel >= this.alertLevels.HIGH.threshold)   return 'HIGH';
      if (drowsinessLevel >= this.alertLevels.MEDIUM.threshold) return 'MEDIUM';
      if (drowsinessLevel >= this.alertLevels.LOW.threshold)    return 'LOW';
      return null;
    }
  
    handleAlert(drowsinessLevel, eyesClosed) {
      const newLevel = this.getAlertLevel(drowsinessLevel);
  
      // If the level changed...
      if (newLevel !== this.currentLevel) {
        // Update on-screen indicator
        this._updateIndicator(newLevel, drowsinessLevel);
  
        // Play sound only on a rise into LOW/MEDIUM/HIGH
        if (newLevel && this.soundEnabled) {
          const sound = this.alertSounds[newLevel];
          sound.pause();
          sound.currentTime = 0;
          sound.play().catch(() => {/* mute autoplay errors */});
        }
  
        this.currentLevel = newLevel;
      }
  
      return newLevel;
    }
  
    _updateIndicator(level, drowsinessLevel) {
      let indicator = document.getElementById('alertIndicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'alertIndicator';
        indicator.className = 'alert-indicator';
        document.body.appendChild(indicator);
      }
  
      if (level) {
        indicator.className = `alert-indicator show ${level.toLowerCase()}`;
        indicator.innerHTML = `<i class="mdi mdi-alert"></i> ${level} Alert — ${drowsinessLevel}%`;
      } else {
        // No alert: clear both classes and content
        indicator.className = 'alert-indicator';
        indicator.innerHTML = '';
      }
    }
  }
  