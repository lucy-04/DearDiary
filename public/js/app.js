// ===== DEAR DIARY APPLICATION - INTEGRATED WITH BACKEND =====
class DearDiaryApp {
    constructor() {
        this.entries = [];
        this.currentMood = '😊';
        this.currentMoodName = 'Happy';
        this.token = localStorage.getItem('token');
        this.isInitialized = false;
        
        // Check authentication
        if (!this.token) {
            window.location.href = '/login';
            return;
        }
        
        this.initializeApplication();
        this.setupEventListeners();
    }

    // ===== INITIALIZATION =====
    async initializeApplication() {
        this.setCurrentDate();
        this.setupMoodSelection();
        await this.loadEntries();
        this.isInitialized = true;
        
        console.log('💫 Dear Diary initialized successfully');
    }

    setupEventListeners() {
        // Mood selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleMoodSelection(e));
        });

        // Detect emotion button
        document.getElementById('detect-emotion-btn').addEventListener('click', () => this.detectAndSetEmotion());

        // Save entry
        document.getElementById('save-entry').addEventListener('click', () => this.saveEntry());
        
        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Character counter
        document.getElementById('diary-entry').addEventListener('input', (e) => this.updateCharacterCounter(e.target.value.length));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Modal
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('entry-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });

        // FAB
        document.getElementById('new-entry-fab').addEventListener('click', () => this.scrollToNewEntry());

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // ===== AUTHENTICATION =====
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    // ===== API CALLS =====
    async loadEntries() {
        try {
            const response = await fetch('/api/entries', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    return;
                }
                throw new Error('Failed to load entries');
            }

            const result = await response.json();
            this.entries = result.data || [];
            this.updateEntriesList();
            this.updateAnalytics();
        } catch (error) {
            console.error('Error loading entries:', error);
            this.showToast('❌ Failed to load entries', 'error');
        }
    }

    async detectEmotion(text) {
        try {
            const response = await fetch('/api/entries/detect-emotion', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('Error detecting emotion:', error);
            return null;
        }
    }

    async detectAndSetEmotion() {
        const content = document.getElementById('diary-entry').value.trim();

        if (!content) {
            this.showToast('📝 Please write something first', 'warning');
            return;
        }

        if (content.length < 10) {
            this.showToast('💭 Write at least 10 characters for emotion detection', 'warning');
            return;
        }

        // Show loading state
        const detectBtn = document.getElementById('detect-emotion-btn');
        const originalHTML = detectBtn.innerHTML;
        detectBtn.disabled = true;
        detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';

        try {
            const emotionData = await this.detectEmotion(content);
            
            if (emotionData && emotionData.prediction) {
                const emotion = emotionData.prediction.toLowerCase();
                
                // Map emotion to mood
                const moodMap = {
                    'happy': { emoji: '😊', name: 'Happy' },
                    'joy': { emoji: '😊', name: 'Happy' },
                    'sad': { emoji: '😢', name: 'Sad' },
                    'sadness': { emoji: '😢', name: 'Sad' },
                    'angry': { emoji: '😠', name: 'Angry' },
                    'anger': { emoji: '😠', name: 'Angry' },
                    'fear': { emoji: '😰', name: 'Sad' },
                    'love': { emoji: '😍', name: 'Love' },
                    'surprise': { emoji: '🤔', name: 'Thoughtful' },
                    'neutral': { emoji: '😊', name: 'Happy' }
                };

                const mood = moodMap[emotion] || { emoji: '😊', name: 'Happy' };

                // Find and click the corresponding mood option
                const moodOptions = document.querySelectorAll('.mood-option');
                let foundMood = false;
                
                moodOptions.forEach(option => {
                    const optionName = option.getAttribute('data-name');
                    if (optionName === mood.name) {
                        option.click();
                        foundMood = true;
                    }
                });

                // Show success with probabilities
                let message = `🎯 Detected: ${emotionData.prediction}`;
                if (emotionData.probabilities) {
                    const topEmotions = Object.entries(emotionData.probabilities)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([em, prob]) => `${em}: ${(prob * 100).toFixed(0)}%`)
                        .join(', ');
                    message += ` (${topEmotions})`;
                }
                
                this.showToast(message, 'success');
            } else {
                this.showToast('⚠️ Could not detect emotion. Using default.', 'warning');
            }
        } catch (error) {
            console.error('Error in detectAndSetEmotion:', error);
            this.showToast('❌ Emotion detection failed', 'error');
        } finally {
            detectBtn.disabled = false;
            detectBtn.innerHTML = originalHTML;
        }
    }

    // ===== MOOD SYSTEM =====
    handleMoodSelection(event) {
        const option = event.currentTarget;
        
        // Remove active class from all options
        document.querySelectorAll('.mood-option').forEach(opt => {
            opt.classList.remove('active');
        });

        // Add active class to selected option
        option.classList.add('active');

        // Update current mood
        this.currentMood = option.getAttribute('data-mood');
        this.currentMoodName = option.getAttribute('data-name');

        // Update display
        this.animateMoodChange();
    }

    animateMoodChange() {
        const emojiElement = document.getElementById('current-mood-emoji');
        const nameElement = document.getElementById('current-mood-name');
        
        // Update text
        emojiElement.textContent = this.currentMood;
        nameElement.textContent = this.currentMoodName;
    }

    // ===== ENTRY MANAGEMENT =====
    async saveEntry() {
        const date = document.getElementById('entry-date').value;
        const title = document.getElementById('entry-title')?.value || 'My Entry';
        const content = document.getElementById('diary-entry').value.trim();

        // Validation
        if (!this.validateEntry(date, content)) {
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Use the currently selected mood (user can change it after detection)
            const mood = this.currentMoodName.toLowerCase();

            // Create entry
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    entry_date: date,
                    mood,
                    mood_name: this.currentMoodName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save entry');
            }

            const result = await response.json();
            
            // Update UI without page reload
            await this.loadEntries();
            this.clearForm();
            
            // Show success message
            this.showToast('✨ Diary entry saved successfully!', 'success');

        } catch (error) {
            console.error('Error saving entry:', error);
            this.showToast('❌ Failed to save entry. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async deleteEntry(entryId) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            const response = await fetch(`/api/entries/${entryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete entry');
            }

            await this.loadEntries();
            this.showToast('✓ Entry deleted successfully', 'success');
            this.closeModal();
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showToast('❌ Failed to delete entry', 'error');
        }
    }

    validateEntry(date, content) {
        if (!date) {
            this.showToast('📅 Please select a date for your entry', 'warning');
            document.getElementById('entry-date').focus();
            return false;
        }

        if (!content) {
            this.showToast('📝 Please write something in your diary', 'warning');
            document.getElementById('diary-entry').focus();
            return false;
        }

        if (content.length < 10) {
            this.showToast('💭 Write at least 10 characters to save an entry', 'warning');
            document.getElementById('diary-entry').focus();
            return false;
        }

        return true;
    }

    clearForm() {
        document.getElementById('diary-entry').value = '';
        if (document.getElementById('entry-title')) {
            document.getElementById('entry-title').value = '';
        }
        this.updateCharacterCounter(0);
        
        // Reset to default mood
        const defaultMood = document.querySelector('.mood-option');
        if (defaultMood) {
            defaultMood.click();
        }
    }

    // ===== SEARCH FUNCTIONALITY =====
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.displayEntries(this.entries);
            return;
        }

        const filteredEntries = this.entries.filter(entry =>
            entry.content.toLowerCase().includes(searchTerm) ||
            entry.title?.toLowerCase().includes(searchTerm) ||
            entry.mood?.toLowerCase().includes(searchTerm) ||
            this.formatDate(entry.entry_date).toLowerCase().includes(searchTerm)
        );

        this.displayEntries(filteredEntries, searchTerm);
    }

    // ===== UI UPDATES =====
    updateEntriesList() {
        this.displayEntries(this.entries);
    }

    displayEntries(entriesToShow, searchTerm = '') {
        const entriesList = document.getElementById('entries-list');
        
        if (entriesToShow.length === 0) {
            const message = searchTerm ? 
                `No entries found for "${searchTerm}"` : 
                'Your diary is waiting for your first entry';
            
            entriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-${searchTerm ? 'search' : 'book'}"></i>
                    <p>${message}</p>
                </div>
            `;
            return;
        }

        entriesList.innerHTML = entriesToShow.map(entry => `
            <div class="entry-item" data-id="${entry.id}" tabindex="0" role="button">
                <div class="entry-header">
                    <span class="entry-date">${this.formatDate(entry.entry_date)}</span>
                    <span class="entry-mood">${this.getMoodEmoji(entry.mood)}</span>
                </div>
                <div class="entry-preview">${this.truncateText(entry.content, 120)}</div>
            </div>
        `).join('');

        // Add click events
        document.querySelectorAll('.entry-item').forEach(item => {
            item.addEventListener('click', () => this.viewEntry(item.getAttribute('data-id')));
        });
    }

    getMoodEmoji(mood) {
        const moodEmojis = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            anxious: '😰',
            calm: '😌',
            excited: '🤗',
            neutral: '😐'
        };
        return moodEmojis[mood?.toLowerCase()] || '😊';
    }

    viewEntry(entryId) {
        const entry = this.entries.find(e => e.id.toString() === entryId.toString());
        if (!entry) return;

        const modal = document.getElementById('entry-modal');
        const modalDate = document.getElementById('modal-date');
        const modalContent = document.getElementById('modal-content');
        const modalMoodEmoji = document.getElementById('modal-mood-emoji');
        const modalMoodText = document.getElementById('modal-mood-text');
        const deleteBtn = document.getElementById('delete-entry-btn');

        // Populate modal
        modalDate.textContent = `${this.formatDate(entry.entry_date)}`;
        modalContent.textContent = entry.content;
        modalMoodEmoji.textContent = this.getMoodEmoji(entry.mood);
        modalMoodText.textContent = entry.mood || 'Happy';

        // Update delete button with entry ID
        deleteBtn.onclick = () => this.handleDeleteEntry(entry.id);

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    async handleDeleteEntry(entryId) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            const response = await fetch(`/api/entries/${entryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete entry');
            }

            // Update UI without page reload
            await this.loadEntries();
            this.showToast('✓ Entry deleted successfully', 'success');
            this.closeModal();
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showToast('❌ Failed to delete entry', 'error');
        }
    }

    closeModal() {
        const modal = document.getElementById('entry-modal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ===== ANALYTICS =====
    updateAnalytics() {
        this.updateBasicStats();
        this.updateMoodChart();
    }

    updateBasicStats() {
        document.getElementById('total-entries').textContent = this.entries.length;
        
        // Calculate weekly average
        const weeklyAvg = this.calculateWeeklyAverage();
        document.getElementById('avg-entries').textContent = weeklyAvg;
        
        // Update top mood
        const topMood = this.getTopMood();
        document.getElementById('fav-mood').textContent = topMood.emoji;

        // Update streak
        const streak = this.calculateStreak();
        document.getElementById('current-streak').textContent = streak;
    }

    updateMoodChart() {
        const moodChart = document.getElementById('mood-chart');
        const moodCounts = this.getMoodDistribution();

        if (Object.keys(moodCounts).length === 0) {
            moodChart.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>Your mood chart will appear here</p>
                </div>
            `;
            return;
        }

        const total = this.entries.length;
        const chartHTML = Object.entries(moodCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([mood, count]) => {
                const percentage = total > 0 ? (count / total) * 100 : 0;
                const emoji = this.getMoodEmoji(mood);
                return `
                    <div class="mood-bar">
                        <span class="mood-bar-emoji">${emoji}</span>
                        <div class="mood-bar-track">
                            <div class="mood-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="mood-bar-percentage">${Math.round(percentage)}%</span>
                    </div>
                `;
            }).join('');

        moodChart.innerHTML = chartHTML;
    }

    getMoodDistribution() {
        const moodCounts = {};
        this.entries.forEach(entry => {
            const mood = entry.mood || 'neutral';
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });
        return moodCounts;
    }

    getTopMood() {
        const moodCounts = this.getMoodDistribution();
        if (Object.keys(moodCounts).length === 0) {
            return { emoji: '😊', count: 0 };
        }

        const topMood = Object.entries(moodCounts).reduce((a, b) => 
            a[1] > b[1] ? a : b
        );

        return { emoji: this.getMoodEmoji(topMood[0]), count: topMood[1] };
    }

    calculateWeeklyAverage() {
        if (this.entries.length === 0) return 0;
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentEntries = this.entries.filter(entry => 
            new Date(entry.entry_date) >= oneWeekAgo
        );
        
        return Math.round(recentEntries.length / 7 * 10) / 10;
    }

    calculateStreak() {
        if (this.entries.length === 0) return 0;

        const dates = [...new Set(this.entries.map(entry => 
            entry.entry_date.split('T')[0]
        ))].sort().reverse();
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < dates.length; i++) {
            const entryDate = new Date(dates[i]);
            entryDate.setHours(0, 0, 0, 0);
            
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - streak);
            expectedDate.setHours(0, 0, 0, 0);

            if (entryDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    // ===== UTILITIES =====
    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('entry-date').value = today;
        
        // Update current date display
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
    }

    updateCharacterCounter(count) {
        const counter = document.getElementById('char-count');
        counter.textContent = `${count} characters`;
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '...';
    }

    // ===== TOAST NOTIFICATIONS =====
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toastId = `toast-${Date.now()}`;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span class="toast-message">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    setLoadingState(loading) {
        const saveBtn = document.getElementById('save-entry');
        if (loading) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        } else {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Entry';
        }
    }

    scrollToNewEntry() {
        document.getElementById('diary-entry').focus();
        document.querySelector('.new-entry-card').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S to save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveEntry();
        }
        
        // Escape to close modal
        if (event.key === 'Escape') {
            this.closeModal();
        }
    }
}

// ===== INITIALIZE APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.dearDiaryApp = new DearDiaryApp();
});
