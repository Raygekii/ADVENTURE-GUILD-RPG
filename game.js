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
        
        // Load game state - always fresh start
        this.gameState = saveSystem.initializeGame();
        
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
        const scaledDeltaTime = deltaTime * (this.gameState?.time?.timeScale || 1);
        
        // Update quest timers ONLY
        if (typeof questSystem !== 'undefined') {
            questSystem.updateQuestTimers(scaledDeltaTime);
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Export button - download save file
        document.getElementById('export-save').addEventListener('click', () => {
            saveSystem.saveGame(); // Prepare the data
            saveSystem.exportSave(); // Download the file
        });

        // Import button - loads from file
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
        this.updateQuestProgressBars(); // Update progress bars in real-time
    }

    // Update resource displays
    updateResourceDisplay() {
        const gameState = saveSystem.gameState;
        if (!gameState) return;
        
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
        if (!questBoard || typeof questSystem === 'undefined') return;
        
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
                        <div class="progress-bar" id="progress-${quest.id}" style="width: ${questSystem.getQuestProgress(quest.id)}%"></div>
                    </div>
                    <div class="quest-time">Time left: ${Math.ceil(quest.timeRemainingMs/1000)}s</div>
                ` : ''}
                <div class="quest-controls">
                    ${quest.unlocked ? `
                    ${!quest.running && !quest.managerHired ? 
                        `<button onclick="startQuest('${quest.id}')" class="start-btn">Start Quest</button>` : ''}
                        <button onclick="upgradeQuest('${quest.id}')" class="upgrade">Upgrade (${quest.upgradeCost} gold)</button>
                        ${!quest.managerHired ? 
                            `<button onclick="showManagerAssignment('${quest.id}')" class="hire">Assign Manager</button>` : 
                            `<span>🤵 Managed</span>`}
                    ` : `
                        <button onclick="unlockQuest('${quest.id}')" class="upgrade">Unlock (${quest.unlockCost} gold)</button>
                    `}
                </div>
            </div>
        `).join('');
    }

    // Update progress bars in real-time
    updateQuestProgressBars() {
        if (typeof questSystem === 'undefined') return;
        
        questSystem.quests.forEach(quest => {
            if (quest.running) {
                const progressBar = document.getElementById(`progress-${quest.id}`);
                const progress = questSystem.getQuestProgress(quest.id);
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
                
                // Update time display
                const questElement = document.querySelector(`[data-quest-id="${quest.id}"]`);
                if (questElement) {
                    const timeElement = questElement.querySelector('.quest-time');
                    if (timeElement) {
                        timeElement.textContent = `Time left: ${Math.ceil(quest.timeRemainingMs/1000)}s`;
                    }
                }
            }
        });
    }

    // Update adventurers list
    updateAdventurersList() {
        const adventurersList = document.getElementById('adventurers-list');
        if (!adventurersList || typeof adventurerSystem === 'undefined') return;
        
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
                        `Assigned to: ${questSystem?.getQuest(adv.assignedQuestId)?.name || 'Unknown Quest'}` : 
                        'Unassigned'}
                </div>
                <div class="adventurer-social">
                    Affection: ${adv.social.affection} | Loyalty: ${adv.social.loyalty}
                </div>
                <div class="adventurer-controls">
                    <button onclick="showAssignmentModal('${adv.id}')">Assign Quest</button>
                    <button onclick="showGiftModal('${adv.id}')">Give Gift</button>
                </div>
            </div>
        `).join('');
    }

    // Update recruitment pool
    updateRecruitmentPool() {
        const recruitmentPool = document.getElementById('recruitment-pool');
        if (!recruitmentPool || typeof adventurerSystem === 'undefined') return;
        
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
                    <button onclick="hireAdventurer('${adv.id}')" class="hire">
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
            case 'expansion':
                document.getElementById('locations-list').innerHTML = '<p>Expansion content coming soon!</p>';
                break;
            case 'legacy':
                document.getElementById('prestige-info').innerHTML = '<p>Legacy content coming soon!</p>';
                break;
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Game instance
const game = new GameEngine();

// Global functions for HTML onclick events
function startQuest(questId) {
    if (questSystem.startQuest(questId)) {
        game.ui.showNotification(`Started ${questSystem.getQuest(questId).name}`);
        game.ui.updateQuestBoard();
    }
}

function upgradeQuest(questId) {
    if (questSystem.upgradeQuest(questId)) {
        game.ui.showNotification(`Upgraded ${questSystem.getQuest(questId).name}`);
        game.ui.updateQuestBoard();
        game.ui.updateResourceDisplay();
    } else {
        game.ui.showNotification('Not enough gold!', 'error');
    }
}

function unlockQuest(questId) {
    const quest = questSystem.getQuest(questId);
    if (saveSystem.gameState.gold >= quest.unlockCost) {
        saveSystem.gameState.gold -= quest.unlockCost;
        quest.unlocked = true;
        game.ui.showNotification(`Unlocked ${quest.name}`);
        game.ui.updateQuestBoard();
        game.ui.updateResourceDisplay();
    } else {
        game.ui.showNotification('Not enough gold!', 'error');
    }
}

function hireAdventurer(adventurerId) {
    if (adventurerSystem.hireAdventurer(adventurerId)) {
        game.ui.showNotification('Adventurer hired!');
        game.ui.updateRecruitmentPool();
        game.ui.updateResourceDisplay();
    } else {
        game.ui.showNotification('Not enough gold!', 'error');
    }
}

function showManagerAssignment(questId) {
    const availableAdventurers = adventurerSystem.adventurers.filter(adv => !adv.assignedQuestId);
    
    if (availableAdventurers.length === 0) {
        game.ui.showNotification('No available adventurers to assign! Hire some adventurers first.', 'error');
        return;
    }

    // Let player choose which adventurer to assign
    if (availableAdventurers.length === 1) {
        // Only one available, assign them automatically
        const adventurer = availableAdventurers[0];
        assignManagerToQuest(adventurer.id, questId);
    } else {
        // Multiple available, show selection (simple version for now)
        const adventurer = availableAdventurers[0]; // Assign first one for now
        assignManagerToQuest(adventurer.id, questId);
    }
}

function assignManagerToQuest(adventurerId, questId) {
    const adventurer = adventurerSystem.getAdventurer(adventurerId);
    const quest = questSystem.getQuest(questId);
    
    if (adventurer && quest) {
        // Assign adventurer to quest
        adventurer.assignedQuestId = questId;
        
        // Hire manager in quest system
        quest.managerHired = true;
        quest.managerId = adventurerId;
        quest.running = true;
        quest.timeRemainingMs = quest.baseTimeMs;
        
        game.ui.showNotification(`🤵 ${adventurer.name} is now managing ${quest.name}! Quest started automatically.`);
        game.ui.updateQuestBoard();
        game.ui.updateAdventurersList();
    }
}

function showAssignmentModal(adventurerId) {
    game.ui.showNotification('Assignment feature coming soon!');
}

function showGiftModal(adventurerId) {
    game.ui.showNotification('Gift feature coming soon!');
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game.initialize();
});
