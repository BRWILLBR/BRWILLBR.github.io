// importacao.js - Funcionalidade de importação em massa via Excel/CSV para localStorage

class ImportacaoManager {
    constructor() {
        this.setupEventListeners();
    }

    // Configurar listeners de eventos
    setupEventListeners() {
        document.addEventListener("DOMContentLoaded", () => {
            const formImportCondominios = document.getElementById("form-import-condominios");
            if (formImportCondominios) {
                formImportCondominios.addEventListener("submit", (e) => this.handleImportCondominios(e));
            }

            const btnModeloCondominios = document.getElementById("btn-modelo-condominios");
            if (btnModeloCondominios) {
                btnModeloCondominios.addEventListener("click", () => this.downloadModeloCondominios());
            }
        });
    }

    // Manipular importação de condomínios
    handleImportCondominios(event) {
        event.preventDefault();
        
        const fileInput = document.getElementById("arquivo-condominios");
        if (!fileInput.files || fileInput.files.length === 0) {
            this.showMessage("Selecione um arquivo para importar.", "error");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                this.processImportedCondominios(json);

            } catch (error) {
                console.error("Erro ao processar arquivo:", error);
                this.showMessage("Erro ao processar arquivo: " + error.message, "error");
            }
        };

        reader.onerror = (error) => {
            console.error("Erro ao ler arquivo:", error);
            this.showMessage("Erro ao ler arquivo.", "error");
        };

        reader.readAsArrayBuffer(file);
    }

    // Processar dados importados e salvar no localStorage
    processImportedCondominios(data) {
        let condominios = JSON.parse(localStorage.getItem("condominios")) || [];
        let importedCount = 0;
        let errors = [];

        data.forEach(row => {
            // Mapear colunas do Excel para o formato do condomínio
            const newCondominio = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // ID único
                nome: row["Nome do Condomínio"] || "",
                endereco: row["Endereço"] || "",
                cidade: row["Cidade"] || "",
                estado: row["Estado"] || "",
                cep: row["CEP"] || "",
                regiao: row["Região"] || "",
                tipo: row["Tipo"] || "",
                qtd_unidades: parseInt(row["Quantidade de Unidades"]) || 0,
                sindico_nome: row["Nome do Síndico"] || "",
                sindico_contato: row["Contato do Síndico"] || ""
            };

            if (newCondominio.nome) {
                condominios.push(newCondominio);
                importedCount++;
            } else {
                errors.push("Linha ignorada devido à falta do 'Nome do Condomínio': " + JSON.stringify(row));
            }
        });

        localStorage.setItem("condominios", JSON.stringify(condominios));
        this.showMessage(`Importação concluída! ${importedCount} condomínios importados.`, "success");
        this.showImportResults({ imported: importedCount, errors: errors });

        // Recarregar a lista de condomínios na página
        if (typeof condominioManager !== "undefined" && condominioManager.renderCondominios) {
            condominioManager.renderCondominios();
        }
    }

    // Exibir resultados da importação
    showImportResults(response) {
        const resultsDiv = document.getElementById("import-results");
        if (!resultsDiv) return;
        
        let html = `
            <div class="card mt-4">
                <div class="card-header">
                    <h5>Resultado da Importação</h5>
                </div>
                <div class="card-body">
                    <p><strong>Total importado:</strong> ${response.imported}</p>
        `;
        
        if (response.errors && response.errors.length > 0) {
            html += `
                <div class="alert alert-warning">
                    <h6>Erros encontrados (${response.errors.length}):</h6>
                    <ul>
            `;
            
            response.errors.forEach(error => {
                html += `<li>${error}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = "block";
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

    // Gerar e baixar modelo de planilha para condomínios
    downloadModeloCondominios() {
        const headers = [
            "Nome do Condomínio", "Endereço", "Cidade", "Estado", "CEP", 
            "Região", "Tipo", "Quantidade de Unidades", "Nome do Síndico", "Contato do Síndico"
        ];
        
        const data = [
            ["Residencial Flores", "Rua das Flores, 123", "São Paulo", "SP", "01234-567", 
             "Centro", "residencial", "50", "João Silva", "(11) 98765-4321"],
            ["Comercial Plaza", "Av. Paulista, 1000", "São Paulo", "SP", "01310-100", 
             "Bela Vista", "comercial", "20", "Maria Souza", "(11) 91234-5678"]
        ];
        
        this.downloadCSVTemplate("modelo_condominios.csv", headers, data);
    }

    // Função auxiliar para gerar e baixar planilha modelo (CSV)
    downloadCSVTemplate(filename, headers, data) {
        const link = document.createElement("a");
        link.style.display = "none";
        
        let csvContent = headers.join(",") + "\n";
        
        data.forEach(row => {
            csvContent += row.map(cell => {
                if (String(cell).includes(",") || String(cell).includes("\"")) {
                    return `\"${String(cell).replace(/\"/g, "\"\"")}\"`;
                }
                return String(cell);
            }).join(",") + "\n";
        });
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
}

const importacao = new ImportacaoManager();


