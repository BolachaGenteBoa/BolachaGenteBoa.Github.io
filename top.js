// === CONFIGURAÇÕES E TELAS ===
const screens = { 
    menu: document.getElementById('main-menu'), 
    comm: document.getElementById('community-tab'), 
    editor: document.getElementById('level-editor'),
    rank: document.getElementById('rank-tab')
};

let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nickname = localStorage.getItem('nickname') || "";
let communityLevels = JSON.parse(localStorage.getItem('communityLevels')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let isPlaying = false, selectedTool = null, keys = {}, collisionMap = [];
let px = 0, py = 0, vx = 0, vy = 0;

// === ATUALIZAÇÃO DA INTERFACE ===
function updateUI() {
    const coinSpan = document.getElementById('coin-value');
    const nameSpan = document.getElementById('user-name');
    if(coinSpan) coinSpan.innerText = coins;
    if(nameSpan) {
        nameSpan.innerHTML = nickname || "...";
        if (nickname === "Bolacha") nameSpan.innerHTML += ' <span class="badge-dono">DONO</span>';
    }
    localStorage.setItem('coins', coins);
}

function navigate(target) {
    isPlaying = false;
    document.getElementById('player').classList.add('hidden');
    Object.values(screens).forEach(s => s?.classList.add('hidden'));
    target?.classList.remove('hidden');
}

// === LÓGICA DO EDITOR (CRIAR MAPA) ===
function initGrid() {
    const canvas = document.getElementById('grid-canvas');
    if(!canvas) return;
    canvas.innerHTML = '<div id="player" class="hidden"></div>'; 
    
    for (let i = 0; i < 300; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.onclick = () => {
            if (isPlaying) return;
            let cost = (selectedTool === 'block' || selectedTool === 'lava') ? 5 : 0;
            if (selectedTool === 'sell') {
                if (cell.classList.contains('block') || cell.classList.contains('lava')) coins += 5;
                cell.className = 'cell';
            } else if (selectedTool && coins >= cost) {
                if (selectedTool === 'spawn' || selectedTool === 'flag') {
                    document.querySelector(`.cell.${selectedTool}`)?.classList.remove(selectedTool);
                }
                if (!cell.classList.contains(selectedTool)) {
                    coins -= cost;
                    cell.className = 'cell ' + selectedTool;
                }
            }
            updateUI();
        };
        canvas.appendChild(cell);
    }
}

// === EVENTOS E BOTÕES ===
window.onload = () => {
    updateUI();
    document.getElementById('btn-create').onclick = () => { initGrid(); navigate(screens.editor); };
    document.getElementById('btn-rank').onclick = () => { navigate(screens.rank); renderRank(); };
    document.getElementById('btn-back-rank').onclick = () => navigate(screens.menu);
    
    document.querySelectorAll('.tool').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
            t.classList.add('active');
            selectedTool = t.dataset.type;
        };
    });

    document.getElementById('btn-save-nick').onclick = () => {
        nickname = document.getElementById('nick-input').value.trim();
        if (nickname.length >= 2) {
            localStorage.setItem('nickname', nickname);
            document.getElementById('nick-modal').classList.add('hidden');
            updateUI();
        }
    };
};

function renderRank() {
    const list = document.getElementById('rank-list');
    if(!list) return;
    list.innerHTML = leaderboard.sort((a,b) => b.coins - a.coins).slice(0,5).map((u, i) => 
        `<div style="padding:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between;">
            <span>#${i+1} ${u.name}</span> <span>💰 ${u.coins}</span>
        </div>`
    ).join('');
}
