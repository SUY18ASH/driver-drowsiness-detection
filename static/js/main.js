document.addEventListener('DOMContentLoaded', function () {
    // ========== GLOBALS ==========
    let drowsinessChart, eyeClosureChart;
    const maxDataPoints = 60;
    let statusUpdateInterval;
    let isVideoActive = false;
    let currentSessionId = null;

    // ========== Detection System ==========
    class DetectionSystem {
        constructor() {
            this.isActive = false;
            this.videoFeed = document.getElementById('videoFeed');
            this.startButton = document.getElementById('startButton');
            this.stopButton = document.getElementById('stopButton');
            this.initializeButtons();
        }
        initializeButtons() {
            if (this.startButton) this.startButton.onclick = this.startDetection.bind(this);
            if (this.stopButton) this.stopButton.onclick = this.stopDetection.bind(this);
        }
        async startDetection() {
            try {
                const response = await fetch('/start_detection');
                const data = await response.json();
                if (data.status === 'started' || data.status === 'already_running') {
                    this.isActive = true;
                    currentSessionId = data.session_id;
                    this.startVideoFeed();
                    this.startStatusUpdates();
                    addLog('Detection system started');
                    
                    if (this.startButton) this.startButton.disabled = true;
                    if (this.stopButton) this.stopButton.disabled = false;
                    isVideoActive = true;
                } else {
                    addLog('Failed to start detection: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                addLog('Failed to start detection', 'error');
            }
        }
        async stopDetection() {
            try {
                const response = await fetch('/stop_detection');
                const data = await response.json();
                if (data.status === 'stopped' || data.status === 'not_running') {
                    this.isActive = false;
                    this.stopVideoFeed();
                    this.stopStatusUpdates();
                    addLog('Detection system stopped');
                    if (this.startButton) this.startButton.disabled = false;
                    if (this.stopButton) this.stopButton.disabled = true;
                    isVideoActive = false;
                    updateSessionsList();
                } else {
                    addLog('Failed to stop detection: ' + (data.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                addLog('Failed to stop detection', 'error');
            }
        }
        startVideoFeed() {
            if (this.videoFeed) this.videoFeed.src = `/video_feed?t=${Date.now()}`;
        }
        stopVideoFeed() {
            if (this.videoFeed) this.videoFeed.src = '';
        }
        startStatusUpdates() {
            updateStatus();
            statusUpdateInterval = setInterval(updateStatus, 1000);
        }
        stopStatusUpdates() {
            if (statusUpdateInterval) {
                clearInterval(statusUpdateInterval);
                statusUpdateInterval = null;
            }
        }
    }

    // ========== Chart Initialization ==========
    function initializeCharts() {
        const drowsinessCtx = document.getElementById('drowsinessChart')?.getContext('2d');
        if (drowsinessCtx) {
            drowsinessChart = new Chart(drowsinessCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Drowsiness Level',
                        data: [],
                        borderColor: '#3b82f6',
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: 'Drowsiness Level (%)' }
                        },
                        x: { title: { display: true, text: 'Time (s)' } }
                    }
                }
            });
        }
        const eyeClosureCtx = document.getElementById('eyeClosureChart')?.getContext('2d');
        if (eyeClosureCtx) {
            eyeClosureChart = new Chart(eyeClosureCtx, {
                type: 'bar',
                data: {
                    labels: ['Last 60 Seconds'],
                    datasets: [{
                        label: 'Eyes Closed Duration',
                        data: [0],
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Duration (s)' }
                        }
                    }
                }
            });
        }
    }

    // ========== Status Updates ==========
    async function updateStatus() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            updateStatusValue('faceStatus', data.face_detected ? 'Yes' : 'No');
            updateStatusValue('eyesStatus', data.eyes_closed);
            updateStatusValue('drowsinessLevel', `${data.drowsiness_level}%`);
            updateStatusValue('lastUpdate', data.last_update);

            // ========== Alarm/Alert Handling ==========
            if (window.alertSystem && typeof window.alertSystem.handleAlert === "function") {
                const alertLevel = window.alertSystem.handleAlert(data.drowsiness_level, data.eyes_closed);
                updateAlertIndicator(alertLevel, data.drowsiness_level);
            }

            updateCharts(data);
        } catch (error) {}
    }
    function updateStatusValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            const oldValue = element.textContent;
            element.textContent = value;
            if (oldValue !== value.toString()) {
                element.classList.add('changed');
                setTimeout(() => element.classList.remove('changed'), 1000);
            }
        }
    }
    function updateAlertIndicator(level, drowsinessLevel) {
        let indicator = document.getElementById('alertIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'alertIndicator';
            indicator.className = 'alert-indicator';
            document.body.appendChild(indicator);
        }
        if (level) {
            indicator.className = `alert-indicator show ${level.toLowerCase()}`;
            indicator.innerHTML = `<i class="mdi mdi-alert"></i>${level} Alert - ${drowsinessLevel}%`;
        } else {
            indicator.className = 'alert-indicator';
        }
    }
    function updateCharts(data) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        if (drowsinessChart) {
            drowsinessChart.data.labels.push(timeLabel);
            drowsinessChart.data.datasets[0].data.push(data.drowsiness_level);
            if (drowsinessChart.data.labels.length > maxDataPoints) {
                drowsinessChart.data.labels.shift();
                drowsinessChart.data.datasets[0].data.shift();
            }
            drowsinessChart.update('none');
        }
        if (eyeClosureChart) {
            eyeClosureChart.data.datasets[0].data[0] = data.eyes_closed;
            eyeClosureChart.update('none');
        }
    }

    // ========== Sessions ==========
    function updateSessionsList() {
        fetch('/sessions')
            .then(response => response.json())
            .then(sessions => {
                const sessionsList = document.getElementById('sessionsList');
                if (!sessionsList) return;
                sessionsList.innerHTML = '';
                if (sessions.length === 0) {
                    sessionsList.innerHTML = '<div class="no-sessions">No recorded sessions yet</div>';
                    return;
                }
                sessions.forEach(session => {
                    const sessionItem = document.createElement('div');
                    sessionItem.className = 'session-item';
                    const sessionDate = new Date(session.start_time);
                    const localDateTime = sessionDate.toLocaleString();
                    sessionItem.innerHTML = `
                        <div class="session-info">
                            <span class="session-date">
                                <i class="mdi mdi-calendar-clock"></i>
                                ${localDateTime}
                            </span>
                            <span class="session-frames">
                                <i class="mdi mdi-film"></i>
                                ${session.frame_count} frames
                            </span>
                        </div>
                        <div class="session-actions">
                            <button class="button button-small button-primary" onclick="playSession('${session.session_id}')">
                                <i class="mdi mdi-play"></i> Play
                            </button>
                            <button class="button button-small button-secondary" onclick="downloadSession('${session.session_id}')">
                                <i class="mdi mdi-download"></i>
                            </button>
                        </div>
                    `;
                    sessionsList.appendChild(sessionItem);
                });
            })
            .catch(error => {
                addLog('Failed to update sessions list', 'error');
            });
    }

    // ========== Logs ==========
    function addLog(message, type = 'info') {
        const logsContent = document.getElementById('logsContent');
        if (!logsContent) return;
        const logItem = document.createElement('div');
        logItem.className = `log-item log-${type}`;
        logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logsContent.appendChild(logItem);
        while (logsContent.children.length > 100) logsContent.removeChild(logsContent.firstChild);
        logsContent.scrollTop = logsContent.scrollHeight;
    }

    // ========== Modal and Session Play/Download ==========
    window.openModal = window.openModal || function (modalId) {
        document.getElementById('modalBackdrop').style.display = 'block';
        document.getElementById(modalId + 'Modal').style.display = 'block';
    };
    window.closeModal = window.closeModal || function (modalId) {
        document.getElementById('modalBackdrop').style.display = 'none';
        document.getElementById(modalId + 'Modal').style.display = 'none';
    };
    window.playSession = window.playSession || function (sessionId) {
        alert('Play session: ' + sessionId + '\n(Not implemented in this sample)');
    };
    window.downloadSession = window.downloadSession || function (sessionId) {
        window.location.href = `/sessions/${sessionId}`;
    };

    // ========== Date/Time Display ==========
    function updateDateTime() {
        const dtElem = document.getElementById('dateTimeValue');
        if (dtElem) {
            const d = new Date();
            dtElem.textContent = d.toISOString().replace('T', ' ').replace(/\..+/, '');
        }
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // ========== Initialize Everything ==========
    initializeCharts();
    window.detectionSystem = new DetectionSystem();
    window.alertSystem = new AlertSystem();
    updateSessionsList();
    setInterval(updateSessionsList, 30000);

    window.addEventListener('beforeunload', function () {
        if (isVideoActive && window.detectionSystem) {
            window.detectionSystem.stopDetection();
        }
    });

    // ========== ALERT SOUND SUPPORT ==========
    // If your AlertSystem expects <audio id="alarmSound">, make sure it's present in HTML!
    // Example:
    // <audio id="alarmSound" src="/static/sounds/alarm.mp3" preload="auto"></audio>
    // And AlertSystem should call document.getElementById('alarmSound').play() when needed.
});