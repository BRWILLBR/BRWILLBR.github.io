// condominio.js - Gerenciamento de condomínios com localStorage

class CondominioManager {
    constructor() {
        this.condominios = this.loadCondominiosFromLocalStorage();
        this.setupEventListeners();
        this.renderCondominios();
    }

    // Carregar condomínios do localStorage
    loadCondominiosFromLocalStorage() {
        const data = localStorage.getItem("condominios");
        return data ? JSON.parse(data) : [];
    }

    // Salvar condomínios no localStorage
    saveCondominiosToLocalStorage() {
        localStorage.setItem("condominios", JSON.stringify(this.condominios));
    }

    // Configurar listeners de eventos
    setupEventListeners() {
        document.addEventListener("DOMContentLoaded", () => {
            const formCondominio = document.getElementById("form-condominio");
            if (formCondominio) {
                formCondominio.addEventListener("submit", (e) => this.handleSaveCondominio(e));
            }

            document.addEventListener("click", (e) => {
                if (e.target && e.target.classList.contains("btn-delete-condominio")) {
                    const condominioId = e.target.getAttribute("data-id");
                    this.confirmDeleteCondominio(condominioId);
                }
                if (e.target && e.target.classList.contains("btn-edit-condominio")) {
                    const condominioId = e.target.getAttribute("data-id");
                    this.loadCondominioForEdit(condominioId);
                }
            });

            const filtroForm = document.getElementById("filtro-condominios-form");
            if (filtroForm) {
                filtroForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    this.applyFilters();
                });
                const btnLimparFiltros = document.getElementById("btn-limpar-filtros");
                if (btnLimparFiltros) {
                    btnLimparFiltros.addEventListener("click", () => this.clearFilters());
                }
            }
        });
    }

    // Renderizar lista de condomínios
    renderCondominios() {
        const tableBody = document.getElementById("condominios-table-body");
        if (!tableBody) return;

        const filtros = this.getCurrentFilters();
        let condominiosFiltrados = this.condominios.filter(condominio => {
            let match = true;
            if (filtros.cidade && condominio.cidade.toLowerCase() !== filtros.cidade.toLowerCase()) {
                match = false;
            }
            if (filtros.regiao && condominio.regiao.toLowerCase() !== filtros.regiao.toLowerCase()) {
                match = false;
            }
            if (filtros.tipo && condominio.tipo.toLowerCase() !== filtros.tipo.toLowerCase()) {
                match = false;
            }
            if (filtros.termo && !condominio.nome.toLowerCase().includes(filtros.termo.toLowerCase())) {
                match = false;
            }
            return match;
        });

        if (condominiosFiltrados.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum condomínio encontrado</td></tr>';
            return;
        }

        let html = '';
        condominiosFiltrados.forEach(condominio => {
            html += `
                <tr>
                    <td>${condominio.nome}</td>
                    <td>${condominio.cidade}</td>
                    <td>${condominio.regiao}</td>
                    <td>${condominio.tipo}</td>
                    <td>${condominio.qtd_unidades}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-edit-condominio" data-id="${condominio.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-condominio" data-id="${condominio.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    // Obter filtros atuais do formulário
    getCurrentFilters() {
        const filtros = {};
        const cidadeInput = document.getElementById("filtro-cidade");
        if (cidadeInput && cidadeInput.value) {
            filtros.cidade = cidadeInput.value;
        }
        const regiaoInput = document.getElementById("filtro-regiao");
        if (regiaoInput && regiaoInput.value) {
            filtros.regiao = regiaoInput.value;
        }
        const tipoSelect = document.getElementById("filtro-tipo");
        if (tipoSelect && tipoSelect.value) {
            filtros.tipo = tipoSelect.value;
        }
        const termoInput = document.getElementById("filtro-termo");
        if (termoInput && termoInput.value) {
            filtros.termo = termoInput.value;
        }
        return filtros;
    }

    // Aplicar filtros
    applyFilters() {
        this.renderCondominios();
    }

    // Limpar filtros
    clearFilters() {
        const filtroForm = document.getElementById("filtro-condominios-form");
        if (filtroForm) {
            filtroForm.reset();
            this.renderCondominios();
        }
    }

    // Carregar condomínio para edição
    loadCondominioForEdit(id) {
        const condominio = this.condominios.find(c => c.id == id);
        if (!condominio) {
            this.showMessage("Condomínio não encontrado!", "error");
            return;
        }

        document.getElementById("condominio-id").value = condominio.id;
        document.getElementById("condominio-nome").value = condominio.nome;
        document.getElementById("condominio-endereco").value = condominio.endereco;
        document.getElementById("condominio-cidade").value = condominio.cidade;
        document.getElementById("condominio-estado").value = condominio.estado;
        document.getElementById("condominio-cep").value = condominio.cep;
        document.getElementById("condominio-regiao").value = condominio.regiao;
        document.getElementById("condominio-tipo").value = condominio.tipo;
        document.getElementById("condominio-qtd-unidades").value = condominio.qtd_unidades;
        document.getElementById("condominio-sindico-nome").value = condominio.sindico_nome;
        document.getElementById("condominio-sindico-contato").value = condominio.sindico_contato;

        const modalTitle = document.querySelector("#modal-condominio .modal-title");
        if (modalTitle) {
            modalTitle.textContent = "Editar Condomínio";
        }

        const modal = new bootstrap.Modal(document.getElementById("modal-condominio"));
        modal.show();
    }

    // Salvar condomínio (criar ou atualizar)
    handleSaveCondominio(event) {
        event.preventDefault();

        const form = event.target;
        const condominioId = form.querySelector("#condominio-id").value;

        const condominioData = {
            nome: form.querySelector("#condominio-nome").value,
            endereco: form.querySelector("#condominio-endereco").value,
            cidade: form.querySelector("#condominio-cidade").value,
            estado: form.querySelector("#condominio-estado").value,
            cep: form.querySelector("#condominio-cep").value,
            regiao: form.querySelector("#condominio-regiao").value,
            tipo: form.querySelector("#condominio-tipo").value,
            qtd_unidades: parseInt(form.querySelector("#condominio-qtd-unidades").value),
            sindico_nome: form.querySelector("#condominio-sindico-nome").value,
            sindico_contato: form.querySelector("#condominio-sindico-contato").value
        };

        if (condominioId) {
            // Atualizar condomínio existente
            const index = this.condominios.findIndex(c => c.id == condominioId);
            if (index !== -1) {
                this.condominios[index] = { ...this.condominios[index], ...condominioData };
                this.showMessage("Condomínio atualizado com sucesso!", "success");
            } else {
                this.showMessage("Erro: Condomínio não encontrado para atualização.", "error");
            }
        } else {
            // Criar novo condomínio
            condominioData.id = Date.now().toString(); // Gerar ID único
            this.condominios.push(condominioData);
            this.showMessage("Condomínio criado com sucesso!", "success");
        }

        this.saveCondominiosToLocalStorage();

        const modalElement = document.getElementById("modal-condominio");
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();

        form.reset();
        form.querySelector("#condominio-id").value = '';

        this.renderCondominios();
    }

    // Confirmar exclusão de condomínio
    confirmDeleteCondominio(id) {
        if (confirm("Tem certeza que deseja excluir este condomínio? Todas as manutenções associadas também serão excluídas.")) {
            this.deleteCondominio(id);
        }
    }

    // Excluir condomínio
    deleteCondominio(id) {
        const initialLength = this.condominios.length;
        this.condominios = this.condominios.filter(c => c.id != id);
        if (this.condominios.length < initialLength) {
            this.saveCondominiosToLocalStorage();
            this.showMessage("Condomínio excluído com sucesso!", "success");
            this.renderCondominios();
        } else {
            this.showMessage("Erro ao excluir condomínio: Condomínio não encontrado.", "error");
        }
    }

    // Exibir mensagem para o usuário
    showMessage(message, type = "info") {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = "alert";

        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;

        const container = document.querySelector(".container") || document.body;
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => {
            alertDiv.classList.remove("show");
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }
}

const condominioManager = new CondominioManager();


