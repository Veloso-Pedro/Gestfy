import { supabase } from './supabase-config.js';

console.log("🚀 Dashboard com Filtro Temporal Ativado e Protegido!");

let regimeUsuarioReal = null;
let usuarioAtualId = null;
let dadosEmpresaGlobal = null;
let emailGlobal = null;

// Elementos da Interface
const displaySaldo = document.getElementById('saldo-atual');
const displayReceitas = document.getElementById('total-receitas');
const displayDespesas = document.getElementById('total-despesas');
const corpoTabela = document.getElementById('corpo-tabela');
const filtroPeriodo = document.getElementById('filtro-periodo');

const formLancamento = document.getElementById('form-lancamento');
const btnAdicionar = document.querySelector('.botao-enviar');
const inputValor = document.getElementById('valor-lancamento');
const displayImposto = document.getElementById('valor-imposto');
const avisoImposto = document.getElementById('aviso-imposto');

const barraSegmentada = document.querySelector('.barra-segmentada');
const listaCategorias = document.querySelector('.lista-categorias');

/* =========================================
   5. MODAL DE CONFIGURAÇÕES (MINHA CONTA)
   ========================================= */
const btnConfig = document.getElementById('btn-configuracoes');
const modalConfig = document.getElementById('modal-configuracoes');
const btnFecharModal = document.getElementById('fechar-modal');

if (btnConfig && modalConfig && btnFecharModal) {
    // Abrir o modal
    btnConfig.addEventListener('click', (e) => {
        e.preventDefault();

        if (dadosEmpresaGlobal) {
            // Dicionário para deixar o nome do regime bonito
            const nomesRegimes = {
                'mei': 'MEI',
                'me': 'ME (Simples Nacional)',
                'lucro_presumido': 'Lucro Presumido',
                'lucro_real': 'Lucro Real'
            };

            // Preenche o HTML com os dados guardados
            document.getElementById('info-nome').innerText = dadosEmpresaGlobal.nome_responsavel || 'Não informado';
            document.getElementById('info-email').innerText = emailGlobal || 'Não informado';
            document.getElementById('info-cnpj').innerText = dadosEmpresaGlobal.cnpj_cpf || 'Não informado';
            document.getElementById('info-regime').innerText = nomesRegimes[dadosEmpresaGlobal.regime_tributario] || 'Desconhecido';
        }

        // Exibe o modal na tela
        modalConfig.classList.add('modal-ativo');
    });

    // Fechar ao clicar no X
    btnFecharModal.addEventListener('click', () => {
        modalConfig.classList.remove('modal-ativo');
    });

    // Fechar ao clicar no fundo escuro fora do cartão branco
    window.addEventListener('click', (e) => {
        if (e.target === modalConfig) {
            modalConfig.classList.remove('modal-ativo');
        }
    });
}

/* =========================================
   6. EXPORTAR RELATÓRIO PARA PDF
   ========================================= */
const btnRelatorio = document.getElementById('btn-relatorio');

if (btnRelatorio) {
    btnRelatorio.addEventListener('click', (e) => {
        e.preventDefault();

        // Pega a área principal do painel (cartões, gráfico e tabela)
        // Ignora o menu lateral para o PDF ficar limpo e profissional
        const elementoParaPDF = document.querySelector('.conteudo-principal');

        // Descobre qual o período que está selecionado no filtro
        const filtro = document.getElementById('filtro-periodo');
        const nomePeriodo = filtro ? filtro.options[filtro.selectedIndex].text : 'Completo';

        // Configurações de alta qualidade para o PDF
        const opcoes = {
            margin: [10, 10, 10, 10], // Margens do papel
            filename: `Gestfy_Relatorio_${nomePeriodo.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, // Escala 2 para imagem cristalina
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Dá feedback visual ao utilizador
        const textoOriginal = btnRelatorio.innerText;
        btnRelatorio.innerText = "⏳ A preparar PDF...";

        // Manda o html2pdf fazer o trabalho e depois restaura o botão
        html2pdf().set(opcoes).from(elementoParaPDF).save().then(() => {
            btnRelatorio.innerText = textoOriginal;
        });
    });
}

/* =========================================
   1. INICIALIZAÇÃO
   ========================================= */
async function inicializarDashboard() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            window.location.href = "login.html";
            return;
        }
        usuarioAtualId = user.id;

        // Puxa TODOS os dados da empresa em vez de apenas o regime
        const { data: empresa } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', usuarioAtualId)
            .single();

        if (empresa) {
            regimeUsuarioReal = empresa.regime_tributario;
            dadosEmpresaGlobal = empresa; // Guarda os dados para usar no modal
            emailGlobal = user.email; // Guarda o e-mail
        }

        // PROTEÇÃO: Só escuta mudanças no filtro se o elemento existir no HTML
        if (filtroPeriodo) {
            filtroPeriodo.addEventListener('change', carregarResumoFinanceiro);
        } else {
            console.warn("⚠️ Filtro de período não encontrado no HTML (id='filtro-periodo').");
        }

        await carregarResumoFinanceiro();
    } catch (erro) {
        console.error("Erro na inicialização:", erro.message);
    }
}

/* =========================================
   2. LÓGICA DE FILTRO DE DATA
   ========================================= */
function obterDataInicio(periodo) {
    if (!periodo) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (periodo) {
        case 'semana':
            return new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        case 'mes':
            return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        case 'ano':
            return new Date(hoje.getFullYear(), 0, 1).toISOString();
        default:
            return null; // Retorna nulo para "tudo"
    }
}

/* =========================================
   3. BUSCA FILTRADA E CÁLCULOS
   ========================================= */
async function carregarResumoFinanceiro() {
    try {
        // Verifica qual o filtro selecionado (se o filtro existir)
        const periodoSelecionado = filtroPeriodo ? filtroPeriodo.value : 'tudo';
        const dataInicio = obterDataInicio(periodoSelecionado);

        // Iniciamos a query básica
        let query = supabase
            .from('lancamentos')
            .select('*')
            .eq('empresa_id', usuarioAtualId);

        // Se houver filtro de data, aplicamos .gte (maior ou igual a)
        if (dataInicio) {
            query = query.gte('created_at', dataInicio);
        }

        const { data: lancamentos, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        let totalReceitas = 0;
        let totalDespesas = 0;

        if (corpoTabela) corpoTabela.innerHTML = '';

        if (lancamentos.length === 0 && corpoTabela) {
            corpoTabela.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">Nenhum lançamento no período selecionado.</td></tr>`;
        }

        lancamentos.forEach(lanc => {
            if (lanc.tipo === 'receita') {
                totalReceitas += parseFloat(lanc.valor);
            } else {
                totalDespesas += parseFloat(lanc.valor);
            }

            if (corpoTabela) {
                let dataFormatada = lanc.created_at ? new Date(lanc.created_at).toLocaleDateString('pt-BR') : "N/A";

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td>${lanc.descricao}</td>
                    <td><span class="${lanc.tipo === 'receita' ? 'etiqueta-receita' : 'etiqueta-despesa'}">${lanc.tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
                    <td>${formatarDinheiro(parseFloat(lanc.valor))}</td>
                `;
                corpoTabela.appendChild(tr);
            }
        });

        // Cálculo de Impostos
        let valorImposto = 0;
        let textoImposto = "Aguardando receitas...";

        if (totalReceitas > 0 || regimeUsuarioReal === 'mei') {
            if (regimeUsuarioReal === 'mei') {
                valorImposto = 75.60;
                textoImposto = "Guia DAS Fixa Mensal";
            } else if (regimeUsuarioReal === 'me') {
                valorImposto = totalReceitas * 0.06;
                textoImposto = "6% sobre Receitas (Simples)";
            } else if (regimeUsuarioReal === 'lucro_presumido') {
                valorImposto = totalReceitas * 0.1633;
                textoImposto = "16,33% sobre Receitas";
            } else if (regimeUsuarioReal === 'lucro_real') {
                valorImposto = totalReceitas * 0.15;
                textoImposto = "Reserva de 15%";
            }
        }

        const saldoAtual = totalReceitas - totalDespesas;
        const lucroLiquido = totalReceitas - totalDespesas - valorImposto;

        if (displayReceitas) displayReceitas.innerText = formatarDinheiro(totalReceitas);
        if (displayDespesas) displayDespesas.innerText = formatarDinheiro(totalDespesas);
        if (displaySaldo) displaySaldo.innerText = formatarDinheiro(saldoAtual);
        if (displayImposto) displayImposto.innerText = formatarDinheiro(valorImposto);
        if (avisoImposto) avisoImposto.innerText = textoImposto;

        atualizarGraficoDistribuicao(totalReceitas, totalDespesas, valorImposto, lucroLiquido);

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro.message);
    }
}

function formatarDinheiro(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarGraficoDistribuicao(receitas, despesas, impostos, lucro) {
    if (!barraSegmentada || !listaCategorias) return;

    if (receitas > 0) {
        let pDespesas = Math.max(0, (despesas / receitas) * 100);
        let pImpostos = Math.max(0, (impostos / receitas) * 100);
        let pLucro = Math.max(0, (lucro / receitas) * 100);

        barraSegmentada.innerHTML = `
            <div class="segmento bg-roxo" style="width: ${pDespesas}%;" title="Despesas"></div>
            <div class="segmento bg-laranja" style="width: ${pImpostos}%;" title="Impostos"></div>
            <div class="segmento bg-azul" style="width: ${pLucro}%;" title="Lucro"></div>
        `;

        listaCategorias.innerHTML = `
            <div class="item-categoria">
                <div class="icone-categoria texto-roxo">🔴</div>
                <div class="info-categoria"><strong>Despesas Pagas</strong><span>${pDespesas.toFixed(1)}% das receitas</span></div>
                <div class="valor-categoria">${formatarDinheiro(despesas)}</div>
            </div>
            <div class="item-categoria">
                <div class="icone-categoria texto-laranja">📄</div>
                <div class="info-categoria"><strong>Reserva de Impostos</strong><span>${pImpostos.toFixed(1)}% das receitas</span></div>
                <div class="valor-categoria">${formatarDinheiro(impostos)}</div>
            </div>
            <div class="item-categoria">
                <div class="icone-categoria texto-azul">💰</div>
                <div class="info-categoria"><strong>Lucro Líquido</strong><span>${pLucro.toFixed(1)}% das receitas</span></div>
                <div class="valor-categoria">${formatarDinheiro(lucro)}</div>
            </div>
        `;
    } else {
        barraSegmentada.innerHTML = `<div class="segmento bg-cinza" style="width: 100%;"></div>`;
        listaCategorias.innerHTML = `<p style="text-align:center; color: #666; padding: 15px;">Sem faturamento no período.</p>`;
    }
}

/* =========================================
   4. ADICIONAR NOVO LANÇAMENTO
   ========================================= */
// PROTEÇÃO: Verifica se o formulário existe na página antes de adicionar o evento
if (formLancamento) {
    formLancamento.addEventListener('submit', async (e) => {
        e.preventDefault();

        const valorNumerico = parseFloat(inputValor.value.replace(',', '.')) || 0;
        const descricao = document.getElementById('descricao-lancamento').value;
        const tipo = document.getElementById('tipo-lancamento').value;

        if (valorNumerico <= 0 || !descricao) {
            alert("⚠️ Por favor, insere um valor e uma descrição válidos.");
            return;
        }

        const textoOriginal = btnAdicionar.innerText;
        btnAdicionar.innerText = "A registar...";
        btnAdicionar.disabled = true;

        try {
            const { error } = await supabase.from('lancamentos').insert([{
                empresa_id: usuarioAtualId,
                tipo: tipo,
                valor: valorNumerico,
                descricao: descricao
            }]);

            if (error) throw error;

            formLancamento.reset();
            await carregarResumoFinanceiro(); // Atualiza tudo imediatamente

        } catch (erro) {
            alert("Erro ao registar: " + erro.message);
        } finally {
            btnAdicionar.innerText = textoOriginal;
            btnAdicionar.disabled = false;
        }
    });
}

// Inicia a aplicação
inicializarDashboard();