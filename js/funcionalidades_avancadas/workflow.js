// workflow.js - Funcionalidades para gerenciamento de workflow de aprovação de manutenções
// Autor: Manus
// Data: 08/06/2025

/**
 * Módulo para gerenciamento de workflow de aprovação de manutenções
 * Permite configurar fluxos de aprovação com múltiplos níveis
 * Integrado com o sistema de notificações
 */

// Configuração inicial
const API_URL = '/api';
let currentWorkflow = null;
let pendingApprovals = [];

/**
 * Inicializa o módulo de workflow
 */
function initWorkflow() {
    // Verifica se o usuário está autenticado
    if (!isAuthenticated()) {
        redirectToLogin();
        return;
    }

    // Carrega workflows pendentes para o usuário atual
    loadPendingApprovals();
    
    // Configura listeners para os botões de ação
    setupEventListeners();
    
    // Verifica se há parâmetros na URL para abrir um workflow específico
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('workflow_id');
    if (workflowId) {
        loadWorkflowDetails(workflowId);
    }
}

/**
 * Carrega aprovações pendentes para o usuário atual
 */
async function loadPendingApprovals() {
    try {
        showLoading('Carregando aprovações pendentes...');
        
        const response = await fetch(`${API_URL}/workflow/pendentes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar aprovações pendentes');
        }
        
        const data = await response.json();
        pendingApprovals = data.approvals || [];
        
        renderPendingApprovals();
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar aprovações pendentes:', error);
        showErrorMessage('Não foi possível carregar as aprovações pendentes. Tente novamente mais tarde.');
        hideLoading();
    }
}

/**
 * Renderiza a lista de aprovações pendentes na interface
 */
function renderPendingApprovals() {
    const container = document.getElementById('pending-approvals-container');
    if (!container) return;
    
    if (pendingApprovals.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Não há aprovações pendentes para você neste momento.</div>';
        return;
    }
    
    let html = '<div class="list-group">';
    
    pendingApprovals.forEach(approval => {
        const urgencyClass = getUrgencyClass(approval.prazo);
        
        html += `
            <a href="#" class="list-group-item list-group-item-action" onclick="loadWorkflowDetails(${approval.id}); return false;">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${escapeHtml(approval.titulo)}</h5>
                    <small class="text-${urgencyClass}">${formatDeadline(approval.prazo)}</small>
                </div>
                <p class="mb-1">${escapeHtml(approval.descricao)}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small>Condomínio: ${escapeHtml(approval.condominio)}</small>
                    <small>Solicitado por: ${escapeHtml(approval.solicitante)}</small>
                </div>
                <div class="progress mt-2" style="height: 5px;">
                    <div class="progress-bar bg-${urgencyClass}" role="progressbar" style="width: ${approval.progresso}%"></div>
                </div>
            </a>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Carrega os detalhes de um workflow específico
 * @param {number} workflowId - ID do workflow a ser carregado
 */
async function loadWorkflowDetails(workflowId) {
    try {
        showLoading('Carregando detalhes do workflow...');
        
        const response = await fetch(`${API_URL}/workflow/${workflowId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar detalhes do workflow');
        }
        
        const data = await response.json();
        currentWorkflow = data.workflow;
        
        renderWorkflowDetails();
        showWorkflowModal();
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar detalhes do workflow:', error);
        showErrorMessage('Não foi possível carregar os detalhes do workflow. Tente novamente mais tarde.');
        hideLoading();
    }
}

/**
 * Renderiza os detalhes do workflow atual na interface
 */
function renderWorkflowDetails() {
    if (!currentWorkflow) return;
    
    // Atualiza o título do modal
    document.getElementById('workflow-modal-title').textContent = `Aprovação: ${currentWorkflow.titulo}`;
    
    // Preenche os detalhes da manutenção
    const detailsContainer = document.getElementById('workflow-details-container');
    
    let stepsHtml = '';
    currentWorkflow.etapas.forEach((etapa, index) => {
        const statusClass = getStatusClass(etapa.status);
        const isCurrentStep = etapa.status === 'pendente';
        const stepNumber = index + 1;
        
        stepsHtml += `
            <div class="workflow-step ${isCurrentStep ? 'current-step' : ''}">
                <div class="step-number bg-${statusClass}">${stepNumber}</div>
                <div class="step-content">
                    <h5>${escapeHtml(etapa.titulo)}</h5>
                    <p>${escapeHtml(etapa.descricao)}</p>
                    <div class="step-meta">
                        <span>Responsável: ${escapeHtml(etapa.responsavel)}</span>
                        <span class="badge bg-${statusClass}">${getStatusLabel(etapa.status)}</span>
                    </div>
                    ${etapa.comentario ? `<div class="step-comment">${escapeHtml(etapa.comentario)}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    const currentStepIndex = currentWorkflow.etapas.findIndex(etapa => etapa.status === 'pendente');
    const canApprove = currentStepIndex !== -1 && currentWorkflow.etapas[currentStepIndex].pode_aprovar;
    
    detailsContainer.innerHTML = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Detalhes da Manutenção</h5>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Condomínio:</strong> ${escapeHtml(currentWorkflow.condominio)}</p>
                        <p><strong>Local:</strong> ${escapeHtml(currentWorkflow.local)}</p>
                        <p><strong>Solicitante:</strong> ${escapeHtml(currentWorkflow.solicitante)}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Data Solicitação:</strong> ${formatDate(currentWorkflow.data_solicitacao)}</p>
                        <p><strong>Prazo:</strong> ${formatDate(currentWorkflow.prazo)}</p>
                        <p><strong>Prioridade:</strong> <span class="badge bg-${getPriorityClass(currentWorkflow.prioridade)}">${currentWorkflow.prioridade}</span></p>
                    </div>
                </div>
                <p><strong>Descrição:</strong> ${escapeHtml(currentWorkflow.descricao)}</p>
                ${currentWorkflow.anexos && currentWorkflow.anexos.length > 0 ? renderAttachments(currentWorkflow.anexos) : ''}
            </div>
        </div>
        
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Fluxo de Aprovação</h5>
                <div class="workflow-steps">
                    ${stepsHtml}
                </div>
            </div>
        </div>
        
        ${canApprove ? `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">Sua Aprovação</h5>
                    <div class="form-group mb-3">
                        <label for="approval-comment">Comentário (opcional):</label>
                        <textarea class="form-control" id="approval-comment" rows="3"></textarea>
                    </div>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-danger me-2" onclick="rejectWorkflow()">Rejeitar</button>
                        <button class="btn btn-success" onclick="approveWorkflow()">Aprovar</button>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
}

/**
 * Aprova o workflow atual
 */
async function approveWorkflow() {
    if (!currentWorkflow) return;
    
    try {
        showLoading('Processando aprovação...');
        
        const comentario = document.getElementById('approval-comment').value;
        
        const response = await fetch(`${API_URL}/workflow/${currentWorkflow.id}/aprovar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comentario: comentario
            })
        });
        
        if (!response.ok) {
            throw new Error('Falha ao aprovar workflow');
        }
        
        hideWorkflowModal();
        showSuccessMessage('Workflow aprovado com sucesso!');
        loadPendingApprovals(); // Recarrega a lista de aprovações pendentes
        hideLoading();
    } catch (error) {
        console.error('Erro ao aprovar workflow:', error);
        showErrorMessage('Não foi possível aprovar o workflow. Tente novamente mais tarde.');
        hideLoading();
    }
}

/**
 * Rejeita o workflow atual
 */
async function rejectWorkflow() {
    if (!currentWorkflow) return;
    
    try {
        showLoading('Processando rejeição...');
        
        const comentario = document.getElementById('approval-comment').value;
        if (!comentario || comentario.trim() === '') {
            showErrorMessage('É necessário fornecer um comentário ao rejeitar uma aprovação.');
            hideLoading();
            return;
        }
        
        const response = await fetch(`${API_URL}/workflow/${currentWorkflow.id}/rejeitar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comentario: comentario
            })
        });
        
        if (!response.ok) {
            throw new Error('Falha ao rejeitar workflow');
        }
        
        hideWorkflowModal();
        showSuccessMessage('Workflow rejeitado com sucesso!');
        loadPendingApprovals(); // Recarrega a lista de aprovações pendentes
        hideLoading();
    } catch (error) {
        console.error('Erro ao rejeitar workflow:', error);
        showErrorMessage('Não foi possível rejeitar o workflow. Tente novamente mais tarde.');
        hideLoading();
    }
}

/**
 * Cria um novo workflow para uma manutenção
 * @param {number} manutencaoId - ID da manutenção
 * @param {Array} etapas - Array de etapas do workflow
 */
async function createWorkflow(manutencaoId, etapas) {
    try {
        showLoading('Criando workflow de aprovação...');
        
        const response = await fetch(`${API_URL}/workflow/criar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                manutencao_id: manutencaoId,
                etapas: etapas
            })
        });
        
        if (!response.ok) {
            throw new Error('Falha ao criar workflow');
        }
        
        const data = await response.json();
        showSuccessMessage('Workflow de aprovação criado com sucesso!');
        hideLoading();
        return data.workflow_id;
    } catch (error) {
        console.error('Erro ao criar workflow:', error);
        showErrorMessage('Não foi possível criar o workflow de aprovação. Tente novamente mais tarde.');
        hideLoading();
        return null;
    }
}

/**
 * Configura um modelo de workflow para um tipo de manutenção
 * @param {number} tipoManutencaoId - ID do tipo de manutenção
 * @param {Array} etapas - Array de etapas do modelo de workflow
 */
async function configureWorkflowTemplate(tipoManutencaoId, etapas) {
    try {
        showLoading('Configurando modelo de workflow...');
        
        const response = await fetch(`${API_URL}/workflow/modelo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo_manutencao_id: tipoManutencaoId,
                etapas: etapas
            })
        });
        
        if (!response.ok) {
            throw new Error('Falha ao configurar modelo de workflow');
        }
        
        showSuccessMessage('Modelo de workflow configurado com sucesso!');
        hideLoading();
        return true;
    } catch (error) {
        console.error('Erro ao configurar modelo de workflow:', error);
        showErrorMessage('Não foi possível configurar o modelo de workflow. Tente novamente mais tarde.');
        hideLoading();
        return false;
    }
}

/**
 * Carrega os modelos de workflow disponíveis
 */
async function loadWorkflowTemplates() {
    try {
        showLoading('Carregando modelos de workflow...');
        
        const response = await fetch(`${API_URL}/workflow/modelos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar modelos de workflow');
        }
        
        const data = await response.json();
        hideLoading();
        return data.modelos || [];
    } catch (error) {
        console.error('Erro ao carregar modelos de workflow:', error);
        showErrorMessage('Não foi possível carregar os modelos de workflow. Tente novamente mais tarde.');
        hideLoading();
        return [];
    }
}

/**
 * Renderiza os anexos de uma manutenção
 * @param {Array} anexos - Array de anexos
 * @returns {string} HTML dos anexos
 */
function renderAttachments(anexos) {
    let html = '<div class="attachments mt-3"><h6>Anexos:</h6><div class="row">';
    
    anexos.forEach(anexo => {
        const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(anexo.extensao.toLowerCase());
        
        html += `
            <div class="col-md-4 col-sm-6 mb-3">
                <div class="card h-100">
                    ${isImage ? `<img src="${anexo.url}" class="card-img-top attachment-thumbnail" alt="${anexo.nome}">` : ''}
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(anexo.nome)}</h5>
                        <p class="card-text"><small>${formatFileSize(anexo.tamanho)}</small></p>
                        <a href="${anexo.url}" class="btn btn-sm btn-primary" target="_blank">Visualizar</a>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

/**
 * Configura os event listeners para os elementos da interface
 */
function setupEventListeners() {
    // Fecha o modal de workflow
    document.getElementById('close-workflow-modal').addEventListener('click', hideWorkflowModal);
    
    // Botão para criar novo workflow
    const newWorkflowBtn = document.getElementById('new-workflow-btn');
    if (newWorkflowBtn) {
        newWorkflowBtn.addEventListener('click', showNewWorkflowModal);
    }
    
    // Botão para configurar modelo de workflow
    const configWorkflowBtn = document.getElementById('config-workflow-btn');
    if (configWorkflowBtn) {
        configWorkflowBtn.addEventListener('click', showWorkflowTemplateModal);
    }
}

/**
 * Exibe o modal de workflow
 */
function showWorkflowModal() {
    const modal = document.getElementById('workflow-modal');
    modal.classList.add('show');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

/**
 * Oculta o modal de workflow
 */
function hideWorkflowModal() {
    const modal = document.getElementById('workflow-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

/**
 * Exibe o modal para criar novo workflow
 */
function showNewWorkflowModal() {
    // Implementação do modal para criar novo workflow
}

/**
 * Exibe o modal para configurar modelo de workflow
 */
function showWorkflowTemplateModal() {
    // Implementação do modal para configurar modelo de workflow
}

/**
 * Retorna a classe CSS para o prazo
 * @param {string} prazo - Data do prazo
 * @returns {string} Classe CSS
 */
function getUrgencyClass(prazo) {
    const hoje = new Date();
    const dataPrazo = new Date(prazo);
    const diffDias = Math.floor((dataPrazo - hoje) / (1000 * 60 * 60 * 24));
    
    if (diffDias < 0) return 'danger';
    if (diffDias < 3) return 'warning';
    return 'success';
}

/**
 * Retorna a classe CSS para o status
 * @param {string} status - Status da etapa
 * @returns {string} Classe CSS
 */
function getStatusClass(status) {
    switch (status) {
        case 'aprovado': return 'success';
        case 'rejeitado': return 'danger';
        case 'pendente': return 'warning';
        case 'aguardando': return 'info';
        default: return 'secondary';
    }
}

/**
 * Retorna o label para o status
 * @param {string} status - Status da etapa
 * @returns {string} Label do status
 */
function getStatusLabel(status) {
    switch (status) {
        case 'aprovado': return 'Aprovado';
        case 'rejeitado': return 'Rejeitado';
        case 'pendente': return 'Pendente';
        case 'aguardando': return 'Aguardando';
        default: return 'Desconhecido';
    }
}

/**
 * Retorna a classe CSS para a prioridade
 * @param {string} prioridade - Prioridade da manutenção
 * @returns {string} Classe CSS
 */
function getPriorityClass(prioridade) {
    switch (prioridade.toLowerCase()) {
        case 'alta': return 'danger';
        case 'média': return 'warning';
        case 'baixa': return 'success';
        default: return 'secondary';
    }
}

/**
 * Formata a data do prazo
 * @param {string} prazo - Data do prazo
 * @returns {string} Data formatada
 */
function formatDeadline(prazo) {
    const hoje = new Date();
    const dataPrazo = new Date(prazo);
    const diffDias = Math.floor((dataPrazo - hoje) / (1000 * 60 * 60 * 24));
    
    if (diffDias < 0) return `Atrasado há ${Math.abs(diffDias)} dias`;
    if (diffDias === 0) return 'Vence hoje';
    if (diffDias === 1) return 'Vence amanhã';
    return `Vence em ${diffDias} dias`;
}

/**
 * Formata uma data
 * @param {string} data - Data a ser formatada
 * @returns {string} Data formatada
 */
function formatDate(data) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(data).toLocaleDateString('pt-BR', options);
}

/**
 * Formata o tamanho de um arquivo
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Escapa caracteres HTML
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Exibe mensagem de sucesso
 * @param {string} message - Mensagem a ser exibida
 */
function showSuccessMessage(message) {
    // Implementação da exibição de mensagem de sucesso
    toastr.success(message);
}

/**
 * Exibe mensagem de erro
 * @param {string} message - Mensagem a ser exibida
 */
function showErrorMessage(message) {
    // Implementação da exibição de mensagem de erro
    toastr.error(message);
}

/**
 * Exibe indicador de carregamento
 * @param {string} message - Mensagem a ser exibida
 */
function showLoading(message) {
    // Implementação da exibição de indicador de carregamento
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
        document.getElementById('loading-message').textContent = message;
        loadingEl.style.display = 'flex';
    }
}

/**
 * Oculta indicador de carregamento
 */
function hideLoading() {
    // Implementação da ocultação de indicador de carregamento
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Exporta as funções para uso global
window.initWorkflow = initWorkflow;
window.loadWorkflowDetails = loadWorkflowDetails;
window.approveWorkflow = approveWorkflow;
window.rejectWorkflow = rejectWorkflow;
window.createWorkflow = createWorkflow;
window.configureWorkflowTemplate = configureWorkflowTemplate;
