(() => {
  const projectStage = document.querySelector("[data-project-stage]");
  const projectCards = Array.from(document.querySelectorAll(".project-card"));
  const projectDots = Array.from(document.querySelectorAll(".project-dot"));
  const currentLabel = document.querySelector("[data-project-current]");
  const progressBar = document.querySelector("[data-project-progress]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileViewport = window.matchMedia("(max-width: 767px)");
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (!projectStage || !projectCards.length) return;

  const setActiveProject = (index) => {
    projectCards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === index);
    });
    projectDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });
    if (currentLabel) currentLabel.textContent = String(index + 1).padStart(2, "0");
  };

  projectDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (mobileViewport.matches || reduceMotion.matches || !hasGsap) {
        projectCards[index].scrollIntoView({ behavior: "smooth", block: "center" });
        setActiveProject(index);
        return;
      }

      const trigger = ScrollTrigger.getById("project-showcase");
      if (!trigger) return;
      const progress = index / (projectCards.length - 1);
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: "smooth" });
    });
  });

  if (typeof Lenis !== "undefined" && hasGsap && !reduceMotion.matches) {
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  if (!hasGsap || reduceMotion.matches) return;

  gsap.registerPlugin(ScrollTrigger);

  const responsiveAnimations = gsap.matchMedia();
  responsiveAnimations.add("(min-width: 768px)", () => {
      projectStage.classList.add("has-pinned-projects");
      gsap.set(projectCards.slice(1), { autoAlpha: 0, y: 28 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "project-showcase",
          trigger: projectStage,
          start: "top top+=90",
          end: () => `+=${window.innerHeight * (projectCards.length - 1)}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressBar) gsap.set(progressBar, { scaleX: Math.max(0.25, self.progress) });
          },
        },
      });

      projectCards.forEach((card, index) => {
        if (index === 0) return;
        const previous = projectCards[index - 1];
        const transitionPoint = index - 1;
        timeline
          .to(previous, { autoAlpha: 0, y: -24, duration: 0.45, ease: "power2.inOut" }, transitionPoint)
          .to(card, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out" }, transitionPoint + 0.2)
          .call(() => setActiveProject(index), [], transitionPoint + 0.3);
      });

      return () => {
        projectStage.classList.remove("has-pinned-projects");
        projectCards.forEach((card) => gsap.set(card, { clearProps: "all" }));
        setActiveProject(0);
      };
  });
})();