#include <iostream>
#include <string>
#include <vector>

// Esta é a biblioteca mágica que faz a matemática da Rede Neural
#include "llama.h" 

int main() {
    std::cout << "Iniciando a Mente da IA..." << std::endl;

    // 1. Configurar os parâmetros padrão do modelo
    llama_model_params model_params = llama_model_default_params();
    
    // 2. Carregar o arquivo do modelo (O "Cérebro" de 4GB+ que você baixou)
    // Substitua pelo caminho do arquivo .gguf que você baixar
    const char* caminho_do_modelo = "modelos/llama-3-8b.gguf"; 
    llama_model* modelo = llama_load_model_from_file(caminho_do_modelo, model_params);

    if (modelo == nullptr) {
        std::cerr << "Erro: Não foi possível carregar a mente. Verifique o caminho!" << std::endl;
        return 1;
    }

    // 3. Criar o contexto (A "Memória RAM" da conversa atual)
    llama_context_params ctx_params = llama_context_default_params();
    // Definindo o tamanho do contexto (quantas palavras ela lembra de uma vez)
    ctx_params.n_ctx = 2048; 
    llama_context* contexto = llama_new_context_with_model(modelo, ctx_params);

    std::cout << "Mente carregada com sucesso! Pronta para pensar." << std::endl;

    /* ===============================================================
       AQUI ACONTECE A MÁGICA DA INFERÊNCIA (O PENSAMENTO)
       ===============================================================
       Na prática, você faria um loop aqui que:
       1. Pega o texto do usuário (ex: "Qual é a cor do céu?")
       2. Transforma o texto em "Tokens" (Números) usando: llama_tokenize()
       3. Alimenta a rede neural com os números usando: llama_decode()
       4. Pede para a IA prever o próximo número (A resposta)
       5. Converte o número de volta para texto e imprime na tela.
    */

    // Exemplo de como você limparia a memória ao fechar o programa
    std::cout << "Desligando a IA..." << std::endl;
    llama_free(contexto);
    llama_free_model(modelo);

    return 0;
}
