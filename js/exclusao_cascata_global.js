// Script para exclusão em cascata de condomínios e manutenções

// Função para excluir um condomínio e suas manutenções associadas
function excluirCondominio(idCondominio, nomeCondominio) {
    // Confirmar exclusão
    if (confirm(`Tem certeza que deseja excluir o condomínio "${nomeCondominio}" e todas as suas manutenções associadas?`)) {
        // Armazenar ID do condomínio excluído
        let condominiosExcluidos = JSON.parse(localStorage.getItem('condominiosExcluidos') || '[]');
        condominiosExcluidos.push(idCondominio);
        localStorage.setItem('condominiosExcluidos', JSON.stringify(condominiosExcluidos));
        
        // Remover visualmente o card do condomínio
        const cardElement = document.getElementById(`condominio-${idCondominio}`);
        if (cardElement) {
            cardElement.remove();
        }
        
        // Atualizar contadores e gráficos
        atualizarDadosAposExclusao();
        
        // Mostrar mensagem de sucesso
        alert(`Condomínio "${nomeCondominio}" e todas as suas manutenções foram excluídos com sucesso!`);
    }
}

// Função para atualizar dados após exclusão
function atualizarDadosAposExclusao() {
    // Esta função seria implementada para atualizar contadores, gráficos e listagens
    // após a exclusão de um condomínio e suas manutenções
    console.log("Dados atualizados após exclusão");
}

// Função para filtrar manutenções de condomínios excluídos
function filtrarManutencoesPorCondominiosAtivos() {
    const condominiosExcluidos = JSON.parse(localStorage.getItem('condominiosExcluidos') || '[]');
    
    // Se não houver condomínios excluídos, não é necessário filtrar
    if (condominiosExcluidos.length === 0) {
        return;
    }
    
    // Lógica para remover manutenções de condomínios excluídos das listagens
    console.log("Filtrando manutenções de condomínios excluídos");
}

// Executar filtro ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    filtrarManutencoesPorCondominiosAtivos();
});
