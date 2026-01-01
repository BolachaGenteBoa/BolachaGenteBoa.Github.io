// 1. MAPEAMENTO DE TELAS
const screens = { 
    menu: document.getElementById('main-menu'), 
    comm: document.getElementById('community-tab'), 
    editor: document.getElementById('level-editor'),
    rank: document.getElementById('rank-tab')
};
const mobileControls = document.getElementById('mobile-controls');

// 2. BANCO DE DADOS LOCAL
let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nickname = localStorage.getItem('nickname') || "";
let communityLevels = JSON.parse(localStorage.getItem('communityLevels')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// 3. ESTADO GLOBAL
let isPlaying = false;
let px = 0, py = 0, vx = 0, vy = 0;
const gravity = 0.5, jump = -10, speed = 4;
const keys = {};
let collisionMap = [];
let selectedTool = null;

// 4. ATUALIZAÇÃO DA INTERFACE E CARGOS
function updateUI() {
    const coinSpan = document.getElementById('coin-value');
    const nameSpan = document.getElementById('user-name');
    const adminBtn = document.getElementById('admin-panel-btn');

    if(coinSpan) coinSpan.innerText = coins;
    if(nameSpan) {
        nameSpan.innerHTML = nickname || "...";
        if (nickname === "Bolacha") {
            nameSpan.innerHTML += ' <span class="badge-dono">DONO</span>';
            if(adminBtn) adminBtn.classList.remove('hidden');
        } else {
            if(adminBtn) adminBtn.classList.add('hidden');
        }
    }

    localStorage.setItem('coins', coins);
    localStorage.setItem('nickname', nickname);
    
    if(nickname) {
        let user = leaderboard.find(u => u.name === nickname);
        if(user) user.coins = coins; 
        else leaderboard.push({name: nickname, coins: coins});
        leaderboard.sort((a,b) => b.coins - a.coins);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

// 5. NAVEGAÇÃO ENTRE TELAS
function navigate(target) {
    if(!target) return;
    isPlaying = false;
    document.getElementById('player').classList.add('hidden');
    Object.values(screens).forEach(s => { if(s) s.classList.add('hidden'); });
    target.classList.remove('hidden');
    
    if(target === screens.editor) {
        mobileControls?.classList.remove('hidden');
        document.getElementById('editor-sidebar').style.display = 'flex';
    } else {
        mobileControls?.classList.add('hidden');
    }
}

// 6. INICIALIZAÇÃO (WINDOW ONLOAD)
window.onload = () => {
    updateUI();
    if (!nickname) document.getElementById('nick-modal')?.classList.remove('hidden');

    // Botão Ranking
    document.getElementById('btn-rank').onclick = () => {
        const list = document.getElementById('rank-list');
        if(list) {
            list.innerHTML = '';
            leaderboard.slice(0, 10).forEach((u, i) => {
                const item = document.createElement('div');
                item.style = "background:rgba(20,20,50,0.8); padding:10px; margin:5px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid #00f2ff;";
                let badge = u.name === "Bolacha" ? '<span class="badge-dono">DONO</span>' : '';
                item.innerHTML = `<span>#${i+1} ${u.name}${badge}</span> <span>💰 ${u.coins}</span>`;
                list.appendChild(item);
            });
        }
        navigate(screens.rank);
    };

    // Botões de Voltar e Menus
    document.getElementById('btn-back-rank').onclick = () => navigate(screens.menu);
    document.getElementById('btn-back-comm').onclick = () => navigate(screens.menu);
    document.getElementById('btn-create').onclick = () => { initGrid(); navigate(screens.editor); };
    document.getElementById('btn-play').onclick = () => { renderComm(); navigate(screens.comm); };

    // Salvar Nick
    document.getElementById('btn-save-nick').onclick = () => {
        const val = document.getElementById('nick-input').value.trim();
        if (val.length >= 2) {
            nickname = val;
            localStorage.setItem('nickname', nickname);
            document.getElementById('nick-modal').classList.add('hidden');
            updateUI();
        }
    };

    // Publicar
    document.getElementById('publish-btn').onclick = () => {
        const s = document.querySelector('.cell.spawn'), f = document.querySelector('.cell.flag');
        if (!s || !f) return alert("Coloque Spawn e Meta!");
        const mapData = Array.from(document.querySelectorAll('.cell')).map(c => c.className);
        communityLevels.push({ author: nickname, map: mapData });
        updateUI(); alert("Nível Publicado!"); navigate(screens.menu);
    };

    // Ferramentas do Editor
    document.querySelectorAll('.tool').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
            t.classList.add('active');
            selectedTool = t.dataset.type;
        };
    });
};

// 7. LÓGICA DO EDITOR (GRID)
function initGrid() {
    const canvas = document.getElementById('grid-canvas');
    const player = document.getElementById('player');
    canvas.innerHTML = ''; canvas.appendChild(player);
    for (let i = 0; i < 300; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.onclick = () => {
            if (isPlaying) return;
            const cost = (selectedTool === 'block' || selectedTool === 'lava') ? 5 : 0;
            if (selectedTool === 'sell') {
                if (cell.classList.contains('block') || cell.classList.contains('lava')) coins += 5;
                cell.className = 'cell';
            } else if (selectedTool) {
                if (coins >= cost)
