// Save System for Guild Master RPG
class SaveSystem {
    constructor() {
        this.saveKey = 'guildMasterSave';
        this.gameState = null;
    }

    // Initialize game state - ALWAYS start fresh
    initializeGame() {
        // Don't load from localStorage anymore
        this.gameState = this.createNewGame();
        console.log('New game started');
        
        // Initialize quest system with fresh data
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
                enabled: false, // Disable offline earnings since we're not auto-saving
                maxDuration: 86400000,
                rate: 0.5
            }
        };
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
        } else {
            questSystem.quests = this.getDefaultQuestData();
        }
    }

    // Save game - prepare data for download
    saveGame() {
        try {
            // Update game state with current data
            this.gameState.quests = questSystem.quests;
            this.gameState.adventurers = adventurerSystem.adventurers;
            this.gameState.timestamp = Date.now();
            
            console.log('Game state prepared for saving');
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    // Export save as downloadable file
    exportSave() {
        try {
            // First prepare the data
            this.saveGame();
            
            // Create downloadable file
            const dataStr = JSON.stringify(this.gameState, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `guild_master_save_${Date.now()}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            console.log('Game saved to file!');
            alert('Save file downloaded! Check your downloads folder.');
            return true;
        } catch (e) {
            console.error('Failed to export game:', e);
            alert('Failed to download save file!');
            return false;
        }
    }

    // Load game from file
    loadGame(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedSave = JSON.parse(e.target.result);
                    this.gameState = this.migrateSave(importedSave);
                    
                    // Update game systems with loaded data
                    questSystem.quests = this.gameState.quests || this.getDefaultQuestData();
                    adventurerSystem.adventurers = this.gameState.adventurers || [];
                    
                    console.log('Game loaded successfully');
                    resolve(true);
                } catch (error) {
                    console.error('Invalid save file:', error);
                    reject('Invalid save file!');
                }
            };
            reader.readAsText(file);
        });
    }

    // Migrate save data if needed
    migrateSave(saved) {
        // Ensure all required fields exist
        const migrated = { ...this.createNewGame(), ...saved };
        
        // Ensure quests exist
        if (!migrated.quests || migrated.quests.length === 0) {
            migrated.quests = this.getDefaultQuestData();
        }
        
        // Ensure adventurers exist
        if (!migrated.adventurers) {
            migrated.adventurers = [];
        }
        
        return migrated;
    }

    // Import save from file
    importSave(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.loadGame(file).then(success => {
            if (success) {
                // Refresh the UI to show loaded data
                if (game && game.ui) {
                    game.ui.updateResourceDisplay();
                    game.ui.updateQuestBoard();
                    game.ui.updateAdventurersList();
                    game.ui.updateRecruitmentPool();
                    alert('Game loaded successfully!');
                }
            }
        }).catch(error => {
            alert(error);
        });
    }

    // Remove offline earnings since we're not auto-saving
    calculateOfflineEarnings() {
        return 0;
    }

    applyOfflineEarnings() {
        return 0;
    }
}

// Create global instance
const saveSystem = new SaveSystem();
