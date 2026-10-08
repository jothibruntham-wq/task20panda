import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../assets/style/style.css";

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