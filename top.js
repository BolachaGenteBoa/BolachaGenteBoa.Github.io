// Aguarda o documento carregar totalmente antes de procurar os botões
document.addEventListener('DOMContentLoaded', () => {
    
    // Vinculação do Botão de Ranking
    const btnRank = document.getElementById('btn-rank');
    if (btnRank) {
        btnRank.onclick = () => {
            renderRank();
            navigate(screens.rank);
        };
    } else {
        console.error("Botão btn-rank não encontrado no HTML!");
    }

    // Vinculação do Botão de Publicar
    const btnPublish = document.getElementById('publish-btn');
    if (btnPublish) {
        btnPublish.onclick = () => {
            const s = document.querySelector('.cell.spawn');
            const f = document.querySelector('.cell.flag');
            if (!s || !f) return alert("Coloque Spawn e Meta!");
            
            const mapData = Array.from(document.querySelectorAll('.cell')).map(c => c.className);
            communityLevels.push({ author: nickname, map: mapData });
            updateUI(); 
            alert("NÍVEL PUBLICADO!"); 
            navigate(screens.menu);
        };
    }

    // Vinculação do Botão de Voltar do Ranking
    const btnBackRank = document.getElementById('btn-back-rank');
    if (btnBackRank) {
        btnBackRank.onclick = () => navigate(screens.menu);
    }
});

// Mantenha o restante das suas funções (updateUI, navigate, loop, etc) abaixo...
