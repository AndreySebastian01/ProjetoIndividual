const dimensoes = [
    { chave: "abertura", codigo: "O", nome: "Abertura à experiência" },
    { chave: "conscienciosidade", codigo: "C", nome: "Conscienciosidade" },
    { chave: "extroversao", codigo: "E", nome: "Extroversão" },
    { chave: "amabilidade", codigo: "A", nome: "Amabilidade" },
    { chave: "neuroticismo", codigo: "N", nome: "Neuroticismo" }
];

const questionNumber = document.querySelector("#question-number");
const answeredPercent = document.querySelector("#answered-percent");
const progressSegments = document.querySelector("#progress-segments");
const quizContent = document.querySelector("#quiz-content");
const quizMessage = document.querySelector("#quiz-message");
const siteHeader = document.querySelector("#site-header");
const menuButton = siteHeader.querySelector(".menuHamburguer");
const siteNavigation = siteHeader.querySelector(".navHeader");

// estado do quiz
let perguntas = [];
let personagens = [];
let respostasSelecionadas = {}; // { idDaPergunta: "A" | "B" | "C" | "D" }
let perguntaAtual = 0;
let quizFinalizado = false;

function definirMenu(aberto) {
    menuButton.classList.toggle("aberto", aberto);
    siteNavigation.classList.toggle("aberto", aberto);
    menuButton.setAttribute("aria-expanded", String(aberto));
    menuButton.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
}

menuButton.addEventListener("click", () => {
    const estaAberto = menuButton.getAttribute("aria-expanded") === "true";
    definirMenu(!estaAberto);
});

siteNavigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => definirMenu(false));
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) definirMenu(false);
});

// ---------- Funções auxiliares ----------
function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function mostrarErro(mensagem, erro) {
    console.error(mensagem, erro);
    quizMessage.textContent = mensagem;
    quizMessage.hidden = false;
    quizContent.setAttribute("aria-busy", "false");
    quizContent.innerHTML = `
        <p class="question-label">NÃO FOI POSSÍVEL CARREGAR O QUIZ</p>
        <h1>Algo deu errado.</h1>
        <p class="question-context">Atualize a página para tentar novamente. Se o problema continuar, verifique se o servidor e o banco de dados estão disponíveis.</p>
    `;
}

// ---------- Validação dos dados ----------
function validarPerguntas(lista) {
    if (!Array.isArray(lista) || lista.length !== 10) {
        throw new Error("O arquivo de perguntas deve conter exatamente 10 perguntas.");
    }

    const idsUsados = [];
    const contagem = {};
    dimensoes.forEach((dimensao) => {
        contagem[dimensao.chave] = 0;
    });

    for (const pergunta of lista) {
        if (!Number.isInteger(pergunta.id) || idsUsados.includes(pergunta.id)) {
            throw new Error("Cada pergunta deve possuir um ID numérico único.");
        }
        idsUsados.push(pergunta.id);

        if (!(pergunta.dimensao in contagem)) {
            throw new Error(`A pergunta ${pergunta.id} possui uma dimensão inválida.`);
        }
        contagem[pergunta.dimensao]++;

        if (!Array.isArray(pergunta.respostas) || pergunta.respostas.length !== 4) {
            throw new Error(`A pergunta ${pergunta.id} deve ter quatro alternativas.`);
        }

        // Com 4 respostas, ter A, B, C e D garante que não há letras repetidas
        const letras = pergunta.respostas.map((resposta) => resposta.opcao);
        const temTodasAsLetras = ["A", "B", "C", "D"].every((letra) => letras.includes(letra));
        const respostasValidas = pergunta.respostas.every((resposta) => {
            return typeof resposta.resposta === "string" && (resposta.valor === 1 || resposta.valor === -1);
        });

        if (!temTodasAsLetras || !respostasValidas) {
            throw new Error(`A pergunta ${pergunta.id} possui uma alternativa inválida.`);
        }
    }

    for (const chave in contagem) {
        if (contagem[chave] !== 2) {
            throw new Error("O quiz deve ter exatamente duas perguntas para cada dimensão.");
        }
    }
}

function validarPersonagens(lista) {
    if (!Array.isArray(lista) || lista.length !== 20) {
        throw new Error("O catálogo deve conter exatamente 20 personagens.");
    }

    for (const personagem of lista) {
        const id = Number(personagem.id_personagem ?? personagem.id);
        if (!Number.isInteger(id) || !personagem.nome) {
            throw new Error("O catálogo possui um personagem sem ID ou nome válido.");
        }

        for (const dimensao of dimensoes) {
            const valor = Number(personagem[dimensao.chave]);
            if (![-2, 0, 2].includes(valor)) {
                throw new Error(`O perfil de ${personagem.nome} possui um valor inválido.`);
            }
            personagem[dimensao.chave] = valor;
        }

        personagem.id = id;
    }
}

// ---------- Carregamento ----------
async function carregarDados() {
    const respostaPerguntas = await fetch("../mock/quiz_star_wars_perguntas.json");
    if (!respostaPerguntas.ok) {
        throw new Error("Não foi possível carregar as perguntas do quiz.");
    }

    const respostaPersonagens = await fetch("/api/personagens");
    if (!respostaPersonagens.ok) {
        throw new Error("Não foi possível carregar os personagens. Verifique a conexão com o servidor.");
    }

    const dadosPerguntas = await respostaPerguntas.json();
    const dadosPersonagens = await respostaPersonagens.json();

    validarPerguntas(dadosPerguntas.perguntas);
    validarPersonagens(dadosPersonagens);

    perguntas = dadosPerguntas.perguntas;
    personagens = dadosPersonagens;

    quizContent.setAttribute("aria-busy", "false");
    renderizarPergunta();
}

// tela de perguntas
function atualizarProgresso() {
    const respondidas = Object.keys(respostasSelecionadas).length;
    const percentual = Math.round((respondidas / perguntas.length) * 100);
    const numeroAtual = String(perguntaAtual + 1).padStart(2, "0");

    questionNumber.textContent = `PERGUNTA ${numeroAtual} / ${perguntas.length}`;
    answeredPercent.textContent = `${percentual}% RESPONDIDO`;
    progressSegments.setAttribute("aria-valuenow", String(respondidas));
    progressSegments.setAttribute("aria-valuetext", `${respondidas} de ${perguntas.length} perguntas respondidas`);

    progressSegments.innerHTML = perguntas.map((pergunta, indice) => {
        let classe = "progress-segment";
        if (respostasSelecionadas[pergunta.id]) classe += " is-answered";
        else if (indice === perguntaAtual) classe += " is-current";
        return `<span class="${classe}" aria-hidden="true"></span>`;
    }).join("");
}

// Evita mostrar a pergunta duas vezes quando ela já é a última frase do contexto
function perguntaRepeteContexto(contexto, pergunta) {
    const limpar = (texto) => texto.toLowerCase().replace(/[.!?]+$/, "").trim();
    const ultimaFrase = contexto.trim().replace(/[.!?]+$/, "").split(/[.!?]\s+/).pop();
    return limpar(ultimaFrase) === limpar(pergunta);
}

function renderizarPergunta() {
    const pergunta = perguntas[perguntaAtual];
    const respostaAtual = respostasSelecionadas[pergunta.id];
    const ehUltima = perguntaAtual === perguntas.length - 1;

    const htmlPergunta = perguntaRepeteContexto(pergunta.contexto, pergunta.pergunta)
        ? ""
        : `<p class="question-prompt">${escaparHtml(pergunta.pergunta)}</p>`;

    const htmlAlternativas = pergunta.respostas.map((resposta) => `
        <button class="answer-option" type="button" data-option="${resposta.opcao}"
            aria-pressed="${resposta.opcao === respostaAtual}">
            <span class="answer-letter" aria-hidden="true">${resposta.opcao}</span>
            <span class="answer-text">${escaparHtml(resposta.resposta)}</span>
        </button>
    `).join("");

    atualizarProgresso();
    quizContent.innerHTML = `
        <p class="question-label">SELECIONE UMA ALTERNATIVA</p>
        <h1>${escaparHtml(pergunta.titulo)}</h1>
        <p class="question-context">${escaparHtml(pergunta.contexto)}</p>
        ${htmlPergunta}
        <div class="answer-list" role="group" aria-label="Alternativas">
            ${htmlAlternativas}
        </div>
        <nav class="quiz-nav" aria-label="Navegação do quiz">
            <button class="previous-button" type="button" ${perguntaAtual === 0 ? "hidden" : ""}>
                ← Pergunta anterior
            </button>
            <span class="keyboard-hint">ATALHOS 1–4</span>
            <button class="next-button" type="button" ${respostaAtual ? "" : "disabled"}>
                ${ehUltima ? "Ver resultado" : "Próxima pergunta"} →
            </button>
        </nav>
    `;

    quizContent.querySelectorAll(".answer-option").forEach((botao) => {
        botao.addEventListener("click", () => selecionarResposta(botao.dataset.option));
    });
    quizContent.querySelector(".previous-button").addEventListener("click", voltarPergunta);
    quizContent.querySelector(".next-button").addEventListener("click", avancarPergunta);
}

function selecionarResposta(opcao) {
    respostasSelecionadas[perguntas[perguntaAtual].id] = opcao;
    renderizarPergunta();
    quizContent.querySelector(`[data-option="${opcao}"]`).focus();
}

function voltarPergunta() {
    if (perguntaAtual > 0) {
        perguntaAtual--;
        renderizarPergunta();
    }
}

function avancarPergunta() {
    if (!respostasSelecionadas[perguntas[perguntaAtual].id]) return;

    if (perguntaAtual < perguntas.length - 1) {
        perguntaAtual++;
        renderizarPergunta();
    } else {
        finalizarQuiz();
    }
}

// calculo do resultado
// soma os valores (+1 / -1) das respostas escolhidas em cada dimensão
function calcularPerfil() {
    const perfil = {};
    dimensoes.forEach((dimensao) => {
        perfil[dimensao.chave] = 0;
    });

    for (const pergunta of perguntas) {
        const opcao = respostasSelecionadas[pergunta.id];
        const resposta = pergunta.respostas.find((item) => item.opcao === opcao);
        if (!resposta) throw new Error(`A pergunta ${pergunta.id} não foi respondida.`);
        perfil[pergunta.dimensao] += resposta.valor;
    }

    return perfil;
}

// compara o perfil com cada personagem e devolve o mais parecido
function calcularResultado(perfil) {
    const resultados = personagens.map((personagem) => {
        let distancia = 0;
        let iguais = 0;

        for (const dimensao of dimensoes) {
            const diferenca = Math.abs(perfil[dimensao.chave] - personagem[dimensao.chave]);
            distancia += diferenca;
            if (diferenca === 0) iguais++;
        }

        return { personagem, iguais, compatibilidade: 100 - distancia * 5 };
    });

    // Desempate: mais dimensões iguais, depois menor ID
    resultados.sort((a, b) => {
        return b.compatibilidade - a.compatibilidade
            || b.iguais - a.iguais
            || a.personagem.id - b.personagem.id;
    });

    return resultados[0];
}

function finalizarQuiz() {
    const perfil = calcularPerfil();
    const resultado = calcularResultado(perfil);
    quizFinalizado = true;
    renderizarResultado(perfil, resultado);
}

// ---------- Tela de resultado ----------
function criarGraficoRadar(canvas, valoresRadar) {
    new Chart(canvas, {
        type: "radar",
        data: {
            labels: dimensoes.map((dimensao) => [dimensao.codigo, dimensao.nome]),
            datasets: [{
                label: "Seu perfil",
                data: valoresRadar.map((dimensao) => dimensao.valor),
                backgroundColor: "rgba(244, 217, 0, 0.14)",
                borderColor: "#f4d900",
                borderWidth: 2,
                pointBackgroundColor: "#f4d900",
                pointBorderColor: "#080b13",
                pointHoverBackgroundColor: "#f1f2f5",
                pointHoverBorderColor: "#f4d900",
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.15,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (contexto) => `${dimensoes[contexto.dataIndex].nome}: ${contexto.raw}`
                    }
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 50,
                        color: "#a8afbd",
                        backdropColor: "transparent",
                        showLabelBackdrop: false
                    },
                    grid: { color: "#303744" },
                    angleLines: { color: "#3a424f" },
                    pointLabels: {
                        color: "#a8afbd",
                        font: { family: 'Consolas, "Courier New", monospace', size: 11 }
                    }
                }
            }
        }
    });
}

function renderizarResultado(perfil, resultado) {
    const personagem = resultado.personagem;

    // converte o perfil (-2 a 2) para uma escala de 0 a 100
    const valoresRadar = dimensoes.map((dimensao) => ({
        ...dimensao,
        valor: Math.round(((perfil[dimensao.chave] + 2) / 4) * 100)
    }));

    // O banco pode devolver os campos com nomes diferentes
    const imagemUrl = personagem.imagem_url || personagem.imagemUrl;
    const justificativa = personagem.justificativa || Object.values(personagem.justificativas || {}).join(" ");
    const tagline = personagem.tagline || personagem.descricao;
    const biografia = personagem.biografia || "";

    // Cabeçalho e barra de progresso
    quizMessage.hidden = true;
    siteHeader.hidden = false;
    quizContent.closest(".quiz").classList.add("with-site-header");
    window.scrollTo(0, 0);
    questionNumber.textContent = "SEU RESULTADO";
    answeredPercent.textContent = `${resultado.compatibilidade}% COMPATÍVEL`;
    progressSegments.setAttribute("aria-valuenow", String(perguntas.length));
    progressSegments.innerHTML = perguntas
        .map(() => '<span class="progress-segment is-answered" aria-hidden="true"></span>')
        .join("");

    // conteudo principal
    const htmlImagem = imagemUrl
        ? `<img src="${escaparHtml(imagemUrl)}" alt="Retrato de ${escaparHtml(personagem.nome)}">`
        : `<p class="result-character-fallback">${escaparHtml(personagem.nome)}</p>`;

    quizContent.classList.add("result-content");
    quizContent.innerHTML = `
        <div class="result-layout">
            <div class="result-character" id="result-character">${htmlImagem}</div>
            <div class="result-summary">
                <p class="result-eyebrow">PERSONAGEM MAIS COMPATÍVEL</p>
                <h1>${escaparHtml(personagem.nome)}</h1>
                <p class="compatibility">${resultado.compatibilidade}% DE COMPATIBILIDADE</p>
                ${tagline ? `<p class="result-tagline">${escaparHtml(tagline)}</p>` : ""}
                ${biografia ? `<p class="result-bio">${escaparHtml(biografia)}</p>` : ""}
                <p class="result-explanation">
                    Seu perfil coincide em ${resultado.iguais} das cinco dimensões. A compatibilidade expressa uma similaridade matemática entre perfis, não uma probabilidade de você ser este personagem.
                </p>
                ${justificativa ? `<p class="result-justification">${escaparHtml(justificativa)}</p>` : ""}
            </div>
        </div>
        <section class="radar-section" aria-labelledby="radar-heading">
            <h2 id="radar-heading">Seu perfil</h2>
            <div class="radar-chart-container">
                <canvas id="profile-radar" role="img"></canvas>
            </div>
            <ul class="radar-legend">
                ${valoresRadar.map((dimensao) => `
                    <li><span>${escaparHtml(dimensao.nome)}</span><strong>${dimensao.valor}</strong></li>
                `).join("")}
            </ul>
        </section>
        <p class="result-note">Este quiz é recreativo e não constitui avaliação ou diagnóstico psicológico.</p>
        <p class="result-save-note">O resultado foi calculado nesta sessão e não foi salvo no histórico.</p>
        <div class="result-actions">
            <button class="restart-button" type="button">Refazer quiz ↻</button>
        </div>
    `;

    // Se a imagem falhar, troca pelo nome do personagem
    const imagem = quizContent.querySelector(".result-character img");
    if (imagem) {
        imagem.addEventListener("error", () => {
            imagem.remove();
            const fallback = document.createElement("p");
            fallback.className = "result-character-fallback";
            fallback.textContent = personagem.nome;
            quizContent.querySelector("#result-character").appendChild(fallback);
        }, { once: true });
    }

    // Gráfico radar
    const canvasRadar = quizContent.querySelector("#profile-radar");
    const descricaoRadar = valoresRadar.map((dimensao) => `${dimensao.nome}: ${dimensao.valor}`).join("; ");
    canvasRadar.setAttribute("aria-label", `Gráfico radar do seu perfil. ${descricaoRadar}`);
    criarGraficoRadar(canvasRadar, valoresRadar);

    quizContent.querySelector(".restart-button").addEventListener("click", refazerQuiz);
}

function refazerQuiz() {
    respostasSelecionadas = {};
    perguntaAtual = 0;
    quizFinalizado = false;
    siteHeader.hidden = true;
    definirMenu(false);
    quizContent.closest(".quiz").classList.remove("with-site-header");
    quizContent.classList.remove("result-content");
    renderizarPergunta();
}

// ---------- Teclado ----------
document.addEventListener("keydown", (evento) => {
    // Esc sempre fecha o menu
    if (evento.key === "Escape") definirMenu(false);

    // Atalhos do quiz só funcionam durante as perguntas
    if (quizFinalizado || perguntas.length === 0) return;

    // Não atrapalha quem está digitando em campos de texto
    const elemento = evento.target;
    const estaDigitando = elemento.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT"].includes(elemento.tagName);
    if (estaDigitando) return;

    const pergunta = perguntas[perguntaAtual];
    const jaRespondeu = Boolean(respostasSelecionadas[pergunta.id]);

    if (["1", "2", "3", "4"].includes(evento.key)) {
        selecionarResposta(pergunta.respostas[Number(evento.key) - 1].opcao);
    } else if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        voltarPergunta();
    } else if (evento.key === "ArrowRight" && jaRespondeu) {
        evento.preventDefault();
        avancarPergunta();
    } else if (evento.key === "Enter" && jaRespondeu && elemento.tagName !== "BUTTON") {
        evento.preventDefault();
        avancarPergunta();
    }
});

// ---------- Início ----------
carregarDados().catch((erro) => {
    mostrarErro("Não foi possível carregar as perguntas ou os personagens do quiz.", erro);
});