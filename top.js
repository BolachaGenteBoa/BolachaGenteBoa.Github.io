// TESTE DE CARREGAMENTO - Se isso aparecer, o arquivo carregou!
alert("O arquivo top.js carregou com sucesso!");

console.log("Iniciando scripts do jogo...");

// 1. CONFIGURAÇÃO DE TELAS
const screens = { 
    menu: document.getElementById('main-menu'), 
    comm: document.getElementById('community-tab'), 
    editor: document.getElementById('level-editor'),
    rank: document.getElementById('rank-tab')
};

// 2. VARIÁVEIS DE ESTADO
let coins = localStorage.getItem('coins') ? parseInt(localStorage.getItem('coins')) : 500;
let nickname = localStorage.getItem('nickname') || "";
let communityLevels = JSON.parse(localStorage.getItem('communityLevels')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// 3. ATUALIZAÇÃO DA INTERFACE
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
    
    // Atualiza Ranking Local
    if(nickname) {
        let user = leaderboard.find(u => u.name === nickname);
        if(user) user.coins = coins; 
        else leaderboard.push({name: nickname, coins: coins});
        leaderboard.sort((a,b) => b.coins - a.coins);
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

// 4. NAVEGAÇÃO
function navigate(target) {
    if(!target) return;
    Object.values(screens).forEach(s => {
        if(s) s.classList.add('hidden');
    });
    target.classList.remove('hidden');
}

// 5. EVENTOS DE BOTÕES (RANKING E OUTROS)
window.onload = () => {
    updateUI();
    if (!nickname) document.getElementById('nick-modal')?.classList.remove('hidden');

    // Botão Ranking
    const btnRank = document.getElementById('btn-rank');
    if (btnRank) {
        btnRank.onclick = () => {
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
    }

    // Botões Voltar
    document.getElementById('btn-back-rank').onclick = () => navigate(screens.menu);
    document.getElementById('btn-back-comm').onclick = () => navigate(screens.menu);
    document.getElementById('btn-create').onclick = () => navigate(screens.editor);
    document.getElementById('btn-play').onclick = () => navigate(screens.comm);

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
};
