// Háttérvideók progresszív bekapcsolása. A dekoratív, néma, loopolt háttérvideók
// reduced-motion esetén is mennek (sok Windows-gépen alapból ki van kapcsolva az
// animáció — különben a látogatók többsége sosem látná a videókat). Csak a
// Save-Data (mért/adattakarékos kapcsolat) tiltja le. A nem-hero videók lazy módon töltődnek.
export function shouldAutoplay({ saveData }) {
  return !saveData;
}

function loadVideo(v) {
  v.muted = true; // a böngésző autoplay-szabálya miatt explicit muted property kell
  v.querySelectorAll("source[data-src]").forEach((s) => {
    if (!s.src) s.src = s.dataset.src;
  });
  v.load();
  const play = v.play?.();
  if (play && typeof play.catch === "function") play.catch(() => {});
}

let initialised = false;
export function initVideos(doc = document) {
  if (initialised) return;
  initialised = true;
  const saveData = navigator.connection?.saveData ?? false;

  const videos = [...doc.querySelectorAll("video[data-bg]")];
  if (!shouldAutoplay({ saveData })) {
    // Save-Data: poszter marad, semmit nem töltünk
    return;
  }

  // data-lazy is a valueless boolean attribute; `"lazy" in v.dataset` is the correct test
  const eager = videos.filter((v) => !("lazy" in v.dataset));
  const lazy = videos.filter((v) => "lazy" in v.dataset);

  eager.forEach(loadVideo);

  // Autoplay-blokk fallback: ha a böngésző tiltja az autoplayt, az első
  // felhasználói interakcióra (kattintás/görgetés/billentyű) elindítjuk a videókat.
  const kick = () => {
    videos.forEach((v) => {
      if (v.querySelector("source[data-src]")?.src) {
        v.muted = true;
        const p = v.play?.();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    });
  };
  ["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach((ev) =>
    window.addEventListener(ev, kick, { once: true, passive: true })
  );

  if (lazy.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            loadVideo(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "200px" }
    );
    lazy.forEach((v) => io.observe(v));
  } else {
    lazy.forEach(loadVideo);
  }
}
