// qrcode.js - Funcionalidades para gerenciamento de QR Codes

/**
 * Módulo para gerenciamento de QR Codes de equipamentos e áreas
 */
const QRCodeManager = (function() {
    // Configurações
    const config = {
        apiBaseUrl: '/api',
        qrReaderContainer: 'qr-reader-container',
        qrResultContainer: 'qr-result-container'
    };

    // Cache de dados
    let equipamentosCache = [];
    let areasCache = [];

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
            loadEquipamentos();
            loadAreas();
        }

        console.log('QRCodeManager inicializado');
    }

    /**
     * Configura os listeners de eventos
     */
    function setupEventListeners() {
        // Botão para gerar QR Code de equipamento
        document.querySelectorAll('.btn-gerar-qrcode-equipamento').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const equipamentoId = this.dataset.id;
                gerarQRCodeEquipamento(equipamentoId);
            });
        });

        // Botão para gerar QR Code de área
        document.querySelectorAll('.btn-gerar-qrcode-area').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const areaId = this.dataset.id;
                gerarQRCodeArea(areaId);
            });
        });

        // Botão para iniciar leitura de QR Code
        document.querySelectorAll('.btn-ler-qrcode').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                iniciarLeituraQRCode();
            });
        });

        // Botão para gerar múltiplos QR Codes
        document.querySelectorAll('.btn-gerar-multiplos-qrcodes').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const tipo = this.dataset.tipo;
                const ids = getSelectedIds(tipo);
                if (ids.length > 0) {
                    gerarMultiplosQRCodes(tipo, ids);
                } else {
                    showMessage('Selecione pelo menos um item para gerar QR Codes', 'warning');
                }
            });
        });

        // Botão para gerar PDF com QR Codes
        document.querySelectorAll('.btn-gerar-pdf-qrcodes').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const tipo = this.dataset.tipo;
                const ids = getSelectedIds(tipo);
                if (ids.length > 0) {
                    gerarPDFQRCodes(tipo, ids);
                } else {
                    showMessage('Selecione pelo menos um item para gerar o PDF', 'warning');
                }
            });
        });
    }

    /**
     * Carrega a lista de equipamentos
     * @returns {Promise} Promise com os equipamentos
     */
    function loadEquipamentos() {
        return api.get('/equipamentos')
            .then(response => {
                equipamentosCache = response.data;
                return equipamentosCache;
            })
            .catch(error => {
                console.error('Erro ao carregar equipamentos:', error);
                showMessage('Erro ao carregar equipamentos', 'error');
                return [];
            });
    }

    /**
     * Carrega a lista de áreas
     * @returns {Promise} Promise com as áreas
     */
    function loadAreas() {
        return api.get('/areas')
            .then(response => {
                areasCache = response.data;
                return areasCache;
            })
            .catch(error => {
                console.error('Erro ao carregar áreas:', error);
                showMessage('Erro ao carregar áreas', 'error');
                return [];
            });
    }

    /**
     * Gera QR Code para um equipamento
     * @param {number} equipamentoId - ID do equipamento
     * @returns {Promise} Promise com o resultado
     */
    function gerarQRCodeEquipamento(equipamentoId) {
        showLoading('Gerando QR Code...');
        
        return api.get(`/qrcode/equipamento/${equipamentoId}`)
            .then(response => {
                hideLoading();
                
                // Exibir QR Code em modal
                showQRCodeModal({
                    url: response.data.url,
                    titulo: 'QR Code do Equipamento',
                    subtitulo: response.data.equipamento.nome,
                    hash: response.data.hash
                });
                
                return response.data;
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao gerar QR Code:', error);
                showMessage('Erro ao gerar QR Code do equipamento', 'error');
                throw error;
            });
    }

    /**
     * Gera QR Code para uma área
     * @param {number} areaId - ID da área
     * @returns {Promise} Promise com o resultado
     */
    function gerarQRCodeArea(areaId) {
        showLoading('Gerando QR Code...');
        
        return api.get(`/qrcode/area/${areaId}`)
            .then(response => {
                hideLoading();
                
                // Exibir QR Code em modal
                showQRCodeModal({
                    url: response.data.url,
                    titulo: 'QR Code da Área',
                    subtitulo: response.data.area.nome,
                    hash: response.data.hash
                });
                
                return response.data;
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao gerar QR Code:', error);
                showMessage('Erro ao gerar QR Code da área', 'error');
                throw error;
            });
    }

    /**
     * Gera múltiplos QR Codes
     * @param {string} tipo - Tipo de item (equipamento ou area)
     * @param {Array} ids - Array de IDs
     * @returns {Promise} Promise com o resultado
     */
    function gerarMultiplosQRCodes(tipo, ids) {
        showLoading('Gerando QR Codes...');
        
        const itens = ids.map(id => ({ tipo, id }));
        
        return api.post('/qrcode/multiplos', { itens })
            .then(response => {
                hideLoading();
                
                // Exibir resultados
                const sucessos = response.data.sucesso;
                const erros = response.data.erro;
                
                if (sucessos > 0) {
                    showMessage(`${sucessos} QR Code(s) gerado(s) com sucesso`, 'success');
                    
                    // Exibir galeria de QR Codes
                    showQRCodeGallery(response.data.resultados);
                }
                
                if (erros > 0) {
                    showMessage(`${erros} erro(s) ao gerar QR Codes`, 'warning');
                }
                
                return response.data;
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao gerar múltiplos QR Codes:', error);
                showMessage('Erro ao gerar múltiplos QR Codes', 'error');
                throw error;
            });
    }

    /**
     * Gera PDF com QR Codes
     * @param {string} tipo - Tipo de item (equipamento ou area)
     * @param {Array} ids - Array de IDs
     * @returns {Promise} Promise com o resultado
     */
    function gerarPDFQRCodes(tipo, ids) {
        showLoading('Gerando PDF com QR Codes...');
        
        const itens = ids.map(id => ({ tipo, id }));
        
        return api.post('/qrcode/pdf', { itens })
            .then(response => {
                hideLoading();
                
                // Abrir PDF em nova aba
                window.open(response.data.url, '_blank');
                
                showMessage(`PDF com ${response.data.total_itens} QR Code(s) gerado com sucesso`, 'success');
                
                return response.data;
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao gerar PDF com QR Codes:', error);
                showMessage('Erro ao gerar PDF com QR Codes', 'error');
                throw error;
            });
    }

    /**
     * Inicia a leitura de QR Code usando a câmera
     */
    function iniciarLeituraQRCode() {
        // Verificar se o navegador suporta acesso à câmera
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showMessage('Seu navegador não suporta acesso à câmera', 'error');
            return;
        }
        
        // Criar container para o leitor de QR Code
        const container = document.getElementById(config.qrReaderContainer);
        if (!container) {
            console.error('Container para leitor de QR Code não encontrado');
            return;
        }
        
        // Limpar container
        container.innerHTML = '';
        
        // Criar elementos
        const video = document.createElement('video');
        video.setAttribute('playsinline', true);
        video.style.width = '100%';
        video.style.maxWidth = '400px';
        
        const canvas = document.createElement('canvas');
        canvas.style.display = 'none';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fechar Câmera';
        closeButton.className = 'btn btn-danger mt-2';
        closeButton.addEventListener('click', () => {
            stopQRCodeReader();
        });
        
        // Adicionar elementos ao container
        container.appendChild(video);
        container.appendChild(canvas);
        container.appendChild(closeButton);
        
        // Mostrar container
        container.style.display = 'block';
        
        // Iniciar câmera
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                video.srcObject = stream;
                video.play();
                
                // Iniciar detecção de QR Code
                requestAnimationFrame(() => scanQRCode(video, canvas, stream));
            })
            .catch(error => {
                console.error('Erro ao acessar câmera:', error);
                showMessage('Erro ao acessar câmera. Verifique as permissões.', 'error');
            });
    }

    /**
     * Escaneia QR Code a partir do vídeo
     * @param {HTMLVideoElement} video - Elemento de vídeo
     * @param {HTMLCanvasElement} canvas - Elemento de canvas
     * @param {MediaStream} stream - Stream da câmera
     */
    function scanQRCode(video, canvas, stream) {
        // Verificar se o vídeo está pronto
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(() => scanQRCode(video, canvas, stream));
            return;
        }
        
        // Configurar canvas
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Desenhar frame do vídeo no canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Obter dados da imagem
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Usar biblioteca jsQR para decodificar QR Code
        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                // QR Code detectado
                console.log('QR Code detectado:', code.data);
                
                // Parar câmera
                stopQRCodeReader(stream);
                
                // Processar QR Code
                processarQRCode(code.data);
            } else {
                // Continuar escaneando
                requestAnimationFrame(() => scanQRCode(video, canvas, stream));
            }
        } catch (error) {
            console.error('Erro ao decodificar QR Code:', error);
            // Continuar escaneando
            requestAnimationFrame(() => scanQRCode(video, canvas, stream));
        }
    }

    /**
     * Para o leitor de QR Code
     * @param {MediaStream} stream - Stream da câmera
     */
    function stopQRCodeReader(stream) {
        // Parar stream da câmera
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Esconder container
        const container = document.getElementById(config.qrReaderContainer);
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    }

    /**
     * Processa o QR Code lido
     * @param {string} data - Dados do QR Code
     */
    function processarQRCode(data) {
        // Extrair hash do QR Code
        let hash = null;
        
        try {
            // Verificar se é uma URL com parâmetro hash
            const url = new URL(data);
            hash = url.searchParams.get('hash');
        } catch (error) {
            // Não é uma URL válida, verificar se é um hash direto
            if (data.length === 64 && /^[a-f0-9]+$/i.test(data)) {
                hash = data;
            }
        }
        
        if (!hash) {
            showMessage('QR Code inválido ou não reconhecido', 'error');
            return;
        }
        
        // Enviar hash para API
        showLoading('Processando QR Code...');
        
        api.post('/qrcode/processar', { hash })
            .then(response => {
                hideLoading();
                
                // Exibir resultado
                showQRCodeResult(response.data);
            })
            .catch(error => {
                hideLoading();
                console.error('Erro ao processar QR Code:', error);
                showMessage('Erro ao processar QR Code', 'error');
            });
    }

    /**
     * Exibe o resultado do processamento do QR Code
     * @param {Object} data - Dados do item associado ao QR Code
     */
    function showQRCodeResult(data) {
        const container = document.getElementById(config.qrResultContainer);
        if (!container) {
            console.error('Container para resultado de QR Code não encontrado');
            return;
        }
        
        // Limpar container
        container.innerHTML = '';
        
        // Criar elementos
        const card = document.createElement('div');
        card.className = 'card mb-4';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header d-flex justify-content-between align-items-center';
        
        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title mb-0';
        cardTitle.textContent = data.tipo === 'equipamento' ? 'Equipamento' : 'Área';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'btn-close';
        closeButton.setAttribute('aria-label', 'Fechar');
        closeButton.addEventListener('click', () => {
            container.innerHTML = '';
        });
        
        cardHeader.appendChild(cardTitle);
        cardHeader.appendChild(closeButton);
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        // Informações do item
        const nome = document.createElement('h4');
        nome.textContent = data.dados.nome;
        
        const condominio = document.createElement('p');
        condominio.innerHTML = `<strong>Condomínio:</strong> ${data.condominio.nome}`;
        
        const tipo = document.createElement('p');
        tipo.innerHTML = `<strong>Tipo:</strong> ${data.dados.tipo}`;
        
        const localizacao = document.createElement('p');
        localizacao.innerHTML = `<strong>Localização:</strong> ${data.dados.localizacao || 'Não informada'}`;
        
        // Adicionar elementos ao card body
        cardBody.appendChild(nome);
        cardBody.appendChild(condominio);
        cardBody.appendChild(tipo);
        cardBody.appendChild(localizacao);
        
        // Manutenções recentes
        if (data.manutencoes && data.manutencoes.length > 0) {
            const manutencoesTitle = document.createElement('h5');
            manutencoesTitle.className = 'mt-4 mb-3';
            manutencoesTitle.textContent = 'Manutenções Recentes';
            
            const manutencoesList = document.createElement('ul');
            manutencoesList.className = 'list-group';
            
            data.manutencoes.forEach(manutencao => {
                const item = document.createElement('li');
                item.className = 'list-group-item';
                
                const itemTitle = document.createElement('h6');
                itemTitle.textContent = manutencao.titulo;
                
                const itemStatus = document.createElement('span');
                itemStatus.className = `badge bg-${getStatusColor(manutencao.status)} float-end`;
                itemStatus.textContent = getStatusText(manutencao.status);
                
                const itemDate = document.createElement('small');
                itemDate.className = 'd-block text-muted';
                itemDate.textContent = `Data: ${formatDate(manutencao.data_solicitacao)}`;
                
                item.appendChild(itemTitle);
                item.appendChild(itemStatus);
                item.appendChild(itemDate);
                
                // Adicionar link para visualizar manutenção
                const itemLink = document.createElement('a');
                itemLink.href = `manutencoes.html?id=${manutencao.id}`;
                itemLink.className = 'btn btn-sm btn-primary mt-2';
                itemLink.textContent = 'Ver Detalhes';
                
                item.appendChild(itemLink);
                manutencoesList.appendChild(item);
            });
            
            cardBody.appendChild(manutencoesTitle);
            cardBody.appendChild(manutencoesList);
        } else {
            const semManutencoes = document.createElement('p');
            semManutencoes.className = 'text-muted mt-3';
            semManutencoes.textContent = 'Nenhuma manutenção registrada.';
            
            cardBody.appendChild(semManutencoes);
        }
        
        // Botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'mt-4';
        
        const novaManutencaoBtn = document.createElement('a');
        novaManutencaoBtn.href = `nova-manutencao.html?${data.tipo}_id=${data.dados.id}`;
        novaManutencaoBtn.className = 'btn btn-success me-2';
        novaManutencaoBtn.textContent = 'Nova Manutenção';
        
        const iniciarChecklistBtn = document.createElement('button');
        iniciarChecklistBtn.className = 'btn btn-info';
        iniciarChecklistBtn.textContent = 'Iniciar Check-list';
        iniciarChecklistBtn.addEventListener('click', () => {
            // Redirecionar para página de check-list
            window.location.href = `checklist.html?tipo=${data.tipo}&id=${data.dados.id}`;
        });
        
        actionsDiv.appendChild(novaManutencaoBtn);
        actionsDiv.appendChild(iniciarChecklistBtn);
        
        cardBody.appendChild(actionsDiv);
        
        // Montar card
        card.appendChild(cardHeader);
        card.appendChild(cardBody);
        
        // Adicionar card ao container
        container.appendChild(card);
        
        // Mostrar container
        container.style.display = 'block';
        
        // Rolar para o container
        container.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Exibe modal com QR Code
     * @param {Object} options - Opções do modal
     */
    function showQRCodeModal(options) {
        // Criar modal
        const modalId = 'qrCodeModal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            // Criar modal se não existir
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-hidden', 'true');
            
            const modalDialog = document.createElement('div');
            modalDialog.className = 'modal-dialog modal-dialog-centered';
            
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
            modalBody.className = 'modal-body text-center';
            
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            
            const downloadButton = document.createElement('a');
            downloadButton.className = 'btn btn-primary';
            downloadButton.textContent = 'Download';
            downloadButton.setAttribute('download', 'qrcode.png');
            
            const printButton = document.createElement('button');
            printButton.type = 'button';
            printButton.className = 'btn btn-secondary';
            printButton.textContent = 'Imprimir';
            printButton.addEventListener('click', () => {
                printQRCode(options.url);
            });
            
            const closeModalButton = document.createElement('button');
            closeModalButton.type = 'button';
            closeModalButton.className = 'btn btn-secondary';
            closeModalButton.textContent = 'Fechar';
            closeModalButton.setAttribute('data-bs-dismiss', 'modal');
            
            modalFooter.appendChild(downloadButton);
            modalFooter.appendChild(printButton);
            modalFooter.appendChild(closeModalButton);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            
            modalDialog.appendChild(modalContent);
            modal.appendChild(modalDialog);
            
            document.body.appendChild(modal);
        }
        
        // Atualizar conteúdo do modal
        const modalTitle = modal.querySelector('.modal-title');
        modalTitle.textContent = options.titulo;
        
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = '';
        
        // Adicionar imagem do QR Code
        const qrImage = document.createElement('img');
        qrImage.src = options.url;
        qrImage.alt = 'QR Code';
        qrImage.className = 'img-fluid';
        qrImage.style.maxWidth = '300px';
        
        // Adicionar subtítulo
        const subtitle = document.createElement('h6');
        subtitle.className = 'mt-3';
        subtitle.textContent = options.subtitulo;
        
        // Adicionar hash
        const hashText = document.createElement('small');
        hashText.className = 'd-block text-muted mt-2';
        hashText.textContent = `Hash: ${options.hash}`;
        
        modalBody.appendChild(qrImage);
        modalBody.appendChild(subtitle);
        modalBody.appendChild(hashText);
        
        // Atualizar botão de download
        const downloadButton = modal.querySelector('.modal-footer a.btn-primary');
        downloadButton.href = options.url;
        downloadButton.setAttribute('download', `qrcode-${options.hash.substring(0, 8)}.png`);
        
        // Exibir modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Exibe galeria de QR Codes
     * @param {Array} resultados - Resultados da geração de QR Codes
     */
    function showQRCodeGallery(resultados) {
        // Filtrar apenas resultados com sucesso
        const sucessos = resultados.filter(item => item.status === 'sucesso');
        
        if (sucessos.length === 0) {
            return;
        }
        
        // Criar modal
        const modalId = 'qrCodeGalleryModal';
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
            modalTitle.textContent = 'QR Codes Gerados';
            
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
        
        // Atualizar conteúdo do modal
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = '';
        
        // Criar grid para QR Codes
        const row = document.createElement('div');
        row.className = 'row';
        
        // Adicionar QR Codes
        sucessos.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-md-4 mb-4';
            
            const card = document.createElement('div');
            card.className = 'card h-100';
            
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body text-center';
            
            // Imagem do QR Code
            const qrImage = document.createElement('img');
            qrImage.src = item.url;
            qrImage.alt = 'QR Code';
            qrImage.className = 'img-fluid mb-2';
            qrImage.style.maxWidth = '150px';
            
            // Título
            const title = document.createElement('h6');
            title.className = 'card-title';
            title.textContent = item.nome;
            
            // Tipo
            const tipo = document.createElement('p');
            tipo.className = 'card-text small text-muted';
            tipo.textContent = item.tipo === 'equipamento' ? 'Equipamento' : 'Área';
            
            // Botão de download
            const downloadLink = document.createElement('a');
            downloadLink.href = item.url;
            downloadLink.className = 'btn btn-sm btn-primary mt-2';
            downloadLink.textContent = 'Download';
            downloadLink.setAttribute('download', `qrcode-${item.tipo}-${item.id}.png`);
            
            cardBody.appendChild(qrImage);
            cardBody.appendChild(title);
            cardBody.appendChild(tipo);
            cardBody.appendChild(downloadLink);
            
            card.appendChild(cardBody);
            col.appendChild(card);
            row.appendChild(col);
        });
        
        modalBody.appendChild(row);
        
        // Exibir modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Imprime QR Code
     * @param {string} url - URL da imagem do QR Code
     */
    function printQRCode(url) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir QR Code</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    img {
                        max-width: 100%;
                        max-height: 80vh;
                    }
                    @media print {
                        @page {
                            size: auto;
                            margin: 0mm;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${url}" alt="QR Code">
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() {
                                window.close();
                            }, 500);
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    /**
     * Obtém os IDs dos itens selecionados
     * @param {string} tipo - Tipo de item (equipamento ou area)
     * @returns {Array} Array de IDs
     */
    function getSelectedIds(tipo) {
        const checkboxes = document.querySelectorAll(`.checkbox-${tipo}:checked`);
        return Array.from(checkboxes).map(checkbox => checkbox.value);
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

    /**
     * Formata data para exibição
     * @param {string} dateString - String de data no formato ISO
     * @returns {string} Data formatada
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    /**
     * Obtém cor para status
     * @param {string} status - Status da manutenção
     * @returns {string} Classe de cor
     */
    function getStatusColor(status) {
        switch (status) {
            case 'pendente': return 'warning';
            case 'agendada': return 'info';
            case 'em_andamento': return 'primary';
            case 'concluida': return 'success';
            case 'cancelada': return 'danger';
            default: return 'secondary';
        }
    }

    /**
     * Obtém texto para status
     * @param {string} status - Status da manutenção
     * @returns {string} Texto do status
     */
    function getStatusText(status) {
        switch (status) {
            case 'pendente': return 'Pendente';
            case 'agendada': return 'Agendada';
            case 'em_andamento': return 'Em Andamento';
            case 'concluida': return 'Concluída';
            case 'cancelada': return 'Cancelada';
            default: return status;
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
        }
    };

    // Expor API pública
    return {
        init,
        gerarQRCodeEquipamento,
        gerarQRCodeArea,
        gerarMultiplosQRCodes,
        gerarPDFQRCodes,
        iniciarLeituraQRCode,
        processarQRCode
    };
})();

// Inicializar quando documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    QRCodeManager.init({
        apiBaseUrl: '/api',
        autoload: false
    });
});
