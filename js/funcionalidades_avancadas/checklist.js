// checklist.js - Funcionalidades para gerenciamento de check-lists

/**
 * Módulo para gerenciamento de check-lists de inspeções
 */
const ChecklistManager = (function() {
    // Configurações
    const config = {
        apiBaseUrl: '/api',
        checklistContainer: 'checklist-container',
        resultContainer: 'checklist-result-container'
    };

    // Cache de dados
    let modelosCache = [];
    let checklistAtual = null;

    /**
     * Inicializa o módulo
     * @param {Object} options - Opções de configuração
     */
    function init(options = {}) {
        // Mesclar opções com configurações padrão
        Object.assign(config, options);

        // Inicializar eventos
        setupEventListeners();

        // Carregar dados iniciais se necessário
        if (options.autoload) {
            loadModelos();
        }

        console.log('ChecklistManager inicializado');
    }

    /**
     * Configura os listeners de eventos
     */
    function setupEventListeners() {
        // Botão para criar novo modelo de checklist
        document.querySelectorAll('.btn-novo-modelo-checklist').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                showModeloForm();
            });
        });

        // Botão para iniciar checklist
        document.querySelectorAll('.btn-iniciar-checklist').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const modeloId = this.dataset.id;
                const itemTipo = this.dataset.itemTipo || null;
                const itemId = this.dataset.itemId || null;
                
                iniciarChecklist(modeloId, itemTipo, itemId);
            });
        });

        // Botão para visualizar histórico de checklists
        document.querySelectorAll('.btn-historico-checklist').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const itemTipo = this.dataset.itemTipo || null;
                const itemId = this.dataset.itemId || null;
                
                carregarHistoricoChecklists(itemTipo, itemId);
            });
        });
    }

    /**
     * Carrega a lista de modelos de checklist
     * @param {Object} filtros - Filtros para a busca
     * @returns {Promise} Promise com os modelos
     */
    function loadModelos(filtros = {}) {
        // Construir query string
        const params = new URLSearchParams();
        
        if (filtros.condominio_id) {
            params.append('condominio_id', filtros.condominio_id);
        }
        
        if (filtros.tipo) {
            params.append('tipo', filtros.tipo);
        }
        
        if (filtros.ativo !== undefined) {
            params.append('ativo', filtros.ativo ? '1' : '0');
        }
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        
        return api.get(`/checklist/modelos${queryString}`)
            .then(response => {
                modelosCache = response.data;
                return modelosCache;
            })
            .catch(error => {
                console.error('Erro ao carregar modelos de checklist:', error);
                showMessage('Erro ao carregar modelos de checklist', 'error');
                return [];
            });
    }

    /**
     * Exibe formulário para criar/editar modelo de checklist
     * @param {number} modeloId - ID do modelo para edição (null para novo)
     */
    function showModeloForm(modeloId = null) {
        // Verificar se é edição ou criação
        const isEdicao = modeloId !== null;
        
        // Título do modal
        const modalTitle = isEdicao ? 'Editar Modelo de Check-list' : 'Novo Modelo de Check-list';
        
        // Criar modal
        const modalId = 'modeloChecklistModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            // Criar modal se não existir
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-hidden', 'true');
            
            const modalDialog = document.createElement('div');
            modalDialog.className = 'modal-dialog modal-lg modal-dialog-centered';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            
            const modalTitle = document.createElement('h5');
            modalTitle.className = 'modal-title';
            modalTitle.id = `${modalId}Label`;
            
            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'btn-close';
            closeButton.setAttribute('data-bs-dismiss', 'modal');
            closeButton.setAttribute('aria-label', 'Fechar');
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            
            const saveButton = document.createElement('button');
            saveButton.type = 'button';
            saveButton.className = 'btn btn-primary';
            saveButton.textContent = 'Salvar';
            saveButton.id = 'btnSalvarModeloChecklist';
            
            const closeModalButton = document.createElement('button');
            closeModalButton.type = 'button';
            closeModalButton.className = 'btn btn-secondary';
            closeModalButton.textContent = 'Cancelar';
            closeModalButton.setAttribute('data-bs-dismiss', 'modal');
            
            modalFooter.appendChild(saveButton);
            modalFooter.appendChild(closeModalButton);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            
            modalDialog.appendChild(modalContent);
            modal.appendChild(modalDialog);
            
            document.body.appendChild(modal);
        }
        
        // Atualizar título do modal
        const modalTitleElement = modal.querySelector('.modal-title');
        modalTitleElement.textContent = modalTitle;
        
        // Atualizar conteúdo do modal
        const modalBody = modal.querySelector('.modal-body');
        
        // Criar formulário
        const form = document.createElement('form');
        form.id = 'formModeloChecklist';
        
        // Campo ID (hidden)
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.id = 'modelo_id';
        idField.name = 'id';
        idField.value = modeloId || '';
        
        // Campo Nome
        const nomeGroup = document.createElement('div');
        nomeGroup.className = 'mb-3';
        
        const nomeLabel = document.createElement('label');
        nomeLabel.htmlFor = 'modelo_nome';
        nomeLabel.className = 'form-label';
        nomeLabel.textContent = 'Nome do Modelo';
        
        const nomeInput = document.createElement('input');
        nomeInput.type = 'text';
        nomeInput.className = 'form-control';
        nomeInput.id = 'modelo_nome';
        nomeInput.name = 'nome';
        nomeInput.required = true;
        
        nomeGroup.appendChild(nomeLabel);
        nomeGroup.appendChild(nomeInput);
        
        // Campo Descrição
        const descricaoGroup = document.createElement('div');
        descricaoGroup.className = 'mb-3';
        
        const descricaoLabel = document.createElement('label');
        descricaoLabel.htmlFor = 'modelo_descricao';
        descricaoLabel.className = 'form-label';
        descricaoLabel.textContent = 'Descrição';
        
        const descricaoInput = document.createElement('textarea');
        descricaoInput.className = 'form-control';
        descricaoInput.id = 'modelo_descricao';
        descricaoInput.name = 'descricao';
        descricaoInput.rows = 3;
        
        descricaoGroup.appendChild(descricaoLabel);
        descricaoGroup.appendChild(descricaoInput);
        
        // Campo Tipo
        const tipoGroup = document.createElement('div');
        tipoGroup.className = 'mb-3';
        
        const tipoLabel = document.createElement('label');
        tipoLabel.htmlFor = 'modelo_tipo';
        tipoLabel.className = 'form-label';
        tipoLabel.textContent = 'Tipo de Aplicação';
        
        const tipoSelect = document.createElement('select');
        tipoSelect.className = 'form-select';
        tipoSelect.id = 'modelo_tipo';
        tipoSelect.name = 'tipo';
        tipoSelect.required = true;
        
        const tipoOptions = [
            { value: 'equipamento', text: 'Equipamento' },
            { value: 'area', text: 'Área' },
            { value: 'condominio', text: 'Condomínio (Geral)' }
        ];
        
        tipoOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            tipoSelect.appendChild(optionElement);
        });
        
        tipoGroup.appendChild(tipoLabel);
        tipoGroup.appendChild(tipoSelect);
        
        // Campo Condomínio
        const condominioGroup = document.createElement('div');
        condominioGroup.className = 'mb-3';
        
        const condominioLabel = document.createElement('label');
        condominioLabel.htmlFor = 'modelo_condominio_id';
        condominioLabel.className = 'form-label';
        condominioLabel.textContent = 'Condomínio (opcional)';
        
        const condominioSelect = document.createElement('select');
        condominioSelect.className = 'form-select';
        condominioSelect.id = 'modelo_condominio_id';
        condominioSelect.name = 'condominio_id';
        
        // Opção vazia (todos os condomínios)
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Todos os Condomínios';
        condominioSelect.appendChild(emptyOption);
        
        // Carregar condomínios
        api.get('/condominios')
            .then(response => {
                response.data.forEach(condominio => {
                    const option = document.createElement('option');
                    option.value = condominio.id;
                    option.textContent = condominio.nome;
                    condominioSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar condomínios:', error);
            });
        
        condominioGroup.appendChild(condominioLabel);
        condominioGroup.appendChild(condominioSelect);
        
        // Campo Periodicidade
        const periodicidadeGroup = document.createElement('div');
        periodicidadeGroup.className = 'mb-3';
        
        const periodicidadeLabel = document.createElement('label');
        periodicidadeLabel.htmlFor = 'modelo_periodicidade';
        periodicidadeLabel.className = 'form-label';
        periodicidadeLabel.textContent = 'Periodicidade Recomendada';
        
        const periodicidadeRow = document.createElement('div');
        periodicidadeRow.className = 'row g-3';
        
        const periodicidadeValorCol = document.createElement('div');
        periodicidadeValorCol.className = 'col-md-6';
        
        const periodicidadeValorInput = document.createElement('input');
        periodicidadeValorInput.type = 'number';
        periodicidadeValorInput.className = 'form-control';
        periodicidadeValorInput.id = 'modelo_periodicidade_valor';
        periodicidadeValorInput.name = 'periodicidade_valor';
        periodicidadeValorInput.min = 1;
        periodicidadeValorInput.value = 1;
        
        periodicidadeValorCol.appendChild(periodicidadeValorInput);
        
        const periodicidadeUnidadeCol = document.createElement('div');
        periodicidadeUnidadeCol.className = 'col-md-6';
        
        const periodicidadeUnidadeSelect = document.createElement('select');
        periodicidadeUnidadeSelect.className = 'form-select';
        periodicidadeUnidadeSelect.id = 'modelo_periodicidade_unidade';
        periodicidadeUnidadeSelect.name = 'periodicidade_unidade';
        
        const unidadeOptions = [
            { value: 'dias', text: 'Dias' },
            { value: 'semanas', text: 'Semanas' },
            { value: 'meses', text: 'Meses' },
            { value: 'anos', text: 'Anos' }
        ];
        
        unidadeOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            periodicidadeUnidadeSelect.appendChild(optionElement);
        });
        
        periodicidadeUnidadeCol.appendChild(periodicidadeUnidadeSelect);
        
        periodicidadeRow.appendChild(periodicidadeValorCol);
        periodicidadeRow.appendChild(periodicidadeUnidadeCol);
        
        periodicidadeGroup.appendChild(periodicidadeLabel);
        periodicidadeGroup.appendChild(periodicidadeRow);
        
        // Seção de Itens do Checklist
        const itensSection = document.createElement('div');
        itensSection.className = 'mt-4';
        
        const itensTitulo = document.createElement('h5');
        itensTitulo.textContent = 'Itens do Check-list';
        
        const itensDescricao = document.createElement('p');
        itensDescricao.className = 'text-muted';
        itensDescricao.textContent = 'Adicione os itens que serão verificados durante a inspeção.';
        
        const itensList = document.createElement('div');
        itensList.id = 'itens-checklist';
        itensList.className = 'list-group mb-3';
        
        const addItemButton = document.createElement('button');
        addItemButton.type = 'button';
        addItemButton.className = 'btn btn-outline-primary';
        addItemButton.textContent = 'Adicionar Item';
        addItemButton.addEventListener('click', () => {
            addItemToForm();
        });
        
        itensSection.appendChild(itensTitulo);
        itensSection.appendChild(itensDescricao);
        itensSection.appendChild(itensList);
        itensSection.appendChild(addItemButton);
        
        // Adicionar campos ao formulário
        form.appendChild(idField);
        form.appendChild(nomeGroup);
        form.appendChild(descricaoGroup);
        form.appendChild(tipoGroup);
        form.appendChild(condominioGroup);
        form.appendChild(periodicidadeGroup);
        form.appendChild(itensSection);
        
        // Adicionar formulário ao modal
        modalBody.innerHTML = '';
        modalBody.appendChild(form);
        
        // Configurar botão de salvar
        const saveButtonElement = modal.querySelector('#btnSalvarModeloChecklist');
        saveButtonElement.onclick = () => {
            salvarModeloChecklist();
        };
        
        // Se for edição, carregar dados do modelo
        if (isEdicao) {
            showLoading('Carregando modelo...');
            
            api.get(`/checklist/modelos/${modeloId}`)
                .then(response => {
                    hideLoading();
                    
                    const modelo = response.data;
                    
                    // Preencher campos
                    document.getElementById('modelo_nome').value = modelo.nome;
                    document.getElementById('modelo_descricao').value = modelo.descricao || '';
                    document.getElementById('modelo_tipo').value = modelo.tipo;
                    document.getElementById('modelo_condominio_id').value = modelo.condominio_id || '';
                    document.getElementById('modelo_periodicidade_valor').value = modelo.periodicidade_valor || 1;
                    document.getElementById('modelo_periodicidade_unidade').value = modelo.periodicidade_unidade || 'meses';
                    
                    // Adicionar itens
                    if (modelo.itens && modelo.itens.length > 0) {
                        modelo.itens.forEach(item => {
                            addItemToForm(item);
                        });
                    }
                })
                .catch(error => {
                    hideLoading();
                    console.error('Erro ao carregar modelo:', error);
                    showMessage('Erro ao carregar modelo de checklist', 'error');
                });
        } else {
            // Adicionar um item vazio para novo modelo
            addItemToForm();
        }
        
        // Exibir modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Adiciona um item ao formulário de modelo de checklist
     * @param {Object} item - Dados do item (opcional)
     */
    function addItemToForm(item = null) {
        const itensList = document.getElementById('itens-checklist');
        
        // Gerar ID único para o item
        const itemId = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Criar elemento de item
        const itemElement = document.createElement('div');
        itemElement.className = 'list-group-item p-3 mb-2';
        itemElement.dataset.itemId = itemId;
        
        // Criar formulário do item
        const itemRow = document.createElement('div');
        itemRow.className = 'row g-3';
        
        // Campo Descrição do Item
        const descricaoCol = document.createElement('div');
        descricaoCol.className = 'col-md-6';
        
        const descricaoLabel = document.createElement('label');
        descricaoLabel.htmlFor = `${itemId}_descricao`;
        descricaoLabel.className = 'form-label';
        descricaoLabel.textContent = 'Descrição do Item';
        
        const descricaoInput = document.createElement('input');
        descricaoInput.type = 'text';
        descricaoInput.className = 'form-control';
        descricaoInput.id = `${itemId}_descricao`;
        descricaoInput.name = `itens[${itemId}][descricao]`;
        descricaoInput.required = true;
        descricaoInput.value = item ? item.descricao : '';
        
        descricaoCol.appendChild(descricaoLabel);
        descricaoCol.appendChild(descricaoInput);
        
        // Campo Tipo de Resposta
        const tipoRespostaCol = document.createElement('div');
        tipoRespostaCol.className = 'col-md-3';
        
        const tipoRespostaLabel = document.createElement('label');
        tipoRespostaLabel.htmlFor = `${itemId}_tipo_resposta`;
        tipoRespostaLabel.className = 'form-label';
        tipoRespostaLabel.textContent = 'Tipo de Resposta';
        
        const tipoRespostaSelect = document.createElement('select');
        tipoRespostaSelect.className = 'form-select';
        tipoRespostaSelect.id = `${itemId}_tipo_resposta`;
        tipoRespostaSelect.name = `itens[${itemId}][tipo_resposta]`;
        
        const tipoRespostaOptions = [
            { value: 'sim_nao', text: 'Sim/Não' },
            { value: 'conforme_nao_conforme', text: 'Conforme/Não Conforme' },
            { value: 'escala', text: 'Escala (1-5)' },
            { value: 'texto', text: 'Texto Livre' }
        ];
        
        tipoRespostaOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            tipoRespostaSelect.appendChild(optionElement);
        });
        
        // Definir valor selecionado
        if (item && item.tipo_resposta) {
            tipoRespostaSelect.value = item.tipo_resposta;
        }
        
        tipoRespostaCol.appendChild(tipoRespostaLabel);
        tipoRespostaCol.appendChild(tipoRespostaSelect);
        
        // Campo Criticidade
        const criticidadeCol = document.createElement('div');
        criticidadeCol.className = 'col-md-2';
        
        const criticidadeLabel = document.createElement('label');
        criticidadeLabel.htmlFor = `${itemId}_criticidade`;
        criticidadeLabel.className = 'form-label';
        criticidadeLabel.textContent = 'Criticidade';
        
        const criticidadeSelect = document.createElement('select');
        criticidadeSelect.className = 'form-select';
        criticidadeSelect.id = `${itemId}_criticidade`;
        criticidadeSelect.name = `itens[${itemId}][criticidade]`;
        
        const criticidadeOptions = [
            { value: 'baixa', text: 'Baixa' },
            { value: 'media', text: 'Média' },
            { value: 'alta', text: 'Alta' },
            { value: 'critica', text: 'Crítica' }
        ];
        
        criticidadeOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            criticidadeSelect.appendChild(optionElement);
        });
        
        // Definir valor selecionado
        if (item && item.criticidade) {
            criticidadeSelect.value = item.criticidade;
        }
        
        criticidadeCol.appendChild(criticidadeLabel);
        criticidadeCol.appendChild(criticidadeSelect);
        
        // Botão Remover
        const removeCol = document.createElement('div');
        removeCol.className = 'col-md-1 d-flex align-items-end';
        
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'btn btn-outline-danger';
        removeButton.innerHTML = '<i class="bi bi-trash"></i>';
        removeButton.addEventListener('click', () => {
            itemElement.remove();
        });
        
        removeCol.appendChild(removeButton);
        
        // Adicionar campos à linha
        itemRow.appendChild(descricaoCol);
        itemRow.appendChild(tipoRespostaCol);
        itemRow.appendChild(criticidadeCol);
        itemRow.appendChild(removeCol);
        
        // Adicionar linha ao item
        itemElement.appendChild(itemRow);
        
        // Adicionar campo para observações
        const obsRow = document.createElement('div');
        obsRow.className = 'row mt-2';
        
        const obsCol = document.createElement('div');
        obsCol.className = 'col-12';
        
        const obsLabel = document.createElement('label');
        obsLabel.htmlFor = `${itemId}_observacoes`;
        obsLabel.className = 'form-label';
        obsLabel.textContent = 'Instruções/Observações';
        
        const obsInput = document.createElement('textarea');
        obsInput.className = 'form-control';
        obsInput.id = `${itemId}_observacoes`;
        obsInput.name = `itens[${itemId}][observacoes]`;
        obsInput.rows = 2;
        obsInput.value = item ? item.observacoes || '' : '';
        
        obsCol.appendChild(obsLabel);
        obsCol.appendChild(obsInput);
        
        obsRow.appendChild(obsCol);
        
        itemElement.appendChild(obsRow);
        
        // Adicionar item à lista
        itensList.appendChild(itemElement);
    }

    /**
     * Salva o modelo de checklist
     */
    function salvarModeloChecklist() {
        // Validar formulário
        const form = document.getElementById('formModeloChecklist');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Coletar dados do formulário
        const modeloId = document.getElementById('modelo_id').value;
        const isEdicao = modeloId !== '';
        
        const formData = {
            nome: document.getElementById('modelo_nome').value,
            descricao: document.getElementById('modelo_descricao').value,
            tipo: document.getElementById('modelo_tipo').value,
            condominio_id: document.getElementById('modelo_condominio_id').value || null,
            periodicidade_valor: parseInt(document.getElementById('modelo_periodicidade_valor').value),
            periodicidade_unidade: document.getElementById('modelo_periodicidade_unidade').value,
            itens: []
        };
        
        // Coletar itens
        const itensElements = document.querySelectorAll('#itens-checklist > div');
        
        if (itensElements.length === 0) {
            showMessage('Adicione pelo menos um item ao checklist', 'warning');
            return;
        }
        
        itensElements.forEach((itemElement, index) => {
            const itemId = itemElement.dataset.itemId;
            
            const item = {
                ordem: index + 1,
                descricao: document.getElementById(`${itemId}_descricao`).value,
                tipo_resposta: document.getElementById(`${itemId}_tipo_resposta`).value,
                criticidade: document.getElementById(`${itemId}_criticidade`).value,
                observacoes: document.getElementById(`${itemId}_observacoes`).value
            };
            
            formData.itens.push(item);
        });
        
        // Enviar dados para API
        showLoading('Salvando modelo...');
        
        const apiCall = isEdicao
            ? api.put(`/checklist/modelos/${modeloId}`, formData)
            : api.post('/checklist/modelos', formData);
            
        apiCall
            .then(response => {
                hideLoading();
                
                // Fechar modal
                const modal = document.getElementById('modeloChecklistModal');
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                
                // Atualizar lista de modelos
                loadModelos();
                
                // Exibir mensagem de sucesso
                showMessage(
                    isEdicao ? 'Modelo de checklist atualizado com sucesso' : 'Modelo de checklist criado com sucesso',
                    'success'
                );
                
                // Atualizar interface se necessário
                if (typeof updateModelosChecklistUI === 'function') {
                    updateModelosChecklistUI();
                }
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao salvar modelo:', error);
                showMessage('Erro ao salvar modelo de checklist', 'error');
            });
    }

    /**
     * Inicia um novo checklist
     * @param {number} modeloId - ID do modelo de checklist
     * @param {string} itemTipo - Tipo do item (equipamento, area, condominio)
     * @param {number} itemId - ID do item
     */
    function iniciarChecklist(modeloId, itemTipo, itemId) {
        showLoading('Iniciando checklist...');
        
        // Preparar dados
        const data = {
            modelo_id: modeloId
        };
        
        if (itemTipo && itemId) {
            data.item_tipo = itemTipo;
            data.item_id = itemId;
        }
        
        // Criar novo checklist
        api.post('/checklist/iniciar', data)
            .then(response => {
                hideLoading();
                
                // Armazenar checklist atual
                checklistAtual = response.data;
                
                // Exibir formulário de checklist
                renderChecklistForm(checklistAtual);
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao iniciar checklist:', error);
                showMessage('Erro ao iniciar checklist', 'error');
            });
    }

    /**
     * Renderiza o formulário de checklist
     * @param {Object} checklist - Dados do checklist
     */
    function renderChecklistForm(checklist) {
        const container = document.getElementById(config.checklistContainer);
        
        if (!container) {
            console.error('Container para checklist não encontrado');
            return;
        }
        
        // Limpar container
        container.innerHTML = '';
        
        // Criar cabeçalho
        const header = document.createElement('div');
        header.className = 'card mb-4';
        
        const headerBody = document.createElement('div');
        headerBody.className = 'card-body';
        
        const headerTitle = document.createElement('h4');
        headerTitle.className = 'card-title';
        headerTitle.textContent = checklist.modelo.nome;
        
        const headerInfo = document.createElement('div');
        headerInfo.className = 'row mt-3';
        
        // Informações do item inspecionado
        const itemInfoCol = document.createElement('div');
        itemInfoCol.className = 'col-md-6';
        
        const itemInfoCard = document.createElement('div');
        itemInfoCard.className = 'card h-100';
        
        const itemInfoCardBody = document.createElement('div');
        itemInfoCardBody.className = 'card-body';
        
        const itemInfoTitle = document.createElement('h5');
        itemInfoTitle.className = 'card-title';
        itemInfoTitle.textContent = 'Item Inspecionado';
        
        const itemInfoContent = document.createElement('div');
        
        if (checklist.item) {
            const itemNome = document.createElement('p');
            itemNome.className = 'mb-1';
            itemNome.innerHTML = `<strong>${getTipoItemText(checklist.item_tipo)}:</strong> ${checklist.item.nome}`;
            
            const itemCondominio = document.createElement('p');
            itemCondominio.className = 'mb-1';
            itemCondominio.innerHTML = `<strong>Condomínio:</strong> ${checklist.condominio.nome}`;
            
            itemInfoContent.appendChild(itemNome);
            itemInfoContent.appendChild(itemCondominio);
            
            if (checklist.item.localizacao) {
                const itemLocalizacao = document.createElement('p');
                itemLocalizacao.className = 'mb-1';
                itemLocalizacao.innerHTML = `<strong>Localização:</strong> ${checklist.item.localizacao}`;
                itemInfoContent.appendChild(itemLocalizacao);
            }
        } else {
            const itemCondominio = document.createElement('p');
            itemCondominio.className = 'mb-1';
            itemCondominio.innerHTML = `<strong>Condomínio:</strong> ${checklist.condominio.nome}`;
            
            itemInfoContent.appendChild(itemCondominio);
        }
        
        itemInfoCardBody.appendChild(itemInfoTitle);
        itemInfoCardBody.appendChild(itemInfoContent);
        
        itemInfoCard.appendChild(itemInfoCardBody);
        itemInfoCol.appendChild(itemInfoCard);
        
        // Informações da inspeção
        const inspecaoInfoCol = document.createElement('div');
        inspecaoInfoCol.className = 'col-md-6';
        
        const inspecaoInfoCard = document.createElement('div');
        inspecaoInfoCard.className = 'card h-100';
        
        const inspecaoInfoCardBody = document.createElement('div');
        inspecaoInfoCardBody.className = 'card-body';
        
        const inspecaoInfoTitle = document.createElement('h5');
        inspecaoInfoTitle.className = 'card-title';
        inspecaoInfoTitle.textContent = 'Informações da Inspeção';
        
        const inspecaoInfoContent = document.createElement('div');
        
        const inspecaoData = document.createElement('p');
        inspecaoData.className = 'mb-1';
        inspecaoData.innerHTML = `<strong>Data:</strong> ${formatDate(checklist.data_inicio)}`;
        
        const inspecaoResponsavel = document.createElement('p');
        inspecaoResponsavel.className = 'mb-1';
        inspecaoResponsavel.innerHTML = `<strong>Responsável:</strong> ${checklist.responsavel.nome}`;
        
        const inspecaoModelo = document.createElement('p');
        inspecaoModelo.className = 'mb-1';
        inspecaoModelo.innerHTML = `<strong>Modelo:</strong> ${checklist.modelo.nome}`;
        
        inspecaoInfoContent.appendChild(inspecaoData);
        inspecaoInfoContent.appendChild(inspecaoResponsavel);
        inspecaoInfoContent.appendChild(inspecaoModelo);
        
        inspecaoInfoCardBody.appendChild(inspecaoInfoTitle);
        inspecaoInfoCardBody.appendChild(inspecaoInfoContent);
        
        inspecaoInfoCard.appendChild(inspecaoInfoCardBody);
        inspecaoInfoCol.appendChild(inspecaoInfoCard);
        
        headerInfo.appendChild(itemInfoCol);
        headerInfo.appendChild(inspecaoInfoCol);
        
        headerBody.appendChild(headerTitle);
        headerBody.appendChild(headerInfo);
        
        header.appendChild(headerBody);
        
        // Criar formulário
        const form = document.createElement('form');
        form.id = 'formChecklist';
        
        // Campo ID (hidden)
        const idField = document.createElement('input');
        idField.type = 'hidden';
        idField.id = 'checklist_id';
        idField.name = 'id';
        idField.value = checklist.id;
        
        form.appendChild(idField);
        
        // Criar itens do checklist
        const itensCard = document.createElement('div');
        itensCard.className = 'card mb-4';
        
        const itensCardHeader = document.createElement('div');
        itensCardHeader.className = 'card-header';
        
        const itensCardTitle = document.createElement('h5');
        itensCardTitle.className = 'card-title mb-0';
        itensCardTitle.textContent = 'Itens de Verificação';
        
        itensCardHeader.appendChild(itensCardTitle);
        
        const itensCardBody = document.createElement('div');
        itensCardBody.className = 'card-body';
        
        // Lista de itens
        checklist.itens.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'card mb-3';
            itemDiv.dataset.itemId = item.id;
            
            const itemHeader = document.createElement('div');
            itemHeader.className = `card-header ${getCriticidadeClass(item.criticidade)}`;
            
            const itemTitle = document.createElement('h6');
            itemTitle.className = 'card-title mb-0 d-flex justify-content-between align-items-center';
            
            const itemTitleText = document.createElement('span');
            itemTitleText.textContent = `${index + 1}. ${item.descricao}`;
            
            const itemCriticidade = document.createElement('span');
            itemCriticidade.className = 'badge bg-secondary';
            itemCriticidade.textContent = getCriticidadeText(item.criticidade);
            
            itemTitle.appendChild(itemTitleText);
            itemTitle.appendChild(itemCriticidade);
            
            itemHeader.appendChild(itemTitle);
            
            const itemBody = document.createElement('div');
            itemBody.className = 'card-body';
            
            // Observações do item
            if (item.observacoes) {
                const itemObs = document.createElement('p');
                itemObs.className = 'text-muted mb-3';
                itemObs.textContent = item.observacoes;
                
                itemBody.appendChild(itemObs);
            }
            
            // Campo de resposta
            const respostaDiv = document.createElement('div');
            respostaDiv.className = 'mb-3';
            
            const respostaLabel = document.createElement('label');
            respostaLabel.htmlFor = `resposta_${item.id}`;
            respostaLabel.className = 'form-label';
            respostaLabel.textContent = 'Avaliação';
            
            // Criar campo de resposta de acordo com o tipo
            let respostaField;
            
            switch (item.tipo_resposta) {
                case 'sim_nao':
                    respostaField = document.createElement('div');
                    respostaField.className = 'btn-group w-100';
                    respostaField.setAttribute('role', 'group');
                    
                    const simBtn = document.createElement('input');
                    simBtn.type = 'radio';
                    simBtn.className = 'btn-check';
                    simBtn.name = `respostas[${item.id}]`;
                    simBtn.id = `resposta_${item.id}_sim`;
                    simBtn.value = 'sim';
                    simBtn.required = true;
                    
                    const simLabel = document.createElement('label');
                    simLabel.className = 'btn btn-outline-success';
                    simLabel.htmlFor = `resposta_${item.id}_sim`;
                    simLabel.textContent = 'Sim';
                    
                    const naoBtn = document.createElement('input');
                    naoBtn.type = 'radio';
                    naoBtn.className = 'btn-check';
                    naoBtn.name = `respostas[${item.id}]`;
                    naoBtn.id = `resposta_${item.id}_nao`;
                    naoBtn.value = 'nao';
                    
                    const naoLabel = document.createElement('label');
                    naoLabel.className = 'btn btn-outline-danger';
                    naoLabel.htmlFor = `resposta_${item.id}_nao`;
                    naoLabel.textContent = 'Não';
                    
                    respostaField.appendChild(simBtn);
                    respostaField.appendChild(simLabel);
                    respostaField.appendChild(naoBtn);
                    respostaField.appendChild(naoLabel);
                    break;
                    
                case 'conforme_nao_conforme':
                    respostaField = document.createElement('div');
                    respostaField.className = 'btn-group w-100';
                    respostaField.setAttribute('role', 'group');
                    
                    const conformeBtn = document.createElement('input');
                    conformeBtn.type = 'radio';
                    conformeBtn.className = 'btn-check';
                    conformeBtn.name = `respostas[${item.id}]`;
                    conformeBtn.id = `resposta_${item.id}_conforme`;
                    conformeBtn.value = 'conforme';
                    conformeBtn.required = true;
                    
                    const conformeLabel = document.createElement('label');
                    conformeLabel.className = 'btn btn-outline-success';
                    conformeLabel.htmlFor = `resposta_${item.id}_conforme`;
                    conformeLabel.textContent = 'Conforme';
                    
                    const naoConformeBtn = document.createElement('input');
                    naoConformeBtn.type = 'radio';
                    naoConformeBtn.className = 'btn-check';
                    naoConformeBtn.name = `respostas[${item.id}]`;
                    naoConformeBtn.id = `resposta_${item.id}_nao_conforme`;
                    naoConformeBtn.value = 'nao_conforme';
                    
                    const naoConformeLabel = document.createElement('label');
                    naoConformeLabel.className = 'btn btn-outline-danger';
                    naoConformeLabel.htmlFor = `resposta_${item.id}_nao_conforme`;
                    naoConformeLabel.textContent = 'Não Conforme';
                    
                    respostaField.appendChild(conformeBtn);
                    respostaField.appendChild(conformeLabel);
                    respostaField.appendChild(naoConformeBtn);
                    respostaField.appendChild(naoConformeLabel);
                    break;
                    
                case 'escala':
                    respostaField = document.createElement('div');
                    respostaField.className = 'btn-group w-100';
                    respostaField.setAttribute('role', 'group');
                    
                    for (let i = 1; i <= 5; i++) {
                        const escalaBtn = document.createElement('input');
                        escalaBtn.type = 'radio';
                        escalaBtn.className = 'btn-check';
                        escalaBtn.name = `respostas[${item.id}]`;
                        escalaBtn.id = `resposta_${item.id}_${i}`;
                        escalaBtn.value = i.toString();
                        escalaBtn.required = i === 1;
                        
                        const escalaLabel = document.createElement('label');
                        escalaLabel.className = `btn btn-outline-${getEscalaClass(i)}`;
                        escalaLabel.htmlFor = `resposta_${item.id}_${i}`;
                        escalaLabel.textContent = i.toString();
                        
                        respostaField.appendChild(escalaBtn);
                        respostaField.appendChild(escalaLabel);
                    }
                    break;
                    
                case 'texto':
                default:
                    respostaField = document.createElement('textarea');
                    respostaField.className = 'form-control';
                    respostaField.id = `resposta_${item.id}`;
                    respostaField.name = `respostas[${item.id}]`;
                    respostaField.rows = 2;
                    respostaField.required = true;
                    break;
            }
            
            respostaDiv.appendChild(respostaLabel);
            respostaDiv.appendChild(respostaField);
            
            // Campo de observações
            const obsDiv = document.createElement('div');
            obsDiv.className = 'mb-0';
            
            const obsLabel = document.createElement('label');
            obsLabel.htmlFor = `observacao_${item.id}`;
            obsLabel.className = 'form-label';
            obsLabel.textContent = 'Observações';
            
            const obsField = document.createElement('textarea');
            obsField.className = 'form-control';
            obsField.id = `observacao_${item.id}`;
            obsField.name = `observacoes[${item.id}]`;
            obsField.rows = 2;
            
            obsDiv.appendChild(obsLabel);
            obsDiv.appendChild(obsField);
            
            // Adicionar campos ao item
            itemBody.appendChild(respostaDiv);
            itemBody.appendChild(obsDiv);
            
            // Adicionar header e body ao item
            itemDiv.appendChild(itemHeader);
            itemDiv.appendChild(itemBody);
            
            // Adicionar item ao card
            itensCardBody.appendChild(itemDiv);
        });
        
        itensCard.appendChild(itensCardHeader);
        itensCard.appendChild(itensCardBody);
        
        // Adicionar card de itens ao formulário
        form.appendChild(itensCard);
        
        // Campo de observações gerais
        const obsGeraisCard = document.createElement('div');
        obsGeraisCard.className = 'card mb-4';
        
        const obsGeraisCardHeader = document.createElement('div');
        obsGeraisCardHeader.className = 'card-header';
        
        const obsGeraisCardTitle = document.createElement('h5');
        obsGeraisCardTitle.className = 'card-title mb-0';
        obsGeraisCardTitle.textContent = 'Observações Gerais';
        
        obsGeraisCardHeader.appendChild(obsGeraisCardTitle);
        
        const obsGeraisCardBody = document.createElement('div');
        obsGeraisCardBody.className = 'card-body';
        
        const obsGeraisField = document.createElement('textarea');
        obsGeraisField.className = 'form-control';
        obsGeraisField.id = 'observacoes_gerais';
        obsGeraisField.name = 'observacoes_gerais';
        obsGeraisField.rows = 4;
        obsGeraisField.placeholder = 'Observações gerais sobre a inspeção...';
        
        obsGeraisCardBody.appendChild(obsGeraisField);
        
        obsGeraisCard.appendChild(obsGeraisCardHeader);
        obsGeraisCard.appendChild(obsGeraisCardBody);
        
        // Adicionar card de observações gerais ao formulário
        form.appendChild(obsGeraisCard);
        
        // Botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'd-flex justify-content-between';
        
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-secondary';
        cancelButton.textContent = 'Cancelar';
        cancelButton.addEventListener('click', () => {
            if (confirm('Deseja realmente cancelar este checklist? Os dados não serão salvos.')) {
                cancelarChecklist(checklist.id);
            }
        });
        
        const submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.className = 'btn btn-primary';
        submitButton.textContent = 'Concluir Checklist';
        submitButton.addEventListener('click', () => {
            concluirChecklist();
        });
        
        actionsDiv.appendChild(cancelButton);
        actionsDiv.appendChild(submitButton);
        
        form.appendChild(actionsDiv);
        
        // Adicionar elementos ao container
        container.appendChild(header);
        container.appendChild(form);
        
        // Mostrar container
        container.style.display = 'block';
        
        // Rolar para o container
        container.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Conclui o checklist atual
     */
    function concluirChecklist() {
        // Validar formulário
        const form = document.getElementById('formChecklist');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Coletar dados do formulário
        const checklistId = document.getElementById('checklist_id').value;
        
        const formData = {
            id: checklistId,
            observacoes_gerais: document.getElementById('observacoes_gerais').value,
            respostas: {},
            observacoes: {}
        };
        
        // Coletar respostas
        checklistAtual.itens.forEach(item => {
            const itemId = item.id;
            
            // Obter resposta de acordo com o tipo
            let resposta;
            
            switch (item.tipo_resposta) {
                case 'sim_nao':
                case 'conforme_nao_conforme':
                    const radioChecked = document.querySelector(`input[name="respostas[${itemId}]"]:checked`);
                    resposta = radioChecked ? radioChecked.value : null;
                    break;
                    
                case 'escala':
                    const escalaChecked = document.querySelector(`input[name="respostas[${itemId}]"]:checked`);
                    resposta = escalaChecked ? parseInt(escalaChecked.value) : null;
                    break;
                    
                case 'texto':
                default:
                    resposta = document.getElementById(`resposta_${itemId}`).value;
                    break;
            }
            
            // Obter observação
            const observacao = document.getElementById(`observacao_${itemId}`).value;
            
            // Adicionar aos dados
            formData.respostas[itemId] = resposta;
            formData.observacoes[itemId] = observacao;
        });
        
        // Enviar dados para API
        showLoading('Concluindo checklist...');
        
        api.post(`/checklist/${checklistId}/concluir`, formData)
            .then(response => {
                hideLoading();
                
                // Limpar checklist atual
                checklistAtual = null;
                
                // Limpar formulário
                const container = document.getElementById(config.checklistContainer);
                container.innerHTML = '';
                container.style.display = 'none';
                
                // Exibir resultado
                showChecklistResult(response.data);
                
                // Exibir mensagem de sucesso
                showMessage('Checklist concluído com sucesso', 'success');
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao concluir checklist:', error);
                showMessage('Erro ao concluir checklist', 'error');
            });
    }

    /**
     * Cancela um checklist em andamento
     * @param {number} checklistId - ID do checklist
     */
    function cancelarChecklist(checklistId) {
        showLoading('Cancelando checklist...');
        
        api.post(`/checklist/${checklistId}/cancelar`)
            .then(() => {
                hideLoading();
                
                // Limpar checklist atual
                checklistAtual = null;
                
                // Limpar formulário
                const container = document.getElementById(config.checklistContainer);
                container.innerHTML = '';
                container.style.display = 'none';
                
                // Exibir mensagem
                showMessage('Checklist cancelado', 'info');
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao cancelar checklist:', error);
                showMessage('Erro ao cancelar checklist', 'error');
            });
    }

    /**
     * Exibe o resultado do checklist
     * @param {Object} resultado - Dados do resultado do checklist
     */
    function showChecklistResult(resultado) {
        const container = document.getElementById(config.resultContainer);
        
        if (!container) {
            console.error('Container para resultado de checklist não encontrado');
            return;
        }
        
        // Limpar container
        container.innerHTML = '';
        
        // Criar cabeçalho
        const header = document.createElement('div');
        header.className = 'card mb-4';
        
        const headerBody = document.createElement('div');
        headerBody.className = 'card-body';
        
        const headerTitle = document.createElement('h4');
        headerTitle.className = 'card-title';
        headerTitle.textContent = 'Resultado da Inspeção';
        
        const headerSubtitle = document.createElement('h6');
        headerSubtitle.className = 'card-subtitle mb-3 text-muted';
        headerSubtitle.textContent = resultado.modelo.nome;
        
        // Resumo do resultado
        const resumoRow = document.createElement('div');
        resumoRow.className = 'row mt-3';
        
        // Informações básicas
        const infoCol = document.createElement('div');
        infoCol.className = 'col-md-6';
        
        const infoCard = document.createElement('div');
        infoCard.className = 'card h-100';
        
        const infoCardBody = document.createElement('div');
        infoCardBody.className = 'card-body';
        
        const infoTitle = document.createElement('h5');
        infoTitle.className = 'card-title';
        infoTitle.textContent = 'Informações da Inspeção';
        
        const infoContent = document.createElement('div');
        
        const infoItem = document.createElement('p');
        infoItem.className = 'mb-1';
        infoItem.innerHTML = `<strong>Item:</strong> ${resultado.item ? resultado.item.nome : resultado.condominio.nome}`;
        
        const infoCondominio = document.createElement('p');
        infoCondominio.className = 'mb-1';
        infoCondominio.innerHTML = `<strong>Condomínio:</strong> ${resultado.condominio.nome}`;
        
        const infoResponsavel = document.createElement('p');
        infoResponsavel.className = 'mb-1';
        infoResponsavel.innerHTML = `<strong>Responsável:</strong> ${resultado.responsavel.nome}`;
        
        const infoDataInicio = document.createElement('p');
        infoDataInicio.className = 'mb-1';
        infoDataInicio.innerHTML = `<strong>Data de Início:</strong> ${formatDate(resultado.data_inicio)}`;
        
        const infoDataConclusao = document.createElement('p');
        infoDataConclusao.className = 'mb-1';
        infoDataConclusao.innerHTML = `<strong>Data de Conclusão:</strong> ${formatDate(resultado.data_conclusao)}`;
        
        infoContent.appendChild(infoItem);
        infoContent.appendChild(infoCondominio);
        infoContent.appendChild(infoResponsavel);
        infoContent.appendChild(infoDataInicio);
        infoContent.appendChild(infoDataConclusao);
        
        infoCardBody.appendChild(infoTitle);
        infoCardBody.appendChild(infoContent);
        
        infoCard.appendChild(infoCardBody);
        infoCol.appendChild(infoCard);
        
        // Estatísticas
        const statsCol = document.createElement('div');
        statsCol.className = 'col-md-6';
        
        const statsCard = document.createElement('div');
        statsCard.className = 'card h-100';
        
        const statsCardBody = document.createElement('div');
        statsCardBody.className = 'card-body';
        
        const statsTitle = document.createElement('h5');
        statsTitle.className = 'card-title';
        statsTitle.textContent = 'Resumo dos Resultados';
        
        const statsContent = document.createElement('div');
        
        // Calcular estatísticas
        const totalItens = resultado.itens.length;
        let conformes = 0;
        let naoConformes = 0;
        let criticos = 0;
        
        resultado.itens.forEach(item => {
            const resposta = item.resposta;
            
            if (
                resposta === 'sim' || 
                resposta === 'conforme' || 
                (typeof resposta === 'number' && resposta >= 4)
            ) {
                conformes++;
            } else if (
                resposta === 'nao' || 
                resposta === 'nao_conforme' || 
                (typeof resposta === 'number' && resposta <= 2)
            ) {
                naoConformes++;
                
                if (item.criticidade === 'alta' || item.criticidade === 'critica') {
                    criticos++;
                }
            }
        });
        
        const conformidadePercent = Math.round((conformes / totalItens) * 100);
        
        // Status geral
        const statusGeral = document.createElement('div');
        statusGeral.className = 'mb-3';
        
        const statusTitle = document.createElement('h6');
        statusTitle.textContent = 'Status Geral';
        
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${criticos > 0 ? 'bg-danger' : conformidadePercent >= 80 ? 'bg-success' : 'bg-warning'} fs-6`;
        statusBadge.textContent = criticos > 0 ? 'Crítico' : conformidadePercent >= 80 ? 'Aprovado' : 'Atenção';
        
        statusGeral.appendChild(statusTitle);
        statusGeral.appendChild(statusBadge);
        
        // Progresso de conformidade
        const conformidadeDiv = document.createElement('div');
        conformidadeDiv.className = 'mb-3';
        
        const conformidadeTitle = document.createElement('h6');
        conformidadeTitle.textContent = 'Índice de Conformidade';
        
        const conformidadeProgress = document.createElement('div');
        conformidadeProgress.className = 'progress';
        conformidadeProgress.style.height = '25px';
        
        const conformidadeBar = document.createElement('div');
        conformidadeBar.className = `progress-bar ${getConformidadeClass(conformidadePercent)}`;
        conformidadeBar.style.width = `${conformidadePercent}%`;
        conformidadeBar.textContent = `${conformidadePercent}%`;
        
        conformidadeProgress.appendChild(conformidadeBar);
        
        conformidadeDiv.appendChild(conformidadeTitle);
        conformidadeDiv.appendChild(conformidadeProgress);
        
        // Estatísticas detalhadas
        const statsDetails = document.createElement('div');
        statsDetails.className = 'mt-3';
        
        const statsTable = document.createElement('table');
        statsTable.className = 'table table-sm';
        
        const statsTableBody = document.createElement('tbody');
        
        const rowTotal = document.createElement('tr');
        rowTotal.innerHTML = `
            <td><strong>Total de Itens</strong></td>
            <td class="text-end">${totalItens}</td>
        `;
        
        const rowConformes = document.createElement('tr');
        rowConformes.innerHTML = `
            <td><span class="text-success">Conformes</span></td>
            <td class="text-end">${conformes}</td>
        `;
        
        const rowNaoConformes = document.createElement('tr');
        rowNaoConformes.innerHTML = `
            <td><span class="text-danger">Não Conformes</span></td>
            <td class="text-end">${naoConformes}</td>
        `;
        
        const rowCriticos = document.createElement('tr');
        rowCriticos.innerHTML = `
            <td><span class="text-danger fw-bold">Críticos</span></td>
            <td class="text-end">${criticos}</td>
        `;
        
        statsTableBody.appendChild(rowTotal);
        statsTableBody.appendChild(rowConformes);
        statsTableBody.appendChild(rowNaoConformes);
        statsTableBody.appendChild(rowCriticos);
        
        statsTable.appendChild(statsTableBody);
        
        statsDetails.appendChild(statsTable);
        
        statsContent.appendChild(statusGeral);
        statsContent.appendChild(conformidadeDiv);
        statsContent.appendChild(statsDetails);
        
        statsCardBody.appendChild(statsTitle);
        statsCardBody.appendChild(statsContent);
        
        statsCard.appendChild(statsCardBody);
        statsCol.appendChild(statsCard);
        
        resumoRow.appendChild(infoCol);
        resumoRow.appendChild(statsCol);
        
        headerBody.appendChild(headerTitle);
        headerBody.appendChild(headerSubtitle);
        headerBody.appendChild(resumoRow);
        
        header.appendChild(headerBody);
        
        // Observações gerais
        const obsCard = document.createElement('div');
        obsCard.className = 'card mb-4';
        
        const obsCardHeader = document.createElement('div');
        obsCardHeader.className = 'card-header';
        
        const obsCardTitle = document.createElement('h5');
        obsCardTitle.className = 'card-title mb-0';
        obsCardTitle.textContent = 'Observações Gerais';
        
        obsCardHeader.appendChild(obsCardTitle);
        
        const obsCardBody = document.createElement('div');
        obsCardBody.className = 'card-body';
        
        const obsContent = document.createElement('p');
        obsContent.textContent = resultado.observacoes_gerais || 'Nenhuma observação geral registrada.';
        
        obsCardBody.appendChild(obsContent);
        
        obsCard.appendChild(obsCardHeader);
        obsCard.appendChild(obsCardBody);
        
        // Itens do checklist
        const itensCard = document.createElement('div');
        itensCard.className = 'card mb-4';
        
        const itensCardHeader = document.createElement('div');
        itensCardHeader.className = 'card-header d-flex justify-content-between align-items-center';
        
        const itensCardTitle = document.createElement('h5');
        itensCardTitle.className = 'card-title mb-0';
        itensCardTitle.textContent = 'Itens Verificados';
        
        // Filtros
        const filtrosDiv = document.createElement('div');
        filtrosDiv.className = 'btn-group';
        
        const filtroTodos = document.createElement('button');
        filtroTodos.type = 'button';
        filtroTodos.className = 'btn btn-sm btn-outline-secondary active';
        filtroTodos.textContent = 'Todos';
        filtroTodos.dataset.filter = 'todos';
        
        const filtroConformes = document.createElement('button');
        filtroConformes.type = 'button';
        filtroConformes.className = 'btn btn-sm btn-outline-success';
        filtroConformes.textContent = 'Conformes';
        filtroConformes.dataset.filter = 'conformes';
        
        const filtroNaoConformes = document.createElement('button');
        filtroNaoConformes.type = 'button';
        filtroNaoConformes.className = 'btn btn-sm btn-outline-danger';
        filtroNaoConformes.textContent = 'Não Conformes';
        filtroNaoConformes.dataset.filter = 'nao-conformes';
        
        // Adicionar eventos de filtro
        [filtroTodos, filtroConformes, filtroNaoConformes].forEach(btn => {
            btn.addEventListener('click', function() {
                // Remover classe active de todos os botões
                filtrosDiv.querySelectorAll('button').forEach(b => {
                    b.classList.remove('active');
                });
                
                // Adicionar classe active ao botão clicado
                this.classList.add('active');
                
                // Aplicar filtro
                const filter = this.dataset.filter;
                
                document.querySelectorAll('.item-checklist').forEach(item => {
                    if (filter === 'todos') {
                        item.style.display = 'block';
                    } else if (filter === 'conformes') {
                        item.style.display = item.classList.contains('item-conforme') ? 'block' : 'none';
                    } else if (filter === 'nao-conformes') {
                        item.style.display = item.classList.contains('item-nao-conforme') ? 'block' : 'none';
                    }
                });
            });
        });
        
        filtrosDiv.appendChild(filtroTodos);
        filtrosDiv.appendChild(filtroConformes);
        filtrosDiv.appendChild(filtroNaoConformes);
        
        itensCardHeader.appendChild(itensCardTitle);
        itensCardHeader.appendChild(filtrosDiv);
        
        const itensCardBody = document.createElement('div');
        itensCardBody.className = 'card-body';
        
        // Lista de itens
        resultado.itens.forEach((item, index) => {
            // Determinar se é conforme ou não conforme
            const isConforme = 
                item.resposta === 'sim' || 
                item.resposta === 'conforme' || 
                (typeof item.resposta === 'number' && item.resposta >= 4);
                
            const isNaoConforme = 
                item.resposta === 'nao' || 
                item.resposta === 'nao_conforme' || 
                (typeof item.resposta === 'number' && item.resposta <= 2);
            
            const itemDiv = document.createElement('div');
            itemDiv.className = `card mb-3 item-checklist ${isConforme ? 'item-conforme' : ''} ${isNaoConforme ? 'item-nao-conforme' : ''}`;
            
            const itemHeader = document.createElement('div');
            itemHeader.className = `card-header ${isNaoConforme ? 'bg-danger-subtle' : isConforme ? 'bg-success-subtle' : 'bg-light'}`;
            
            const itemTitle = document.createElement('h6');
            itemTitle.className = 'card-title mb-0 d-flex justify-content-between align-items-center';
            
            const itemTitleText = document.createElement('span');
            itemTitleText.textContent = `${index + 1}. ${item.descricao}`;
            
            // Badge de resposta
            const itemResposta = document.createElement('span');
            itemResposta.className = `badge ${isNaoConforme ? 'bg-danger' : isConforme ? 'bg-success' : 'bg-secondary'}`;
            
            // Formatar resposta de acordo com o tipo
            let respostaText = '';
            
            switch (item.tipo_resposta) {
                case 'sim_nao':
                    respostaText = item.resposta === 'sim' ? 'Sim' : 'Não';
                    break;
                    
                case 'conforme_nao_conforme':
                    respostaText = item.resposta === 'conforme' ? 'Conforme' : 'Não Conforme';
                    break;
                    
                case 'escala':
                    respostaText = `${item.resposta}/5`;
                    break;
                    
                case 'texto':
                default:
                    respostaText = 'Texto';
                    break;
            }
            
            itemResposta.textContent = respostaText;
            
            itemTitle.appendChild(itemTitleText);
            itemTitle.appendChild(itemResposta);
            
            itemHeader.appendChild(itemTitle);
            
            const itemBody = document.createElement('div');
            itemBody.className = 'card-body';
            
            // Criticidade
            const itemCriticidade = document.createElement('div');
            itemCriticidade.className = 'mb-2';
            
            const criticidadeBadge = document.createElement('span');
            criticidadeBadge.className = `badge ${getCriticidadeClass(item.criticidade)}`;
            criticidadeBadge.textContent = getCriticidadeText(item.criticidade);
            
            itemCriticidade.appendChild(document.createTextNode('Criticidade: '));
            itemCriticidade.appendChild(criticidadeBadge);
            
            // Resposta detalhada (para texto)
            if (item.tipo_resposta === 'texto') {
                const itemRespostaDetalhada = document.createElement('div');
                itemRespostaDetalhada.className = 'mb-2';
                
                const respostaLabel = document.createElement('strong');
                respostaLabel.textContent = 'Resposta: ';
                
                const respostaTexto = document.createElement('span');
                respostaTexto.textContent = item.resposta;
                
                itemRespostaDetalhada.appendChild(respostaLabel);
                itemRespostaDetalhada.appendChild(respostaTexto);
                
                itemBody.appendChild(itemRespostaDetalhada);
            }
            
            // Observações do item
            if (item.observacao) {
                const itemObservacao = document.createElement('div');
                itemObservacao.className = 'mb-0';
                
                const observacaoLabel = document.createElement('strong');
                observacaoLabel.textContent = 'Observações: ';
                
                const observacaoTexto = document.createElement('span');
                observacaoTexto.textContent = item.observacao;
                
                itemObservacao.appendChild(observacaoLabel);
                itemObservacao.appendChild(observacaoTexto);
                
                itemBody.appendChild(itemCriticidade);
                itemBody.appendChild(itemObservacao);
            } else {
                itemBody.appendChild(itemCriticidade);
            }
            
            // Adicionar header e body ao item
            itemDiv.appendChild(itemHeader);
            itemDiv.appendChild(itemBody);
            
            // Adicionar item ao card
            itensCardBody.appendChild(itemDiv);
        });
        
        itensCard.appendChild(itensCardHeader);
        itensCard.appendChild(itensCardBody);
        
        // Botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'd-flex justify-content-between';
        
        const backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.className = 'btn btn-secondary';
        backButton.textContent = 'Voltar';
        backButton.addEventListener('click', () => {
            // Limpar resultado
            container.innerHTML = '';
            container.style.display = 'none';
        });
        
        const printButton = document.createElement('button');
        printButton.type = 'button';
        printButton.className = 'btn btn-primary';
        printButton.textContent = 'Imprimir Relatório';
        printButton.addEventListener('click', () => {
            imprimirRelatorio(resultado);
        });
        
        actionsDiv.appendChild(backButton);
        actionsDiv.appendChild(printButton);
        
        // Adicionar elementos ao container
        container.appendChild(header);
        container.appendChild(obsCard);
        container.appendChild(itensCard);
        container.appendChild(actionsDiv);
        
        // Mostrar container
        container.style.display = 'block';
        
        // Rolar para o container
        container.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Carrega o histórico de checklists
     * @param {string} itemTipo - Tipo do item (equipamento, area, condominio)
     * @param {number} itemId - ID do item
     */
    function carregarHistoricoChecklists(itemTipo, itemId) {
        showLoading('Carregando histórico...');
        
        // Construir query string
        const params = new URLSearchParams();
        
        if (itemTipo) {
            params.append('item_tipo', itemTipo);
        }
        
        if (itemId) {
            params.append('item_id', itemId);
        }
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        
        api.get(`/checklist/historico${queryString}`)
            .then(response => {
                hideLoading();
                
                // Exibir histórico
                showHistoricoChecklists(response.data, itemTipo, itemId);
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao carregar histórico de checklists:', error);
                showMessage('Erro ao carregar histórico de checklists', 'error');
            });
    }

    /**
     * Exibe o histórico de checklists
     * @param {Array} historico - Lista de checklists
     * @param {string} itemTipo - Tipo do item
     * @param {number} itemId - ID do item
     */
    function showHistoricoChecklists(historico, itemTipo, itemId) {
        // Criar modal
        const modalId = 'historicoChecklistModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            // Criar modal se não existir
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-hidden', 'true');
            
            const modalDialog = document.createElement('div');
            modalDialog.className = 'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            
            const modalTitle = document.createElement('h5');
            modalTitle.className = 'modal-title';
            modalTitle.id = `${modalId}Label`;
            modalTitle.textContent = 'Histórico de Inspeções';
            
            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'btn-close';
            closeButton.setAttribute('data-bs-dismiss', 'modal');
            closeButton.setAttribute('aria-label', 'Fechar');
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            
            const closeModalButton = document.createElement('button');
            closeModalButton.type = 'button';
            closeModalButton.className = 'btn btn-secondary';
            closeModalButton.textContent = 'Fechar';
            closeModalButton.setAttribute('data-bs-dismiss', 'modal');
            
            modalFooter.appendChild(closeModalButton);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            
            modalDialog.appendChild(modalContent);
            modal.appendChild(modalDialog);
            
            document.body.appendChild(modal);
        }
        
        // Atualizar título do modal
        const modalTitle = modal.querySelector('.modal-title');
        
        if (itemTipo && itemId && historico.length > 0) {
            const item = historico[0].item;
            const tipoText = getTipoItemText(itemTipo);
            
            modalTitle.textContent = `Histórico de Inspeções - ${tipoText}: ${item ? item.nome : 'Desconhecido'}`;
        } else {
            modalTitle.textContent = 'Histórico de Inspeções';
        }
        
        // Atualizar conteúdo do modal
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = '';
        
        if (historico.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'text-center text-muted';
            emptyMessage.textContent = 'Nenhuma inspeção encontrada.';
            
            modalBody.appendChild(emptyMessage);
        } else {
            // Criar tabela de histórico
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            
            const tableHead = document.createElement('thead');
            tableHead.innerHTML = `
                <tr>
                    <th>Data</th>
                    <th>Modelo</th>
                    <th>Responsável</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            `;
            
            const tableBody = document.createElement('tbody');
            
            historico.forEach(checklist => {
                const row = document.createElement('tr');
                
                // Calcular status
                let status = 'Pendente';
                let statusClass = 'warning';
                
                if (checklist.status === 'concluido') {
                    // Calcular conformidade
                    let conformes = 0;
                    let naoConformes = 0;
                    let criticos = 0;
                    
                    checklist.itens.forEach(item => {
                        const resposta = item.resposta;
                        
                        if (
                            resposta === 'sim' || 
                            resposta === 'conforme' || 
                            (typeof resposta === 'number' && resposta >= 4)
                        ) {
                            conformes++;
                        } else if (
                            resposta === 'nao' || 
                            resposta === 'nao_conforme' || 
                            (typeof resposta === 'number' && resposta <= 2)
                        ) {
                            naoConformes++;
                            
                            if (item.criticidade === 'alta' || item.criticidade === 'critica') {
                                criticos++;
                            }
                        }
                    });
                    
                    const conformidadePercent = Math.round((conformes / checklist.itens.length) * 100);
                    
                    if (criticos > 0) {
                        status = 'Crítico';
                        statusClass = 'danger';
                    } else if (conformidadePercent >= 80) {
                        status = 'Aprovado';
                        statusClass = 'success';
                    } else {
                        status = 'Atenção';
                        statusClass = 'warning';
                    }
                } else if (checklist.status === 'cancelado') {
                    status = 'Cancelado';
                    statusClass = 'secondary';
                }
                
                row.innerHTML = `
                    <td>${formatDate(checklist.data_conclusao || checklist.data_inicio)}</td>
                    <td>${checklist.modelo.nome}</td>
                    <td>${checklist.responsavel.nome}</td>
                    <td><span class="badge bg-${statusClass}">${status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-visualizar-checklist" data-id="${checklist.id}">
                            Visualizar
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            table.appendChild(tableHead);
            table.appendChild(tableBody);
            
            modalBody.appendChild(table);
            
            // Adicionar eventos aos botões de visualização
            modalBody.querySelectorAll('.btn-visualizar-checklist').forEach(btn => {
                btn.addEventListener('click', function() {
                    const checklistId = this.dataset.id;
                    visualizarChecklist(checklistId);
                    
                    // Fechar modal de histórico
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    bsModal.hide();
                });
            });
        }
        
        // Exibir modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Visualiza um checklist específico
     * @param {number} checklistId - ID do checklist
     */
    function visualizarChecklist(checklistId) {
        showLoading('Carregando checklist...');
        
        api.get(`/checklist/${checklistId}`)
            .then(response => {
                hideLoading();
                
                // Exibir resultado
                showChecklistResult(response.data);
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao carregar checklist:', error);
                showMessage('Erro ao carregar checklist', 'error');
            });
    }

    /**
     * Imprime o relatório de checklist
     * @param {Object} checklist - Dados do checklist
     */
    function imprimirRelatorio(checklist) {
        const printWindow = window.open('', '_blank');
        
        // Calcular estatísticas
        const totalItens = checklist.itens.length;
        let conformes = 0;
        let naoConformes = 0;
        let criticos = 0;
        
        checklist.itens.forEach(item => {
            const resposta = item.resposta;
            
            if (
                resposta === 'sim' || 
                resposta === 'conforme' || 
                (typeof resposta === 'number' && resposta >= 4)
            ) {
                conformes++;
            } else if (
                resposta === 'nao' || 
                resposta === 'nao_conforme' || 
                (typeof resposta === 'number' && resposta <= 2)
            ) {
                naoConformes++;
                
                if (item.criticidade === 'alta' || item.criticidade === 'critica') {
                    criticos++;
                }
            }
        });
        
        const conformidadePercent = Math.round((conformes / totalItens) * 100);
        
        // Status geral
        const statusGeral = criticos > 0 ? 'Crítico' : conformidadePercent >= 80 ? 'Aprovado' : 'Atenção';
        const statusClass = criticos > 0 ? 'danger' : conformidadePercent >= 80 ? 'success' : 'warning';
        
        // Gerar HTML para impressão
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Inspeção - ${checklist.modelo.nome}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body {
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                    .page-header {
                        border-bottom: 1px solid #ddd;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                    }
                    .section {
                        margin-bottom: 20px;
                    }
                    .item {
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        margin-bottom: 10px;
                        padding: 10px;
                    }
                    .item-header {
                        background-color: #f8f9fa;
                        padding: 8px;
                        margin: -10px -10px 10px -10px;
                        border-bottom: 1px solid #ddd;
                        border-radius: 4px 4px 0 0;
                    }
                    .conforme {
                        border-left: 5px solid #28a745;
                    }
                    .nao-conforme {
                        border-left: 5px solid #dc3545;
                    }
                    .badge {
                        display: inline-block;
                        padding: 0.25em 0.4em;
                        font-size: 75%;
                        font-weight: 700;
                        line-height: 1;
                        text-align: center;
                        white-space: nowrap;
                        vertical-align: baseline;
                        border-radius: 0.25rem;
                    }
                    .bg-success {
                        background-color: #28a745 !important;
                        color: white;
                    }
                    .bg-danger {
                        background-color: #dc3545 !important;
                        color: white;
                    }
                    .bg-warning {
                        background-color: #ffc107 !important;
                        color: black;
                    }
                    .bg-secondary {
                        background-color: #6c757d !important;
                        color: white;
                    }
                    .progress {
                        display: flex;
                        height: 1rem;
                        overflow: hidden;
                        font-size: .75rem;
                        background-color: #e9ecef;
                        border-radius: 0.25rem;
                    }
                    .progress-bar {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        color: #fff;
                        text-align: center;
                        white-space: nowrap;
                        background-color: #007bff;
                        transition: width .6s ease;
                    }
                    .table {
                        width: 100%;
                        margin-bottom: 1rem;
                        color: #212529;
                        border-collapse: collapse;
                    }
                    .table th,
                    .table td {
                        padding: 0.75rem;
                        vertical-align: top;
                        border-top: 1px solid #dee2e6;
                    }
                    @media print {
                        .no-print {
                            display: none !important;
                        }
                        .page-break {
                            page-break-before: always;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="page-header">
                        <h2>Relatório de Inspeção</h2>
                        <h4>${checklist.modelo.nome}</h4>
                    </div>
                    
                    <div class="row section">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title">Item Inspecionado</h5>
                                    <p><strong>${checklist.item ? getTipoItemText(checklist.item_tipo) : 'Condomínio'}:</strong> ${checklist.item ? checklist.item.nome : checklist.condominio.nome}</p>
                                    <p><strong>Condomínio:</strong> ${checklist.condominio.nome}</p>
                                    ${checklist.item && checklist.item.localizacao ? `<p><strong>Localização:</strong> ${checklist.item.localizacao}</p>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title">Informações da Inspeção</h5>
                                    <p><strong>Data:</strong> ${formatDate(checklist.data_conclusao || checklist.data_inicio)}</p>
                                    <p><strong>Responsável:</strong> ${checklist.responsavel.nome}</p>
                                    <p><strong>Status:</strong> <span class="badge bg-${statusClass}">${statusGeral}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h5>Resumo dos Resultados</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Índice de Conformidade</h6>
                                <div class="progress" style="height: 25px;">
                                    <div class="progress-bar bg-${getConformidadeClass(conformidadePercent)}" 
                                         style="width: ${conformidadePercent}%;">
                                        ${conformidadePercent}%
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <table class="table table-sm">
                                    <tbody>
                                        <tr>
                                            <td><strong>Total de Itens</strong></td>
                                            <td class="text-end">${totalItens}</td>
                                        </tr>
                                        <tr>
                                            <td><span class="text-success">Conformes</span></td>
                                            <td class="text-end">${conformes}</td>
                                        </tr>
                                        <tr>
                                            <td><span class="text-danger">Não Conformes</span></td>
                                            <td class="text-end">${naoConformes}</td>
                                        </tr>
                                        <tr>
                                            <td><span class="text-danger fw-bold">Críticos</span></td>
                                            <td class="text-end">${criticos}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h5>Observações Gerais</h5>
                        <p>${checklist.observacoes_gerais || 'Nenhuma observação geral registrada.'}</p>
                    </div>
                    
                    <div class="section page-break">
                        <h5>Itens Verificados</h5>
                        
                        ${checklist.itens.map((item, index) => {
                            // Determinar se é conforme ou não conforme
                            const isConforme = 
                                item.resposta === 'sim' || 
                                item.resposta === 'conforme' || 
                                (typeof item.resposta === 'number' && item.resposta >= 4);
                                
                            const isNaoConforme = 
                                item.resposta === 'nao' || 
                                item.resposta === 'nao_conforme' || 
                                (typeof item.resposta === 'number' && item.resposta <= 2);
                            
                            // Formatar resposta de acordo com o tipo
                            let respostaText = '';
                            
                            switch (item.tipo_resposta) {
                                case 'sim_nao':
                                    respostaText = item.resposta === 'sim' ? 'Sim' : 'Não';
                                    break;
                                    
                                case 'conforme_nao_conforme':
                                    respostaText = item.resposta === 'conforme' ? 'Conforme' : 'Não Conforme';
                                    break;
                                    
                                case 'escala':
                                    respostaText = `${item.resposta}/5`;
                                    break;
                                    
                                case 'texto':
                                default:
                                    respostaText = item.resposta;
                                    break;
                            }
                            
                            return `
                                <div class="item ${isConforme ? 'conforme' : ''} ${isNaoConforme ? 'nao-conforme' : ''}">
                                    <div class="item-header">
                                        <div class="d-flex justify-content-between">
                                            <strong>${index + 1}. ${item.descricao}</strong>
                                            <span class="badge bg-${isNaoConforme ? 'danger' : isConforme ? 'success' : 'secondary'}">${respostaText}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p><strong>Criticidade:</strong> <span class="badge bg-${getCriticidadeClass(item.criticidade)}">${getCriticidadeText(item.criticidade)}</span></p>
                                        ${item.observacao ? `<p><strong>Observações:</strong> ${item.observacao}</p>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="section no-print">
                        <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
                        <button class="btn btn-secondary" onclick="window.close()">Fechar</button>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        // Imprimir automaticamente após carregar
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    /**
     * Obtém texto para tipo de item
     * @param {string} tipo - Tipo do item
     * @returns {string} Texto do tipo
     */
    function getTipoItemText(tipo) {
        switch (tipo) {
            case 'equipamento': return 'Equipamento';
            case 'area': return 'Área';
            case 'condominio': return 'Condomínio';
            default: return tipo;
        }
    }

    /**
     * Obtém classe CSS para criticidade
     * @param {string} criticidade - Nível de criticidade
     * @returns {string} Classe CSS
     */
    function getCriticidadeClass(criticidade) {
        switch (criticidade) {
            case 'baixa': return 'bg-info';
            case 'media': return 'bg-warning';
            case 'alta': return 'bg-danger';
            case 'critica': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    /**
     * Obtém texto para criticidade
     * @param {string} criticidade - Nível de criticidade
     * @returns {string} Texto da criticidade
     */
    function getCriticidadeText(criticidade) {
        switch (criticidade) {
            case 'baixa': return 'Baixa';
            case 'media': return 'Média';
            case 'alta': return 'Alta';
            case 'critica': return 'Crítica';
            default: return criticidade;
        }
    }

    /**
     * Obtém classe CSS para escala
     * @param {number} valor - Valor da escala
     * @returns {string} Classe CSS
     */
    function getEscalaClass(valor) {
        switch (valor) {
            case 1: return 'danger';
            case 2: return 'warning';
            case 3: return 'secondary';
            case 4: return 'info';
            case 5: return 'success';
            default: return 'secondary';
        }
    }

    /**
     * Obtém classe CSS para conformidade
     * @param {number} percent - Percentual de conformidade
     * @returns {string} Classe CSS
     */
    function getConformidadeClass(percent) {
        if (percent >= 80) {
            return 'bg-success';
        } else if (percent >= 50) {
            return 'bg-warning';
        } else {
            return 'bg-danger';
        }
    }

    /**
     * Formata data para exibição
     * @param {string} dateString - String de data no formato ISO
     * @returns {string} Data formatada
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Exibe mensagem para o usuário
     * @param {string} message - Mensagem a ser exibida
     * @param {string} type - Tipo de mensagem (success, error, warning, info)
     */
    function showMessage(message, type = 'info') {
        // Usar sistema de notificação da aplicação
        if (typeof app !== 'undefined' && app.showNotification) {
            app.showNotification(message, type);
        } else {
            // Fallback para alert
            alert(message);
        }
    }

    /**
     * Exibe indicador de carregamento
     * @param {string} message - Mensagem de carregamento
     */
    function showLoading(message = 'Carregando...') {
        // Usar sistema de loading da aplicação
        if (typeof app !== 'undefined' && app.showLoading) {
            app.showLoading(message);
        }
    }

    /**
     * Esconde indicador de carregamento
     */
    function hideLoading() {
        // Usar sistema de loading da aplicação
        if (typeof app !== 'undefined' && app.hideLoading) {
            app.hideLoading();
        }
    }

    // API simplificada para requisições
    const api = {
        get: function(endpoint) {
            return fetch(`${config.apiBaseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            });
        },
        
        post: function(endpoint, data) {
            return fetch(`${config.apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            });
        },
        
        put: function(endpoint, data) {
            return fetch(`${config.apiBaseUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            });
        },
        
        delete: function(endpoint) {
            return fetch(`${config.apiBaseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            });
        }
    };

    // Expor API pública
    return {
        init,
        loadModelos,
        showModeloForm,
        iniciarChecklist,
        carregarHistoricoChecklists,
        visualizarChecklist
    };
})();

// Inicializar quando documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    ChecklistManager.init({
        apiBaseUrl: '/api',
        autoload: false
    });
});
