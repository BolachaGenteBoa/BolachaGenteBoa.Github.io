let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nickname = localStorage.getItem('nickname') || "";
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let selectedTool = null;

const screens = { 
    menu: document.getElementById('main-menu'), 
    rank: document.getElementById('rank-tab'),
    editor: document.getElementById('level-editor')
};

function navigate(target) {
    Object.values(screens).forEach(s => s?.classList.add('hidden'));
    if(target) target.classList.remove('hidden');
}

function updateUI() {
    const c = document.getElementById('coin-value');
    const n = document.getElementById('user-name');
    if(c) c.innerText = coins;
    if(n) {
        n.innerHTML = nickname || "...";
        if(nickname === "Bolacha") n.innerHTML += ' <span class="badge-dono">DONO</span>';
    }
    localStorage.setItem('coins', coins);
}

function initGrid() {
    const canvas = document.getElementById('grid-canvas');
    if(!canvas) return;
    canvas.innerHTML = '<div id="player" class="hidden"></div>'; 
    for (let i = 0; i < 300; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.onclick = () => {
            let cost = (selectedTool === 'block' || selectedTool === 'lava') ? 5 : 0;
            if (selectedTool === 'sell') {
                if (cell.classList.contains('block') || cell.classList.contains('lava')) coins += 5;
                cell.className = 'cell';
            } else if (selectedTool && coins >= cost) {
                if (selectedTool === 'spawn' || selectedTool === 'flag') {
                    document.querySelector('.'+selectedTool)?.classList.remove(selectedTool);
                }
                cell.className = 'cell ' + selectedTool;
                coins -= cost;
            }
            updateUI();
        };
        canvas.appendChild(cell);
    }
}

window.onload = () => {
    updateUI();
    document.getElementById('btn-create').onclick = () => { initGrid(); navigate(screens.editor); };
    document.getElementById('btn-rank').onclick = () => {
        const list = document.getElementById('rank-list');
        if(list) list.innerHTML = leaderboard.sort((a,b)=>b.coins-a.coins).slice(0,5).map((u,i)=>`<div>#${i+1} ${u.name} - ${u.coins}</div>`).join('');
        navigate(screens.rank);
    };
    document.getElementById('btn-back-rank').onclick = () => navigate(screens.menu);
    
    document.querySelectorAll('.tool').forEach(t => t.onclick = () => {
        document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
        t.classList.add('active');
        selectedTool = t.dataset.type;
    });

    document.getElementById('btn-save-nick').onclick = () => {
        const val = document.getElementById('nick-input').value;
        if(val.length > 1) {
            nickname = val;
            localStorage.setItem('nickname', nickname);
            document.getElementById('nick-modal').classList.add('hidden');
            updateUI();
        }
    };
};
