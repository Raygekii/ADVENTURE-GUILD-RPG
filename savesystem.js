// Save System for Guild Master RPG
class SaveSystem {
    constructor() {
        this.saveKey = 'guildMasterSave';
        this.gameState = null;
    }

    // Initialize or load game state
    initializeGame() {
        const saved = this.loadGame();
        if (saved) {
            this.gameState = saved;
            console.log('Game loaded successfully');
        } else {
            this.gameState = this.createNewGame();
            console.log('New game started');
        }
        return this.gameState;
    }

    // Create a new game state
    createNewGame() {
        return {
            version: "1.0.0",
            timestamp: Date.now(),
            gold: 100,
            influence: 0,
            guildFame: 0,
            totalEarnings: 0,
            lifetimeEarnings: 0,
            prestigeLevel: 0,
            prestigeMultiplier: 1,
            currentLocation: "starter_shack",
            
            // Core game data
            locations: [],
            quests: [],
            adventurers: [],
            
            // Settings
            time: {
                enabled: true,
                timeScale: 1,
                lastUpdate: Date.now()
            },
            
            offlineEarnings: {
                enabled: true,
                maxDuration: 86400000, // 24 hours in ms
                rate: 0.5
            }
        };
    }

    // Save game to localStorage
    saveGame() {
        this.gameState.timestamp = Date.now();
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(this.gameState));
            console.log('Game saved successfully');
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    // Load game from localStorage
    loadGame() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('Game loaded from storage');
                return parsed;
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return null;
    }

    // Export save as downloadable file
    exportSave() {
        const dataStr = JSON.stringify(this.gameState, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `guild_master_save_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Import save from file
    importSave(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSave = JSON.parse(e.target.result);
                this.gameState = importedSave;
                this.saveGame();
                console.log('Game imported successfully');
                location.reload(); // Refresh to apply new save
            } catch (error) {
                console.error('Invalid save file:', error);
                alert('Invalid save file!');
            }
        };
        reader.readAsText(file);
    }

    // Calculate offline earnings
    calculateOfflineEarnings() {
        if (!this.gameState.offlineEarnings.enabled) return 0;

        const now = Date.now();
        const lastPlayed = this.gameState.timestamp;
        const offlineTime = Math.min(now - lastPlayed, this.gameState.offlineEarnings.maxDuration);
        
        if (offlineTime < 30000) return 0; // Less than 30 seconds, no earnings

        // Simple offline earnings calculation
        const earnings = offlineTime * this.gameState.offlineEarnings.rate / 1000;
        return Math.floor(earnings);
    }

    // Apply offline earnings
    applyOfflineEarnings() {
        const earnings = this.calculateOfflineEarnings();
        if (earnings > 0) {
            this.gameState.gold += earnings;
            this.gameState.totalEarnings += earnings;
            this.gameState.lifetimeEarnings += earnings;
            console.log(`Offline earnings: ${earnings} gold`);
            return earnings;
        }
        return 0;
    }
}

// Create global instance
const saveSystem = new SaveSystem();
