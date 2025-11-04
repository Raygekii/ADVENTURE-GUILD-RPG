// Main Game Engine for Guild Master RPG
class GameEngine {
    constructor() {
        this.isRunning = false;
        this.lastUpdateTime = 0;
        this.gameState = null;
        this.ui = new GameUI();
    }

    // Initialize the game
    initialize() {
        console.log('Initializing Guild Master RPG...');
        
        // Load game state
        this.gameState = saveSystem.initializeGame();
        
        // Apply offline earnings
        const offlineEarnings = saveSystem.applyOfflineEarnings();
        if (offlineEarnings > 0) {
            this.ui.showNotification(`Welcome back! You earned ${offlineEarnings} gold while away.`);
        }
        
        // Initialize UI
        this.ui.initialize();
        
        // Start game loop
        this.startGameLoop();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Game initialized successfully!');
    }

    // Start the main game loop
    startGameLoop() {
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    // Main game loop
    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        
        // Update game systems
        this.update(deltaTime);
        
        // Update UI
        this.ui.update();
        
        this.lastUpdateTime = currentTime;
        
        // Continue the loop
        requestAnimationFrame(() => this.gameLoop());
    }

    // Update game state
    update(deltaTime) {
        // Apply time scaling
        const scaledDeltaTime = deltaTime * this.gameState.time.timeScale;
        
        // Update quest timers
        questSystem.updateQuestTimers(scaledDeltaTime);
        
        // Auto-save every 30 seconds
        if (currentTime - this.lastSaveTime > 30000) {
            saveSystem.saveGame();
            this.lastSaveTime = currentTime;
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Save/Load buttons
        document.getElementById('save-game').addEventListener('click', () => {
            if (saveSystem.saveGame()) {
                this.ui.showNotification('Game saved!');
            }
        });

        document.getElementById('load-game').addEventListener('click', () => {
            location.reload();
        });

        document.getElementById('export-save').addEventListener('click', () => {
            saveSystem.exportSave();
            this.ui.showNotification('Save file exported!');
        });

        document.getElementById('import-save').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => saveSystem.importSave(e);
            input.click();
        });

        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.ui.switchTab(tabName);
            });
        });
    }
}

// UI Management Class
class GameUI {
    constructor() {
        this.currentTab = 'quests';
    }

    // Initialize the UI
    initialize() {
        this.updateResourceDisplay();
        this.updateQuestBoard();
        this.updateAdventurersList();
        this.updateRecruitmentPool();
        this.switchTab('quests');
    }

    // Update the entire UI
    update() {
        this.updateResourceDisplay();
        this.updateActiveQuests();
    }

    // Update resource displays
    updateResourceDisplay() {
        const gameState = saveSystem.gameState;
        document.getElementById('gold').textContent = Math.floor(gameState.gold);
        document.getElementById('influence').textContent = gameState.influence;
        document.getElementById('current-location').textContent = this.getLocationDisplayName(gameState.currentLocation);
    }

    // Get display name for location
    getLocationDisplayName(locationId) {
        const locations = {
            'starter_shack': '🛖 Starter Shack',
            'town_hall': '🏘️ Town Hall Office',
            'fortified_keep': '🏰 Fortified Keep'
        };
        return locations[locationId] || '🛖 Guild Hall';
    }

    // Update the quest board
    updateQuestBoard() {
        const questBoard = document.getElementById('quest-board');
        const quests = questSystem.quests;
        
        questBoard.innerHTML = quests.map(quest => `
            <div class="quest" data-quest-id="${quest.id}">
                <div class="quest-header">
                    <span class="quest-name">${quest.name}</span>
                    <span class="quest-reward">${questSystem.calculateQuestReward(quest.id)} gold</span>
                </div>
                <div class="quest-description">${quest.description}</div>
                <div class="quest-info">
                    Level: ${quest.level} | Time: ${quest.baseTimeMs/1000}s
                    ${!quest.unlocked ? ` | Unlock: ${quest.unlockCost} gold` : ''}
                </div>
                ${quest.running ? `
                    <div class="quest-progress">
                        <div class="progress-bar" style="width: ${questSystem.getQuestProgress(quest.id)}%"></div>
                    </div>
                ` : ''}
                <div class="quest-controls">
                    ${quest.unlocked ? `
                        ${!quest.running && !quest.managerHired ? 
                            `<button onclick="game.startQuest('${quest.id}')" class="start-btn">Start Quest</button>` : ''}
                        <button onclick="game.upgradeQuest('${quest.id}')" class="upgrade">Upgrade (${quest.upgradeCost} gold)</button>
                        ${!quest.managerHired ? 
                            `<button onclick="game.ui.showManagerAssignment('${quest.id}')" class="hire">Assign Manager</button>` : 
                            `<span>🤵 Managed</span>`}
                    ` : `
                        <button onclick="game.unlockQuest('${quest.id}')" class="upgrade">Unlock (${quest.unlockCost} gold)</button>
                    `}
                </div>
            </div>
        `).join('');
    }

    // Update active quests display
    updateActiveQuests() {
        const activeQuestsContainer = document.getElementById('active-quests');
        const activeQuests = questSystem.quests.filter(quest => quest.running);
        
        if (activeQuests.length === 0) {
            activeQuestsContainer.innerHTML = '<p>No active quests. Visit the Quest Board to start one!</p>';
            return;
        }

        activeQuestsContainer.innerHTML = activeQuests.map(quest => `
            <div class="quest active-quest">
                <div class="quest-header">
                    <span class="quest-name">${quest.name}</span>
                    <span class="quest-reward">${questSystem.calculateQuestReward(quest.id)} gold</span>
                </div>
                <div class="quest-progress">
                    <div class="progress-bar" style="width: ${questSystem.getQuestProgress(quest.id)}%"></div>
                </div>
                <div class="quest-time">Time left: ${Math.ceil(quest.timeRemainingMs/1000)}s</div>
            </div>
        `).join('');
    }

    // Update adventurers list
    updateAdventurersList() {
        const adventurersList = document.getElementById('adventurers-list');
        const adventurers = adventurerSystem.adventurers;
        
        if (adventurers.length === 0) {
            adventurersList.innerHTML = '<p>No adventurers hired yet. Visit Recruitment to hire some!</p>';
            return;
        }

        adventurersList.innerHTML = adventurers.map(adv => `
            <div class="adventurer" data-adventurer-id="${adv.id}">
                <div class="adventurer-header">
                    <span class="adventurer-name">${adv.name}</span>
                    <span class="adventurer-class">${adv.specialization} ${adv.class}</span>
                </div>
                <div class="adventurer-stats">
                    STR: ${adv.stats.strength} | AGI: ${adv.stats.agility} | INT: ${adv.stats.intellect} | CHA: ${adv.stats.charisma}
                </div>
                <div class="adventurer-assignment">
                    ${adv.assignedQuestId ? 
                        `Assigned to: ${questSystem.getQuest(adv.assignedQuestId)?.name || 'Unknown Quest'}` : 
                        'Unassigned'}
                </div>
                <div class="adventurer-social">
                    Affection: ${adv.social.affection} | Loyalty: ${adv.social.loyalty}
                </div>
                <div class="adventurer-controls">
                    <button onclick="game.ui.showAssignmentModal('${adv.id}')">Assign Quest</button>
                    <button onclick="game.ui.showGiftModal('${adv.id}')">Give Gift</button>
                </div>
            </div>
        `).join('');
    }

    // Update recruitment pool
    updateRecruitmentPool() {
        const recruitmentPool = document.getElementById('recruitment-pool');
        const pool = adventurerSystem.recruitmentPool;
        
        recruitmentPool.innerHTML = pool.map(adv => `
            <div class="adventurer recruit">
                <div class="adventurer-header">
                    <span class="adventurer-name">${adv.name}</span>
                    <span class="adventurer-class">${adv.specialization} ${adv.class}</span>
                </div>
                <div class="adventurer-bio">${adv.bio}</div>
                <div class="adventurer-stats">
                    STR: ${adv.stats.strength} | AGI: ${adv.stats.agility} | INT: ${adv.stats.intellect} | CHA: ${adv.stats.charisma}
                </div>
                <div class="adventurer-traits">
                    Traits: ${adv.personalityTraits.join(', ')}
                </div>
                <div class="adventurer-controls">
                    <button onclick="game.hireAdventurer('${adv.id}')" class="hire">
                        Hire (${adv.hireCost} gold)
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Switch between tabs
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === tabName);
        });

        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;
        
        // Refresh tab content
        switch(tabName) {
            case 'quests':
                this.updateQuestBoard();
                break;
            case 'adventurers':
                this.updateAdventurersList();
                break;
            case 'recruitment':
                this.updateRecruitmentPool();
                break;
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Simple notification system - you can enhance this later
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message); // Temporary - replace with better UI later
    }

    // Show manager assignment modal (simplified)
    showManagerAssignment(questId) {
        const availableAdventurers = adventurerSystem.adventurers.filter(adv => !adv.assignedQuestId);
        
        if (availableAdventurers.length === 0) {
            this.showNotification('No available adventurers to assign!');
            return;
        }

        const adventurer = availableAdventurers[0]; // Simple assignment for now
        if (adventurerSystem.assignToQuest(adventurer.id, questId)) {
            this.showNotification(`Assigned ${adventurer.name} to manage ${questSystem.getQuest(questId).name}`);
            this.updateQuestBoard();
            this.updateAdventurersList();
        }
    }
}

// Game instance and global functions
const game = new GameEngine();

// Global functions for HTML onclick events
window.startQuest = (questId) => {
    if (questSystem.startQuest(questId)) {
        game.ui.showNotification(`Started ${questSystem.getQuest(questId).name}`);
        game.ui.updateQuestBoard();
    }
};

window.upgradeQuest = (questId) => {
    if (questSystem.upgradeQuest(questId)) {
        game.ui.showNotification(`Upgraded ${questSystem.getQuest(questId).name}`);
        game.ui.updateQuestBoard();
        game.ui.updateResourceDisplay();
    } else {
        game.ui.showNotification('Not enough gold!', 'error');
    }
};

window.unlockQuest = (questId) => {
    const quest = questSystem.getQuest(questId);
    if (saveSystem.gameState.gold >= quest.unlockCost) {
        saveSystem.gameState.gold -= quest.unlockCost;
        quest.unlocked = true;
        game.ui.showNotification(`Unlocked ${quest.name}`);
        game.ui.updateQuestBoard();
        game.ui.updateResourceDisplay();
        saveSystem.saveGame();
    } else {
        game.ui.showNotification('Not enough gold!', 'error');
    }
};

window.hireAdventurer = (adventurerId) => {
    if (adventurerSystem.hireAdventurer(adventurerId)) {
        game.ui.showNotification('Adventurer hired!');
        game.ui.updateRecruitmentPool();
        game.ui.updateResourceDisplay();
        saveSystem.saveGame();
    } else {
        game.ui.showNotification('Not enough gold!', 'error');
    }
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game.initialize();
});
