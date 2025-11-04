// Quest System for Guild Master RPG
class QuestSystem {
    constructor() {
        this.quests = [];
        this.initializeDefaultQuests();
    }

    // Create default starter quests
    initializeDefaultQuests() {
        this.quests = [
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

    // Get all quests for a specific location
    getQuestsByLocation(locationId) {
        return this.quests.filter(quest => quest.locationId === locationId);
    }

    // Get a specific quest by ID
    getQuest(questId) {
        return this.quests.find(quest => quest.id === questId);
    }

    // Start a quest manually
    startQuest(questId) {
        const quest = this.getQuest(questId);
        if (quest && !quest.running) {
            quest.running = true;
            quest.timeRemainingMs = quest.baseTimeMs;
            return true;
        }
        return false;
    }

    // Complete a quest and give rewards
completeQuest(questId) {
    const quest = this.getQuest(questId);
    if (quest && quest.running) {
        quest.running = false;
        
        // Calculate reward based on level
        const reward = this.calculateQuestReward(questId);
        
        // Update game state
        if (typeof saveSystem !== 'undefined' && saveSystem.gameState) {
            saveSystem.gameState.gold += reward;
            saveSystem.gameState.totalEarnings += reward;
            saveSystem.gameState.lifetimeEarnings += reward;
        }
        
        console.log(`Quest completed! Reward: ${reward} gold`);
        
        // If manager is hired, automatically restart
        if (quest.managerHired) {
            setTimeout(() => {
                quest.running = true;
                quest.timeRemainingMs = quest.baseTimeMs;
                console.log(`Manager automatically restarted ${quest.name}`);
            }, 100);
        }
        
        return reward;
    }
    return 0;
}

    // Calculate quest reward
    calculateQuestReward(questId) {
        const quest = this.getQuest(questId);
        if (quest) {
            return Math.floor(quest.baseGoldReward + (quest.level * quest.goldPerUpgrade));
        }
        return 0;
    }

    // Upgrade a quest
    upgradeQuest(questId) {
        const quest = this.getQuest(questId);
        if (quest && saveSystem.gameState.gold >= quest.upgradeCost) {
            saveSystem.gameState.gold -= quest.upgradeCost;
            quest.level++;
            
            // Increase next upgrade cost
            quest.upgradeCost = Math.floor(quest.upgradeCost * quest.costGrowth);
            
            console.log(`Quest upgraded to level ${quest.level}`);
            return true;
        }
        return false;
    }

    // Hire a manager for a quest
    hireManager(questId, adventurerId) {
        const quest = this.getQuest(questId);
        if (quest) {
            quest.managerHired = true;
            quest.managerId = adventurerId;
            quest.running = true; // Auto-start when manager is hired
            return true;
        }
        return false;
    }

    // Update quest timers
    updateQuestTimers(deltaTime) {
        this.quests.forEach(quest => {
            if (quest.running) {
                quest.timeRemainingMs -= deltaTime;
                
                if (quest.timeRemainingMs <= 0) {
                    this.completeQuest(quest.id);
                    // If manager is hired, automatically restart
                    if (quest.managerHired) {
                        quest.timeRemainingMs = quest.baseTimeMs;
                    }
                }
            }
        });
    }

    // Get quest progress percentage
    getQuestProgress(questId) {
        const quest = this.getQuest(questId);
        if (quest && quest.running) {
            return 100 - ((quest.timeRemainingMs / quest.baseTimeMs) * 100);
        }
        return 0;
    }
}

// Create global instance
const questSystem = new QuestSystem();
