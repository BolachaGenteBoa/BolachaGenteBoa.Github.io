// CONFIGURAÇÕES INICIAIS E TELAS
const screens = { 
    menu: document.getElementById('main-menu'), 
    comm: document.getElementById('community-tab'), 
    editor: document.getElementById('level-editor'),
    rank: document.getElementById('rank-tab')
};
const mobileControls = document.getElementById('mobile-controls');

// BANCO DE DADOS LOCAL
let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nickname = localStorage.getItem('nickname') || "";
let communityLevels = JSON.parse(localStorage.getItem('communityLevels')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// ESTADO DO JOGO
let isPlaying = false;
let px = 0, py = 0, vx = 0, vy = 0;
const gravity = 0.5, jump = -10, speed = 4;
const keys = {};
let collisionMap = [];
let selectedTool = null;

// --- INICIALIZAÇÃO DE EVENTOS (BOTÕES) ---
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    if (!nickname) document.getElementById('nick-modal').classList.remove('hidden');

    // Botão Ranking
    const btnRank = document.getElementById('btn-rank');
    if (btnRank) {
        btnRank.onclick = () => {
            renderRank();
            navigate(screens.rank);
        };
    }

    // Botão Voltar Ranking
    const btnBackRank = document.getElementById('btn-back-rank');
    if (btnBackRank) btnBackRank.onclick = () => navigate(screens.menu);

    // Botão Publicar Nível
    const btnPublish = document.getElementById('publish-btn');
    if (btnPublish) {
        btnPublish.onclick = () => {
            const s = document.querySelector('.cell.spawn');
            const f = document.querySelector('.cell.flag');
            if (!s || !f) return alert("ERRO: Coloque um SPAWN e uma META!");
            
            const mapData = Array.from(document.querySelectorAll('.cell')).map(c => c.className);
            communityLevels.push({ author: nickname, map: mapData });
            updateUI(); 
            alert("NÍVEL PUBLICADO COM SUCESSO!"); 
            navigate(screens.menu);
        };
    }

    // Navegação Básica
    document.getElementById('btn-create').onclick = () => { initGrid(); navigate(screens.editor); };
    document.getElementById('btn-play').onclick = () => { renderComm(); navigate(screens.comm); };
    document.getElementById('btn-back-comm').onclick = () => navigate(screens.menu);
    
    // Ferramentas do Editor
    document.querySelectorAll('.tool').forEach(t => {
        t.onclick = () => {
            document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
            t.classList.add('active');
            selectedTool = t.dataset.type;
        };
    });
});

// --- SISTEMA DE UI E CARGOS ---
function updateUI() {
    const coinSpan = document.getElementById('coin-value');
    const nameSpan = document.getElementById('user-name');
    
    if(coinSpan) coinSpan.innerText = coins;
    
    if(nameSpan) {
        nameSpan.innerHTML = nickname || "...";
        // CARGO DONO PARA "Bolacha"
        if (nickname === "Bolacha") {
            nameSpan.innerHTML += ' <span class="badge-dono">DONO</span>';
            document.getElementById('admin-panel-btn').classList.remove('hidden');
        } else {
            document.getElementById('admin-panel-btn').classList.add('hidden');
        }
    }

    localStorage.setItem('coins', coins);
    localStorage.setItem('communityLevels', JSON.stringify(communityLevels));
    
    // Atualiza Ranking
    if(nickname) {
        let user = leaderboard.find(u => u.name === nickname);
        if(user) user.coins = coins; else leaderboard.push({name: nickname, coins: coins});
        leaderboard.sort((a,b) => b.coins - a.coins);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

// --- RANKING ---
function renderRank() {
    const list = document.getElementById('rank-list');
    if(!list) return;
    list.innerHTML = '';
    leaderboard.slice(0, 10).forEach((u, i) => {
        const item = document.createElement('div');
        item.className = "rank-item";
        item.style = "background:rgba(20,20,50,0.8); padding:12px; margin-bottom:8px; border-radius:8px; display:flex; justify-content:space-between; border:1px solid #00f2ff;";
        let donoBadge = u.name === "Bolacha" ? '<span class="badge-dono">DONO</span>' : '';
        item.innerHTML = `<span>#${i+1} <strong>${u.name}</strong>${donoBadge}</span> <span>💰 ${u.coins}</span>`;
        list.appendChild(item);
    });
}

// --- SALVAR NICK ---
document.getElementById('btn-save-nick').onclick = () => {
    const val = document.getElementById('nick-input').value.trim();
    if (val.length < 2) return alert("Nick muito curto!");
    nickname = val;
    localStorage.setItem('nickname', nickname);
    document.getElementById('nick-modal').classList.add('hidden');
    updateUI();
};

// --- NAVEGAÇÃO ---
function navigate(target) {
    isPlaying = false;
    document.getElementById('player').classList.add('hidden');
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    target.classList.remove('hidden');
    
    if(target === screens.editor) {
        mobileControls.classList.remove('hidden');
        document.getElementById('editor-sidebar').style.display = 'flex';
    } else {
        mobileControls.classList.add('hidden');
    }
}

// --- EDITOR DE MAPAS ---
function initGrid() {
    const canvas = document.getElementById('grid-canvas');
    const player = document.getElementById('player');
    canvas.innerHTML = ''; 
    canvas.appendChild(player); 
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
                if (coins >= cost) {
                    if (selectedTool === 'spawn' || selectedTool === 'flag') {
                        const old = document.querySelector(`.cell.${selectedTool}`);
                        if (old) old.className = 'cell';
                    }
                    if (!cell.classList.contains(selectedTool)) {
                        coins -= cost;
                        cell.className = 'cell ' + selectedTool;
                    }
                } else { alert("Moedas insuficientes!"); }
            }
            updateUI();
        };
        canvas.appendChild(cell);
    }
}

// --- COMUNIDADE ---
function renderComm() {
    const list = document.getElementById('level-list');
    list.innerHTML = '';
    communityLevels.forEach((l, i) => {
        const d = document.createElement('div');
        d.innerHTML = `<div style="background:#1a1a3a; padding:15px; border-radius:10px; border:1px solid #00f2ff; text-align:center; cursor:pointer;">NÍVEL ${i+1}<br><small>Por: ${l.author}</small></div>`;
        d.onclick = () => startLevel(l);
        list.appendChild(d);
    });
}

// --- LÓGICA DO JOGO ---
function startLevel(level) {
    navigate(screens.editor);
    document.getElementById('editor-sidebar').style.display = 'none';
    const canvas = document.getElementById('grid-canvas');
    const player = document.getElementById('player');
    canvas.innerHTML = ''; canvas.appendChild(player);
    collisionMap = level.map;
    collisionMap.forEach(cls => {
        const c = document.createElement('div');
        c.className = cls;
        canvas.appendChild(c);
    });
    const spawnIdx = collisionMap.findIndex(c => c.includes('spawn'));
    px = (spawnIdx % 20) * 32 + 6; py = Math.floor(spawnIdx / 20) * 32;
    vx = 0; vy = 0; player.classList.remove('hidden');
    isPlaying = true; requestAnimationFrame(loop);
}

function loop() {
    if (!isPlaying) return;
    vx = (keys['ArrowLeft'] || keys['KeyA']) ? -speed : (keys['ArrowRight'] || keys['KeyD']) ? speed : 0;
    px += vx; if (checkCollision(px, py)) px -= vx;
    vy += gravity; if (vy > 10) vy = 10;
    py += vy;
    if (checkCollision(px, py)) {
        if (vy > 0) { py = Math.floor((py + 26) / 32) * 32 - 26; vy = 0; if (keys['ArrowUp'] || keys['KeyW'] || keys['Space']) vy = jump; }
        else { py = Math.ceil(py / 32) * 32; vy = 0; }
    }
    const col = Math.floor((px + 10) / 32), row = Math.floor((py + 13) / 32);
    const tile = collisionMap[row * 20 + col];
    if (tile && tile.includes('lava')) { isPlaying = false; alert("VOCÊ MORREU!"); navigate(screens.menu); return; }
    if (tile && tile.includes('flag')) { isPlaying = false; coins += 50; updateUI(); alert("VOCÊ VENCEU! +50 Moedas"); navigate(screens.menu); return; }
    if (py > 480) navigate(screens.menu);
    document.getElementById('player').style.transform = `translate(${px}px, ${py}px)`;
    requestAnimationFrame(loop);
}

function checkCollision(x, y) {
    const pts = [{x:x+6, y:y+2}, {x:x+14, y:y+2}, {x:x+6, y:y+25}, {x:x+14, y:y+25}];
    return pts.some(p => {
        const c = Math.floor(p.x/32), r = Math.floor(p.y/32);
        return collisionMap[r*20+c]?.includes('block');
    });
}

// --- ADMIN FUNCTIONS ---
function admin
