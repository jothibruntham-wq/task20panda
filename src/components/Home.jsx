import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../assets/style/style.css";

/* ---------- cloud background geometry (SVG user units) ---------- */
// bottom scalloped edge: circles whose lowest point touches the screen bottom
const BOTTOM_BUMPS = Array.from({ length: 9 }, (_, i) => {
  const r = 115 + (i % 3) * 8;
  return { cx: -105 + i * 210, cy: 170 - r, r };
});
const BOTTOM_SPARKS = [
  { x: 195, y: 150, r: 2.6 }, { x: 420, y: 140, r: 2 }, { x: 640, y: 158, r: 3 },
  { x: 835, y: 147, r: 2.2 }, { x: 1055, y: 156, r: 2.8 }, { x: 1265, y: 142, r: 2 },
  { x: 1470, y: 153, r: 2.6 }, { x: 95, y: 161, r: 1.8 },
];
// top-right scalloped corner
const CORNER_BUMPS = [
  { cx: 40, cy: 14, r: 75 }, { cx: 170, cy: 70, r: 85 }, { cx: 310, cy: 118, r: 90 },
  { cx: 450, cy: 150, r: 85 }, { cx: 590, cy: 172, r: 80 }, { cx: 730, cy: 186, r: 75 },
];
const CORNER_SPARKS = [
  { x: 520, y: 40, r: 2.6 }, { x: 640, y: 90, r: 2 }, { x: 700, y: 30, r: 3 },
  { x: 420, y: 12, r: 2 }, { x: 735, y: 95, r: 2.4 },
];

export default function Home() {
  const rootRef = useRef(null);
  const svgRef = useRef(null);
  const api = useRef(null); // animation functions created in the effect
  const toastTimer = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const root = rootRef.current;
    let removeMove = () => {};

    const ctx = gsap.context(() => {
      const lids = gsap.utils.toArray(".lid", root);
      const clamp = gsap.utils.clamp(-1, 1);
      let mode = "idle"; // idle | email | pw

      // initial state
      gsap.set(".lid", { svgOrigin: (i, el) => el.dataset.o, scaleY: 0 });
      gsap.set(".paw-l", { svgOrigin: "46 108" });
      gsap.set(".paw-r", { svgOrigin: "94 108" });
      gsap.set(".head", { svgOrigin: "70 110" });

      const look = (nx, ny, d = 0.3) => {
        gsap.to(".pupil, .shine", { x: nx * 3, y: ny * 3, duration: d, ease: "power2.out", overwrite: "auto" });
        gsap.to(".face", { x: nx * 4, y: ny * 2.5, duration: 0.5, ease: "power2.out", overwrite: "auto" });
        gsap.to(".head", { rotation: nx * 4, duration: 0.6, ease: "power2.out", overwrite: "auto" });
      };
      const openEyes = () => gsap.to(lids, { scaleY: 0, duration: 0.2, overwrite: "auto" });
      const lowerPaws = () =>
        gsap.to(".paw-l, .paw-r", { x: 0, y: 0, scale: 1, duration: 0.35, ease: "power2.in", overwrite: "auto" });
      const coverEyes = () => {
        gsap.to(".paw-l", { x: 5, y: -50, scale: 1.6, duration: 0.45, ease: "back.out(1.4)", overwrite: "auto" });
        gsap.to(".paw-r", { x: -5, y: -50, scale: 1.6, duration: 0.45, delay: 0.05, ease: "back.out(1.4)", overwrite: "auto" });
        gsap.to(lids, { scaleY: 1, duration: 0.2, delay: 0.2, overwrite: "auto" });
        look(0, 0, 0.2);
      };
      const peek = () => {
        gsap.to(".paw-l", { x: 5, y: -50, scale: 1.6, duration: 0.35, overwrite: "auto" });
        gsap.to(".paw-r", { x: 2, y: -8, scale: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        gsap.to(lids[0], { scaleY: 1, duration: 0.2, overwrite: "auto" });
        gsap.to(lids[1], { scaleY: 0.15, duration: 0.3, delay: 0.15, overwrite: "auto" });
        look(-0.6, 0.7, 0.3);
      };

      api.current = {
        emailFocus(value) {
          mode = "email";
          openEyes();
          lowerPaws();
          api.current.emailType(value);
        },
        emailType(value) {
          const f = Math.min(value.length / 26, 1);
          look(-0.9 + f * 1.8, 0.9, 0.25);
        },
        emailBlur() {
          if (mode === "email") { mode = "idle"; look(0, 0); }
        },
        pwFocus(visible) {
          mode = "pw";
          visible ? peek() : coverEyes();
        },
        pwBlur() {
          if (mode === "pw") { mode = "idle"; lowerPaws(); openEyes(); look(0, 0); }
        },
        pwVisibility(visible) {
          if (mode === "pw") visible ? peek() : coverEyes();
        },
        happy() {
          gsap.fromTo(".panda", { y: 0 }, { y: -12, yoyo: true, repeat: 3, duration: 0.14, ease: "power1.out" });
        },
        shake() {
          gsap.fromTo(".head", { x: -5 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.25)" });
        },
      };

      // eyes follow the cursor while nothing is focused
      const onMove = (e) => {
        if (mode !== "idle" || !svgRef.current) return;
        const r = svgRef.current.getBoundingClientRect();
        look(
          clamp((e.clientX - (r.left + r.width / 2)) / 300),
          clamp((e.clientY - (r.top + r.height / 2)) / 300)
        );
      };
      window.addEventListener("pointermove", onMove);
      removeMove = () => window.removeEventListener("pointermove", onMove);

      // random blink
      const blink = () => {
        gsap.delayedCall(2 + Math.random() * 3, () => {
          if (mode !== "pw") {
            gsap.timeline().to(lids, { scaleY: 1, duration: 0.07 }).to(lids, { scaleY: 0, duration: 0.09 });
          }
          blink();
        });
      };
      blink();

      /* ---------- looping cloud background (video-like) ---------- */
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // cloud bumps gently "breathe" and drift sideways
        gsap.utils.toArray(".bump", root).forEach((c, i) => {
          const r = parseFloat(c.getAttribute("r"));
          gsap.to(c, {
            attr: { r: r + 9 }, duration: 2.6 + (i % 4) * 0.55,
            ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.17,
          });
          gsap.to(c, {
            x: (i % 2 ? 1 : -1) * (8 + (i % 3) * 4), duration: 5 + (i % 3) * 1.4,
            ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.1,
          });
        });
        // sparkles twinkle and float
        gsap.utils.toArray(".spark", root).forEach((s) => {
          gsap.fromTo(s, { opacity: 0.08 }, {
            opacity: 0.9, duration: 1 + Math.random() * 1.6, ease: "sine.inOut",
            yoyo: true, repeat: -1, delay: Math.random() * 2,
          });
          gsap.to(s, {
            y: -(6 + Math.random() * 10), duration: 3 + Math.random() * 3,
            ease: "sine.inOut", yoyo: true, repeat: -1,
          });
        });
        // slow shimmer on the green behind the clouds
        gsap.to(root, {
          "--bg-shift": "12%", duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1,
        });
      }
    }, root);

    return () => {
      removeMove();
      clearTimeout(toastTimer.current);
      ctx.revert(); // kills tweens + delayed calls
    };
  }, []);

  const flash = (text) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    document.activeElement?.blur();
    const ok = /\S+@\S+\.\S+/.test(email) && password.length >= 4;
    if (ok) {
      flash("Logged in. Welcome back!");
      api.current?.happy();
    } else {
      flash("Enter a valid email and a password of 4+ characters.");
      api.current?.shake();
    }
  };

  const toggleVisibility = () => {
    const next = !showPw;
    setShowPw(next);
    api.current?.pwVisibility(next);
  };

  return (
    <div className="panda-page" ref={rootRef}>
      {/* animated cloud background */}
      <div className="pl-sky" aria-hidden="true">
        <div className="pl-white" />

        <svg
          className="pl-cloud-corner"
          viewBox="0 0 760 300"
          preserveAspectRatio="xMaxYMin meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="plCornerGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: "var(--bg2)" }} />
              <stop offset="1" style={{ stopColor: "var(--bg1)" }} />
            </linearGradient>
          </defs>
          <rect x="2" width="758" height="298" fill="url(#plCornerGrad)" />
          {/* white body of the cloud; extends past the viewBox so no hairline seams show */}
          <polygon
            className="pl-fill"
            points="-10,-10 190,-10 190,40 310,118 450,150 590,172 730,186 800,190 800,310 -10,310"
          />
          {CORNER_BUMPS.map((b, i) => (
            <circle key={i} className="bump pl-fill" cx={b.cx} cy={b.cy} r={b.r} />
          ))}
          {CORNER_SPARKS.map((s, i) => (
            <circle key={i} className="spark" cx={s.x} cy={s.y} r={s.r} />
          ))}
        </svg>

        <svg
          className="pl-cloud-bottom"
          viewBox="0 0 1600 170"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect className="pl-fill" x="0" y="0" width="1600" height="80" />
          {BOTTOM_BUMPS.map((b, i) => (
            <circle key={i} className="bump pl-fill" cx={b.cx} cy={b.cy} r={b.r} />
          ))}
          {BOTTOM_SPARKS.map((s, i) => (
            <circle key={i} className="spark" cx={s.x} cy={s.y} r={s.r} />
          ))}
        </svg>
      </div>

      <div className={`pl-toast-wrap`} aria-live="polite">
        <div className={`pl-toast ${toast ? "show" : ""}`}>{toast}</div>
      </div>

      <div className="pl-shell">
        <div className="pl-left">
          <h1>Hello!</h1>
          <p className="pl-sub">Sign in to your account</p>

          <svg
            ref={svgRef}
            className="panda"
            viewBox="0 0 140 120"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Panda mascot"
          >
            <g className="head">
              <circle cx="28" cy="28" r="15" fill="#1b1b1b" />
              <circle cx="112" cy="28" r="15" fill="#1b1b1b" />
              <ellipse cx="70" cy="64" rx="52" ry="46" fill="#f7f7f7" stroke="#e3e3e3" strokeWidth="2" />
              <g className="face">
                <ellipse cx="50" cy="60" rx="12" ry="15" fill="#1b1b1b" transform="rotate(18 50 60)" />
                <ellipse cx="90" cy="60" rx="12" ry="15" fill="#1b1b1b" transform="rotate(-18 90 60)" />
                <circle cx="51" cy="58" r="6" fill="#fff" />
                <circle cx="89" cy="58" r="6" fill="#fff" />
                <circle className="pupil" cx="51" cy="58" r="3.6" fill="#111" />
                <circle className="pupil" cx="89" cy="58" r="3.6" fill="#111" />
                <circle className="shine" cx="52.3" cy="56.6" r="1.1" fill="#fff" />
                <circle className="shine" cx="90.3" cy="56.6" r="1.1" fill="#fff" />
                <rect className="lid" data-o="51 50" x="43" y="50" width="16" height="16" fill="#1b1b1b" />
                <rect className="lid" data-o="89 50" x="81" y="50" width="16" height="16" fill="#1b1b1b" />
                <ellipse cx="70" cy="77" rx="5.5" ry="4" fill="#1b1b1b" />
                <path d="M64 85 Q70 90 76 85" fill="none" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round" />
              </g>
            </g>
            <ellipse className="paw-l" cx="46" cy="108" rx="12" ry="9" fill="#1b1b1b" />
            <ellipse className="paw-r" cx="94" cy="108" rx="12" ry="9" fill="#1b1b1b" />
          </svg>

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="pl-field">
              <svg className="pl-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); api.current?.emailType(e.target.value); }}
                onFocus={() => api.current?.emailFocus(email)}
                onBlur={() => api.current?.emailBlur()}
              />
            </div>

            <div className="pl-field">
              <svg className="pl-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => api.current?.pwFocus(showPw)}
                onBlur={() => api.current?.pwBlur()}
              />
              <button
                type="button"
                className="pl-toggle"
                aria-label={showPw ? "Hide password" : "Show password"}
                onMouseDown={(e) => e.preventDefault()} // keep focus in the password input
                onClick={toggleVisibility}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPw && <path d="M3 3l18 18" />}
                </svg>
              </button>
            </div>

            <div className="pl-row">
              <label>
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a href="#forgot">Forgot password?</a>
            </div>

            <button className="pl-submit" type="submit">Log in</button>
            <div className="pl-foot">
              Don&apos;t have an account? <a href="#signup">Sign up</a>
            </div>
          </form>
        </div>

        <div className="pl-right">
          <h2>Welcome Back!</h2>
          <p>
            Good to see you again. Sign in to pick up right where you left off.
            Your panda keeps an eye on things, until you type your password.
          </p>
        </div>
      </div>
    </div>
  );
}