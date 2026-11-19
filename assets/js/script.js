document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupScrollAnimations();
    setupWhatsappPulse();
    setupCarousels();
});

/* ---------- Menu (mobile) ---------- */

function setupNavigation() {
    const navbar = document.getElementById("navbar");
    const toggle = document.getElementById("navToggle");
    const links = document.querySelectorAll(".nav-links a");
    if (!navbar || !toggle) return;

    function setOpen(open) {
        navbar.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }

    toggle.addEventListener("click", () => {
        setOpen(!navbar.classList.contains("is-open"));
    });

    // Fecha ao escolher um link (a rolagem suave e o offset do header ficam por conta do CSS)
    links.forEach((link) => link.addEventListener("click", () => setOpen(false)));

    // Esc fecha o menu e devolve o foco ao botão
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navbar.classList.contains("is-open")) {
            setOpen(false);
            toggle.focus();
        }
    });

    // Clique fora do menu fecha
    document.addEventListener("click", (e) => {
        if (navbar.classList.contains("is-open") && !navbar.contains(e.target)) {
            setOpen(false);
        }
    });
}

/* ---------- Animações de entrada ao rolar ---------- */

function setupScrollAnimations() {
    if (!("IntersectionObserver" in window)) return;

    // Só elementos individuais (sem aninhamento) e os depoimentos ficam de fora
    const targets = document.querySelectorAll(
        ".about-container, .gallery-section .carousel, .service-card, .services-list-wrapper, .faq-item"
    );

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("element-visible");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    targets.forEach((el) => {
        // A classe é adicionada via JS: sem JS, o conteúdo continua visível
        el.classList.add("element-hidden");
        observer.observe(el);
    });
}

/* ---------- Pulso único no botão do WhatsApp ---------- */

function setupWhatsappPulse() {
    const btn = document.getElementById("whatsappBtn");
    if (!btn) return;

    // O botão é fixo e já está na tela desde o início; o pulso dispara depois de um tempo
    // via classe CSS (não usa style inline, então o :hover continua funcionando).
    // Com prefers-reduced-motion o CSS já anula a animação.
    setTimeout(() => {
        btn.classList.add("is-pulsing");
        btn.addEventListener("animationend", () => btn.classList.remove("is-pulsing"), { once: true });
    }, 2500);
}

/* ---------- Carrossel de fotos ---------- */

function setupCarousels() {
    document.querySelectorAll(".carousel").forEach((carousel) => initCarousel(carousel));
}

function initCarousel(carousel) {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(track.querySelectorAll(".carousel-slide"));
    const dotsWrap = carousel.querySelector(".carousel-dots");
    const prevBtn = carousel.querySelector(".carousel-arrow--prev");
    const nextBtn = carousel.querySelector(".carousel-arrow--next");
    const pauseBtn = carousel.querySelector(".carousel-pause");

    // Sem autoplay para quem prefere menos movimento
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const autoplayDelay = reduceMotion ? 0 : (parseInt(carousel.dataset.autoplay, 10) || 0);

    if (slides.length === 0) return;

    let current = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
    let timer = null;
    let userPaused = false; // pausa escolhida pelo botão

    // Cria os dots dinamicamente, um por slide
    const dots = slides.map((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("aria-label", `Ir para foto ${i + 1}`);
        dot.addEventListener("click", () => { goTo(i); startAutoplay(); });
        dotsWrap.appendChild(dot);
        return dot;
    });

    function render() {
        slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
        dots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === current);
            if (i === current) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
    }

    function goTo(index) {
        current = (index + slides.length) % slides.length;
        render();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAutoplay() {
        stopAutoplay();
        if (!autoplayDelay || slides.length < 2 || userPaused) return;
        timer = setInterval(next, autoplayDelay);
    }

    function stopAutoplay() {
        if (timer) clearInterval(timer);
        timer = null;
    }

    prevBtn?.addEventListener("click", () => { prev(); startAutoplay(); });
    nextBtn?.addEventListener("click", () => { next(); startAutoplay(); });

    // Botão de pausar/retomar (só aparece se existe autoplay)
    if (pauseBtn && autoplayDelay && slides.length > 1) {
        pauseBtn.hidden = false;
        pauseBtn.addEventListener("click", () => {
            userPaused = !userPaused;
            pauseBtn.classList.toggle("is-paused", userPaused);
            pauseBtn.setAttribute(
                "aria-label",
                userPaused ? "Retomar rotação automática" : "Pausar rotação automática"
            );
            if (userPaused) stopAutoplay();
            else startAutoplay();
        });
    }

    // Pausa ao passar o mouse (somente mouse: toques não "prendem" o autoplay) ou ao focar
    carousel.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") stopAutoplay(); });
    carousel.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") startAutoplay(); });
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    // Navegação por teclado quando o carrossel está em foco
    carousel.setAttribute("tabindex", "0");
    carousel.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { prev(); startAutoplay(); }
        if (e.key === "ArrowRight") { next(); startAutoplay(); }
    });

    // Swipe em telas de toque: só conta se o gesto for mais horizontal que vertical
    let startX = 0;
    let startY = 0;

    track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        stopAutoplay();
    }, { passive: true });

    track.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) prev();
            else next();
        }
        startAutoplay();
    });

    render();
    startAutoplay();
}