// Constantes para as chaves de armazenamento
const STORAGE_KEY = 'vendasAppProducts';
const SALES_STORAGE_KEY = 'vendasAppSalesHistory'; 
const LOW_STOCK_THRESHOLD = 2; 

// Dados iniciais (lista da planilha) - Usada apenas se o localStorage estiver completamente vazio.
const INITIAL_PRODUCTS = [
    { id: '1700000001', name: 'Farinha - JD', quantity: 3, price: '0.00' },
    { id: '1700000002', name: 'Cup Nodies - Galinha Caipira', quantity: 1, price: '0.00' },
    { id: '1700000003', name: 'Leite em Pó - DoBom', quantity: 3, price: '0.00' },
    { id: '1700000004', name: 'Leite em Pó - Natu Milk', quantity: 1, price: '0.00' },
    { id: '1700000005', name: 'Pregador de Roupa', quantity: 3, price: '0.00' },
    { id: '1700000006', name: 'Feijão - Kicaldo', quantity: 2, price: '0.00' },
    { id: '1700000007', name: 'Estrato de Tomate', quantity: 5, price: '0.00' },
    { id: '1900000008', name: 'Azeitonas', quantity: 2, price: '0.00' },
    { id: '1700000009', name: 'Absorvente', quantity: 2, price: '0.00' },
    { id: '1700000010', name: 'Milho (Normal)', quantity: 4, price: '0.00' },
    { id: '1700000011', name: 'Ervilha', quantity: 3, price: '0.00' },
    { id: '1700000012', name: 'Sal -', quantity: 1, price: '0.00' },
    { id: '1700000013', name: 'Café -', quantity: 1, price: '0.00' },
];

let products = [];
let salesHistory = []; 

// Elementos do Modal de Venda para cálculo de Troco
const amountGivenInput = document.getElementById('amount-given');
const changeDueSpan = document.getElementById('change-due');
const paymentMethodSelect = document.getElementById('payment-method');
const cashPaymentFieldsDiv = document.getElementById('cash-payment-fields');

let currentSaleTotal = 0; // Armazena o total da venda atual para o cálculo do troco

// Funções de Utilitário de Armazenamento
function loadProducts() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        products = JSON.parse(data);
    } else {
        products = INITIAL_PRODUCTS;
    }
}

function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadSalesHistory() {
    const data = localStorage.getItem(SALES_STORAGE_KEY);
    salesHistory = data ? JSON.parse(data) : [];
}

function saveSalesHistory() {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(salesHistory));
}

// Funções de Lógica de Negócio
/**
 * Ajusta o estoque do produto.
 * @param {string} id - ID do produto.
 * @param {number} delta - Quantidade a ser adicionada ou subtraída (ex: 1 ou -1).
 */
function adjustStock(id, delta) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newQuantity = product.quantity + delta;
    
    // Prevenção: não permitir estoque negativo
    if (newQuantity < 0) {
        alert("O estoque não pode ser negativo. Utilize o registro de venda para saídas grandes.");
        return;
    }

    product.quantity = newQuantity;
    saveProducts();
    
    // Atualiza a exibição do número e as notificações sem re-renderizar a tabela inteira
    const quantitySpan = document.getElementById(`qty-${id}`);
    if (quantitySpan) {
        quantitySpan.textContent = newQuantity;
    }
    updateNotifications();
    updateSaleDatalist();
}

/**
 * Limpa todo o histórico de vendas.
 */
function clearSalesHistory() {
    if (salesHistory.length === 0) {
        alert("O histórico de vendas já está vazio.");
        return;
    }

    if (confirm("ATENÇÃO: Você tem certeza que deseja LIMPAR TODO o histórico de vendas? Esta ação é IRREVERSÍVEL.")) {
        salesHistory = [];
        saveSalesHistory();
        updateSalesIndicators();
        alert("Histórico de vendas limpo com sucesso!");
    }
}


// Funções para o cálculo do troco
function calculateChange() {
    const amountGiven = parseFloat(amountGivenInput.value) || 0;
    const change = amountGiven - currentSaleTotal;

    if (changeDueSpan) {
        if (change < 0) {
            changeDueSpan.textContent = `FALTANDO R$ ${Math.abs(change).toFixed(2).replace('.', ',')}`;
            changeDueSpan.style.color = 'red';
        } else {
            changeDueSpan.textContent = `R$ ${change.toFixed(2).replace('.', ',')}`;
            changeDueSpan.style.color = 'green';
        }
    }
}

function handlePaymentMethodChange() {
    const method = paymentMethodSelect.value;
    if (method === 'Dinheiro Vivo') {
        if (cashPaymentFieldsDiv) {
            cashPaymentFieldsDiv.style.display = 'block';
            amountGivenInput.value = ''; // Limpa o campo ao mostrar
            calculateChange();
        }
    } else {
        if (cashPaymentFieldsDiv) {
            cashPaymentFieldsDiv.style.display = 'none';
            changeDueSpan.textContent = 'R$ 0,00';
        }
    }
}

// Funções de Interface do Usuário
function renderProducts() {
    const tbody = document.getElementById('product-tbody');
    tbody.innerHTML = '';
    
    // Ordena os produtos do MAIOR estoque para o MENOR
    const sortedProducts = [...products].sort((a, b) => b.quantity - a.quantity); 

    sortedProducts.forEach(product => {
        const priceValue = product.price ? parseFloat(product.price) : 0;
        const formattedPrice = (priceValue > 0) ? 
            `R$ ${priceValue.toFixed(2).replace('.', ',')}` : 
            'N/A';
            
        const row = tbody.insertRow();
        
        row.insertCell().textContent = product.name;

        // Célula de Quantidade com Ajuste Rápido
        const quantityCell = row.insertCell();
        quantityCell.classList.add('stock-quantity-cell');
        quantityCell.innerHTML = `
            <span id="qty-${product.id}">${product.quantity}</span>
            <div class="quick-adjust-controls">
                <button class="adjust-up-btn" data-id="${product.id}" title="Aumentar Estoque">▲</button>
                <button class="adjust-down-btn" data-id="${product.id}" title="Diminuir Estoque">▼</button>
            </div>
        `;

        row.insertCell().textContent = formattedPrice;
        
        const actionsCell = row.insertCell();
        actionsCell.innerHTML = `
            <button class="edit-btn" data-id="${product.id}">Editar</button>
            <button class="delete-btn" data-id="${product.id}">Excluir</button>
        `;
    });

    updateNotifications();
    updateSaleDatalist(); 
    attachProductEventListeners();
}

function attachProductEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            openProductModalForEdit(productId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            deleteProduct(productId);
        });
    });

    // Adiciona event listeners para os botões de ajuste rápido
    document.querySelectorAll('.adjust-up-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            adjustStock(productId, 1);
        });
    });

    document.querySelectorAll('.adjust-down-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            adjustStock(productId, -1);
        });
    });
}

function openProductModalForEdit(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modal-product-title').textContent = 'Editar Produto';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-quantity').value = product.quantity;
    
    const priceValue = product.price ? parseFloat(product.price) : 0;
    const priceInput = document.getElementById('product-price');
    priceInput.value = (priceValue > 0) ? priceValue : '';
    
    document.getElementById('modal-product').style.display = 'block';
}

function openProductModalForNew(productName) {
    document.getElementById('modal-product-title').textContent = 'Adicionar Novo Produto';
    document.getElementById('product-id').value = ''; 
    document.getElementById('product-form').reset();
    
    // Pré-preenche o nome do produto
    document.getElementById('product-name').value = productName;
    
    document.getElementById('modal-product').style.display = 'block';
    
    // Fecha o modal de venda por trás para evitar confusão visual
    closeModal('modal-sale'); 
}


function deleteProduct(id) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
    }
}

function handleProductSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const quantity = parseInt(document.getElementById('product-quantity').value, 10);
    
    const priceValue = parseFloat(document.getElementById('product-price').value); 
    const price = isNaN(priceValue) ? '0.00' : priceValue.toFixed(2); 

    if (!name || isNaN(quantity) || quantity < 0) {
        alert("Por favor, preencha o Nome e a Quantidade corretamente.");
        return;
    }

    if (id) {
        // Modo Edição
        const index = products.findIndex(p => p.id === id);
        if (index > -1) {
            products[index].name = name;
            products[index].quantity = quantity;
            products[index].price = price;
        }
    } else {
        // Modo Adicionar
        const newProduct = {
            id: Date.now().toString(),
            name: name,
            quantity: quantity,
            price: price
        };
        products.push(newProduct);
    }

    saveProducts();
    renderProducts();
    closeModal('modal-product');
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = ''; 
}

function updateSaleDatalist() {
    const datalist = document.getElementById('sale-product-options');
    datalist.innerHTML = '';
    
    products.forEach(product => {
        const option = document.createElement('option');
        // Simplificado: Apenas o nome do produto no valor para facilitar a digitação
        option.value = product.name; 
        option.setAttribute('data-id', product.id); 
        // Adiciona a informação de estoque no texto (textContent)
        option.textContent = `${product.name} (Estoque: ${product.quantity})`; 
        datalist.appendChild(option);
    });
}

function updateSaleTotalForChange() {
    const search = document.getElementById('sale-product-search').value.trim();
    const quantity = parseInt(document.getElementById('sale-quantity').value, 10);

    if (!search || isNaN(quantity) || quantity <= 0) {
        currentSaleTotal = 0;
    } else {
        const normalizedSearch = search.replace(/\s\(Estoque:.*?\)$/g, '').trim(); 
        const product = products.find(p => p.name === normalizedSearch);
        
        if (product) {
            const price = parseFloat(product.price || 0);
            currentSaleTotal = price * quantity;
        } else {
            currentSaleTotal = 0;
        }
    }
    
    // Se o pagamento for Dinheiro Vivo, recalcula o troco
    if (paymentMethodSelect && paymentMethodSelect.value === 'Dinheiro Vivo') {
        calculateChange();
    }
}

/**
 * Lida com o envio do formulário Registrar Venda.
 */
function handleSaleSubmit(event) {
    event.preventDefault();
    
    const searchResultFull = document.getElementById('sale-product-search').value.trim();
    const saleQuantity = parseInt(document.getElementById('sale-quantity').value, 10);
    const paymentMethod = paymentMethodSelect.value || 'Não Informado'; 
    
    // Captura o CPF/Identificação
    const customerCpfInput = document.getElementById('customer-cpf');
    const customerCpf = customerCpfInput.value.trim() || 'N/A'; 


    if (!searchResultFull || isNaN(saleQuantity) || saleQuantity <= 0) {
        alert("Selecione um produto e insira uma quantidade válida.");
        return;
    }

    const datalist = document.getElementById('sale-product-options');
    const normalizedSearch = searchResultFull.replace(/\s\(Estoque:.*?\)$/g, '').trim(); 
    
    let option = Array.from(datalist.options).find(opt => 
        opt.value.startsWith(normalizedSearch) 
    );
    
    let product = null;
    let productId = null; 
    
    if (option) {
        productId = option.getAttribute('data-id');
        product = products.find(p => p.id === productId);
    } else {
        if (confirm(`O produto "${normalizedSearch}" não foi encontrado. Deseja adicioná-lo ao estoque agora?`)) {
            openProductModalForNew(normalizedSearch);
            return;
        } else {
            alert("Venda cancelada.");
            return;
        }
    }

    if (product) {
        if (product.quantity < saleQuantity) {
            alert(`Erro: Estoque insuficiente! Apenas ${product.quantity} unidades de ${product.name} restantes.`);
            return;
        }

        let salePrice = parseFloat(product.price || 0);

        // --- LÓGICA DE PREÇO OBRIGATÓRIO SE FOR ZERO ---
        if (salePrice === 0) {
            let newPrice;
            let validInput = false;

            while (!validInput) {
                const pricePrompt = prompt(`ATENÇÃO: O produto "${product.name}" não tem preço registrado. Qual é o preço unitário (R$) deste item?`);
                
                if (pricePrompt === null) {
                    alert("Venda cancelada pelo usuário.");
                    closeModal('modal-sale');
                    document.getElementById('sale-form').reset();
                    return;
                }

                newPrice = parseFloat(pricePrompt.replace(',', '.')); 
                
                if (isNaN(newPrice) || newPrice <= 0) {
                    alert("Preço inválido. Por favor, insira um valor numérico positivo.");
                } else {
                    validInput = true;
                }
            }

            salePrice = newPrice;
            product.price = salePrice.toFixed(2);
            saveProducts();
        }
        // --- FIM LÓGICA DE PREÇO ---

        // 2. Calcula o valor total da venda
        const totalSaleValue = salePrice * saleQuantity;
        
        // --- VALIDAÇÃO E CÁLCULO DE TROCO ---
        if (paymentMethod === 'Dinheiro Vivo') {
            const amountGiven = parseFloat(document.getElementById('amount-given').value) || 0;
            if (amountGiven < totalSaleValue) {
                const missing = totalSaleValue - amountGiven;
                alert(`Erro: Valor dado (R$ ${amountGiven.toFixed(2).replace('.', ',')}) é insuficiente. Faltam R$ ${missing.toFixed(2).replace('.', ',')} para completar a venda.`);
                return;
            }
            const change = amountGiven - totalSaleValue;
            if (change > 0) {
                alert(`Venda confirmada. **TROCO A SER DADO: R$ ${change.toFixed(2).replace('.', ',')}**`);
            } else {
                 alert(`Venda confirmada. Valor exato recebido.`);
            }
        } else {
             alert(`Venda de ${saleQuantity}x ${product.name} (R$ ${totalSaleValue.toFixed(2).replace('.', ',')}) registrada como ${paymentMethod}!`);
        }
        // --- FIM VALIDAÇÃO DE TROCO ---

        // --- REGISTRAR A VENDA ---
        const newSale = {
            id: Date.now().toString(),
            productId: productId,
            productName: product.name,
            quantity: saleQuantity,
            unitPrice: salePrice.toFixed(2),
            totalValue: totalSaleValue.toFixed(2),
            paymentMethod: paymentMethod, 
            customerCpf: customerCpf, // REGISTRA O CPF
            timestamp: new Date().toISOString()
        };
        
        salesHistory.push(newSale);
        saveSalesHistory(); 
        
        // 3. Reduz a quantidade no estoque
        product.quantity -= saleQuantity;
        saveProducts();
        
        // 4. Atualiza a interface
        renderProducts();
        updateSalesIndicators();

        closeModal('modal-sale');
        document.getElementById('sale-form').reset();
        
        // Reseta campos de pagamento/troco/CPF
        paymentMethodSelect.value = '';
        handlePaymentMethodChange(); 
        customerCpfInput.value = ''; 
        document.getElementById('cpf-input-container').style.display = 'none'; 
    } else {
        alert("Erro interno: Produto não encontrado após a busca.");
    }
}


function updateSalesIndicators() {
    loadSalesHistory(); 
    
    // Filtra vendas de hoje
    const today = new Date().toISOString().split('T')[0];
    const dailySales = salesHistory.filter(sale => sale.timestamp.startsWith(today));
    
    // Calcula totais
    const dailyTotalValue = dailySales.reduce((sum, sale) => sum + parseFloat(sale.totalValue), 0);
    const grandTotalValue = salesHistory.reduce((sum, sale) => sum + parseFloat(sale.totalValue), 0);

    // Atualiza indicador pequeno (Total Hoje)
    const formattedDailyTotal = `R$ ${dailyTotalValue.toFixed(2).replace('.', ',')}`;
    const dailySalesIndicator = document.getElementById('daily-sales-total-value-indicator');
    if (dailySalesIndicator) {
        dailySalesIndicator.textContent = formattedDailyTotal;
    }
    
    // Atualiza Modal Grande
    const dailyTotalValueSpan = document.getElementById('daily-total-value');
    if (dailyTotalValueSpan) dailyTotalValueSpan.textContent = formattedDailyTotal;
    
    const grandTotalValueSpan = document.getElementById('grand-total-value');
    if (grandTotalValueSpan) grandTotalValueSpan.textContent = `R$ ${grandTotalValue.toFixed(2).replace('.', ',')}`;

    // Lista de Vendas do Dia
    const dailyList = document.getElementById('daily-sales-list');
    if (dailyList) {
        dailyList.innerHTML = dailySales.length === 0 ? '<li>Nenhuma venda registrada hoje.</li>' : '';
        dailySales.forEach(sale => {
            const li = document.createElement('li');
            const time = new Date(sale.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            // Exibe o CPF/ID se estiver presente
            const cpfDisplay = sale.customerCpf && sale.customerCpf !== 'N/A' ? ` | CPF: ${sale.customerCpf}` : '';
            
            li.textContent = `[${time}] ${sale.quantity}x ${sale.productName} = R$ ${sale.totalValue.replace('.', ',')} (${sale.paymentMethod})${cpfDisplay}`; 
            dailyList.appendChild(li);
        });
    }

    // Lista de Vendas Total (Últimas 10)
    const allList = document.getElementById('all-sales-list');
    if (allList) {
        allList.innerHTML = salesHistory.length === 0 ? '<li>Nenhuma venda registrada no histórico.</li>' : '';
        
        const recentSales = salesHistory.slice(-10).reverse();
        recentSales.forEach(sale => {
            const dateTime = new Date(sale.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

            // Exibe o CPF/ID se estiver presente
            const cpfDisplay = sale.customerCpf && sale.customerCpf !== 'N/A' ? ` | CPF: ${sale.customerCpf}` : '';
            
            const li = document.createElement('li');
            li.textContent = `[${dateTime}] ${sale.quantity}x ${sale.productName} = R$ ${sale.totalValue.replace('.', ',')} (${sale.paymentMethod})${cpfDisplay}`;
            allList.appendChild(li);
        });
    }
}


/**
 * Gera e exibe notificações de estoque baixo/esgotado com destaque.
 */
function updateNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;
    
    notificationsList.innerHTML = '';
    let hasNotifications = false;

    products.forEach(product => {
        const strongName = `<strong>${product.name}</strong>`;
        
        if (product.quantity === 0) {
            const li = document.createElement('li');
            li.className = 'notification-sold-out';
            li.innerHTML = `ESGOTADO: O produto ${strongName} acabou!`;
            notificationsList.appendChild(li);
            hasNotifications = true;
        } else if (product.quantity > 0 && product.quantity <= LOW_STOCK_THRESHOLD) {
            const li = document.createElement('li');
            li.className = 'notification-low';
            li.innerHTML = `ESTOQUE BAIXO: O produto ${strongName} tem apenas ${product.quantity} unidades.`;
            notificationsList.appendChild(li);
            hasNotifications = true;
        }
    });

    if (!hasNotifications) {
        const li = document.createElement('li');
        li.className = 'info';
        li.textContent = 'Tudo sob controle! Nenhum problema de estoque.';
        notificationsList.appendChild(li);
    }
}

/**
 * Filtra produtos em baixo estoque ou esgotados, formata a lista e copia para o clipboard.
 */
function copyShoppingList() {
    const soldOutItems = [];
    const lowStockItems = [];
    
    // 1. Filtrar os produtos
    products.forEach(product => {
        if (product.quantity === 0) {
            soldOutItems.push(product.name);
        } else if (product.quantity > 0 && product.quantity <= LOW_STOCK_THRESHOLD) {
            lowStockItems.push(product.name);
        }
    });

    if (soldOutItems.length === 0 && lowStockItems.length === 0) {
        alert("Não há produtos em falta ou com estoque baixo para gerar a lista.");
        return;
    }

    // 2. Formatar a lista (Priorizando esgotados)
    let listContent = '🛒 LISTA DE COMPRAS (REPOSIÇÃO)\n\n';

    if (soldOutItems.length > 0) {
        listContent += '--- ESGOTADOS (Prioridade) ---\n';
        listContent += soldOutItems.map(name => `[ ] ${name}`).join('\n');
        listContent += '\n\n';
    }

    if (lowStockItems.length > 0) {
        listContent += '--- ESTOQUE BAIXO ---\n';
        listContent += lowStockItems.map(name => `[ ] ${name}`).join('\n');
    }

    // 3. Copiar para o clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(listContent).then(() => {
            alert('✅ Lista de compras copiada para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
            alert('❌ Não foi possível copiar a lista automaticamente. Consulte o console para mais detalhes.');
        });
    } else {
        // Fallback para navegadores mais antigos (menos comum hoje)
        alert('Seu navegador não suporta cópia automática. A lista formatada será exibida no console.');
        console.log(listContent);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Inicializa a aplicação ao carregar a página.
 */
function init() {
    const dataBeforeLoad = localStorage.getItem(STORAGE_KEY);
    
    loadProducts();
    loadSalesHistory(); 
    renderProducts();
    updateSalesIndicators(); 
    
    if (!dataBeforeLoad) {
        saveProducts();
    }

    // --- EVENT LISTENERS GERAIS ---

    // Ação do Botão de Copiar Lista
    const copyButton = document.getElementById('btn-copy-list');
    if (copyButton) copyButton.addEventListener('click', copyShoppingList);

    // Ação do Botão Limpar Histórico
    const clearHistoryButton = document.getElementById('btn-clear-sales-history');
    if (clearHistoryButton) clearHistoryButton.addEventListener('click', clearSalesHistory);
    
    // Ação do Mini Pop-up Adicionar Produto
    const addProductPopup = document.getElementById('add-product-popup');
    if (addProductPopup) {
        addProductPopup.addEventListener('click', function() {
            openProductModalForNew(''); 
        });
    }

    // Ação do Mini Pop-up Registrar Venda
    const sellProductPopup = document.getElementById('sell-product-popup');
    if (sellProductPopup) {
        sellProductPopup.addEventListener('click', function() {
            updateSaleDatalist(); 
            document.getElementById('sale-form').reset(); 
            
            // Reseta campos de pagamento/troco/CPF ao abrir o modal
            if (paymentMethodSelect) paymentMethodSelect.value = '';
            handlePaymentMethodChange(); 
            
            const customerCpfInput = document.getElementById('customer-cpf');
            const cpfInputContainer = document.getElementById('cpf-input-container');
            const toggleCpfBtn = document.getElementById('toggle-cpf-btn');

            if (customerCpfInput) customerCpfInput.value = '';
            if (cpfInputContainer) cpfInputContainer.style.display = 'none';
            if (toggleCpfBtn) toggleCpfBtn.textContent = 'Adicionar CPF/ID (Opcional)';

            document.getElementById('modal-sale').style.display = 'block';
        });
    }
    
    // Ação do Mini Pop-up de Vendas
    const salesIndicatorPopup = document.getElementById('sales-indicator-popup');
    if (salesIndicatorPopup) {
        salesIndicatorPopup.addEventListener('click', function() {
            updateSalesIndicators(); 
            document.getElementById('modal-sales-details').style.display = 'block';
        });
    }

    // NOVO: Lógica do Pop-up CPF
    const toggleCpfBtn = document.getElementById('toggle-cpf-btn');
    const cpfInputContainer = document.getElementById('cpf-input-container');

    if (toggleCpfBtn && cpfInputContainer) {
        toggleCpfBtn.addEventListener('click', function() {
            if (cpfInputContainer.style.display === 'none') {
                cpfInputContainer.style.display = 'block';
                toggleCpfBtn.textContent = 'Ocultar Campo CPF/ID';
            } else {
                cpfInputContainer.style.display = 'none';
                document.getElementById('customer-cpf').value = ''; // Limpa ao ocultar
                toggleCpfBtn.textContent = 'Adicionar CPF/ID (Opcional)';
            }
        });
    }

    // Configurar envio de formulários
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    document.getElementById('sale-form').addEventListener('submit', function(event) {
        handleSaleSubmit(event);
    });

    // --- EVENT LISTENERS DE PAGAMENTO ---
    if (paymentMethodSelect) paymentMethodSelect.addEventListener('change', handlePaymentMethodChange);
    if (amountGivenInput) amountGivenInput.addEventListener('input', calculateChange);
    
    // Ação no campo de Quantidade e Busca (para atualizar o total e o troco)
    const saleQuantityInput = document.getElementById('sale-quantity');
    const saleSearchInput = document.getElementById('sale-product-search');

    if (saleQuantityInput) saleQuantityInput.addEventListener('input', updateSaleTotalForChange);
    if (saleSearchInput) saleSearchInput.addEventListener('input', updateSaleTotalForChange);
    
    // --- FECHAMENTO DE MODAIS ---
    document.querySelectorAll('.close-btn').forEach(span => {
        span.addEventListener('click', function() {
            closeModal(span.closest('.modal').id);
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);