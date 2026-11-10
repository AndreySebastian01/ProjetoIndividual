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