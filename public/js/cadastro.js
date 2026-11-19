let itensMenu = document.querySelectorAll(".navHeader ol li");

itensMenu.forEach((item) => {
    item.querySelector("a").addEventListener("click", () => {
        itensMenu.forEach((outroItem) => {
            outroItem.classList.remove("ativo");
        });
        item.classList.add("ativo");
    });
});

let menuHamburguer = document.querySelector(".menuHamburguer");
let menuNavegacao = document.querySelector(".navHeader");

let fecharMenu = () => {
    menuHamburguer.classList.remove("aberto");
    menuNavegacao.classList.remove("aberto");
    menuHamburguer.setAttribute("aria-expanded", "false");
    menuHamburguer.setAttribute("aria-label", "Abrir menu");
};

menuHamburguer.addEventListener("click", () => {
    let estaAberto = menuHamburguer.classList.toggle("aberto");
    menuNavegacao.classList.toggle("aberto", estaAberto);
    menuHamburguer.setAttribute("aria-expanded", String(estaAberto));
    menuHamburguer.setAttribute("aria-label", estaAberto ? "Fechar menu" : "Abrir menu");
});

document.querySelectorAll(".navHeader a").forEach((link) => {
    link.addEventListener("click", fecharMenu);
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
        fecharMenu();
    }
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        fecharMenu();
    }
});

let header = document.querySelector("header");
let hero = document.querySelector(".hero");

let atualizarHeader = () => {
    let limiteDeRolagem = 80;
    header.classList.toggle("header-solid", window.scrollY > limiteDeRolagem);
};

atualizarHeader();
window.addEventListener("scroll", atualizarHeader);

const formularioEmail = document.querySelector("#quiz_form_email");
const campoEmail = formularioEmail.querySelector("#email");
const botaoIniciarQuiz = formularioEmail.querySelector('button[type="submit"]');

campoEmail.addEventListener("input", () => campoEmail.setCustomValidity(""));

formularioEmail.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    botaoIniciarQuiz.disabled = true;
    campoEmail.setCustomValidity("");

    try {
        sessionStorage.removeItem("dashboardData");
        const resposta = await fetch("/api/quiz/validar-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: campoEmail.value })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível validar o e-mail.");
        }

        sessionStorage.setItem("quizEmail", dados.email);
        window.location.href = "quiz.html";
    } catch (erro) {
        console.error("Não foi possível validar o e-mail do quiz.", erro);
        campoEmail.setCustomValidity(erro.message || "Não foi possível conectar ao servidor.");
        campoEmail.reportValidity();
        botaoIniciarQuiz.disabled = false;
    }
});
