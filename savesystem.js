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
            this.gameState = this.migrateSave(saved);
            console.log('Game loaded successfully');
        } else {
            this.gameState = this.createNewGame();
            console.log('New game started');
        }
        
        // Initialize quest system with saved data
        this.initializeQuestsFromSave();
        
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

    // Migrate old save data to new format
    migrateSave(saved) {
        // Ensure all required fields exist
        const migrated = { ...this.createNewGame(), ...saved };
        
        // Migrate quest data
        if (saved.quests && saved.quests.length > 0) {
            migrated.quests = saved.quests;
        } else {
            migrated.quests = this.getDefaultQuestData();
        }
        
        // Migrate adventurers
        if (!saved.adventurers) {
            migrated.adventurers = [];
        }
        
        return migrated;
    }

    // Get default quest data
    getDefaultQuestData() {
        return [
            {
                id: "goblin_patrol",
                name: "Goblin Patrol",
                locationId: "starter_shack",
                description: "Clear goblins from the forest path",
                baseGoldReward: 25,
                level: 0,
                upgradeCost: 35,
                goldPerUpgrade: 2,
                baseTimeMs: 8000,
                running: false,
                timeRemainingMs: 0,
                managerHired: false,
                managerId: null,
                costGrowth: 1.35,
                unlocked: true,
                unlockCost: 0
            },
            {
                id: "herb_collection",
                name: "Herb Collection",
                locationId: "starter_shack", 
                description: "Gather medicinal herbs for the town healer",
                baseGoldReward: 15,
                level: 0,
                upgradeCost: 25,
                goldPerUpgrade: 1.5,
                baseTimeMs: 5000,
                running: false,
                timeRemainingMs: 0,
                managerHired: false,
                managerId: null,
                costGrowth: 1.3,
                unlocked: true,
                unlockCost: 50
            },
            {
                id: "rat_extermination",
                name: "Rat Extermination", 
                locationId: "starter_shack",
                description: "Clear rats from the town cellar",
                baseGoldReward: 10,
                level: 0,
                upgradeCost: 20,
                goldPerUpgrade: 1,
                baseTimeMs: 4000,
                running: false,
                timeRemainingMs: 0,
                managerHired: false,
                managerId: null,
                costGrowth: 1.25,
                unlocked: false,
                unlockCost: 30
            }
        ];
    }

    // Initialize quest system with saved data
    initializeQuestsFromSave() {
        if (this.gameState.quests && this.gameState.quests.length > 0) {
            questSystem.quests = this.gameState.quests;
        }
    }

    // Save game to localStorage
    saveGame() {
        try {
            // Update game state with current quest data
            this.gameState.quests = questSystem.quests;
            this.gameState.adventurers = adventurerSystem.adventurers;
            this.gameState.timestamp = Date.now();
            
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
        this.saveGame(); // Save current state first
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
                this.gameState = this.migrateSave(importedSave);
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

        // Calculate earnings based on managed quests
        let totalEarnings = 0;
        questSystem.quests.forEach(quest => {
            if (quest.managerHired && quest.running) {
                const questEarnings = questSystem.calculateQuestReward(quest.id);
                const completions = Math.floor(offlineTime / quest.baseTimeMs);
                totalEarnings += completions * questEarnings;
            }
        });

        // Add base offline earnings
        const baseEarnings = offlineTime * this.gameState.offlineEarnings.rate / 1000;
        return Math.floor(totalEarnings + baseEarnings);
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
