import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Hero from './sections/Hero.jsx';
import Services from './sections/Services.jsx';
import AboutUs from './sections/AboutUs.jsx';
import Team from './sections/Team.jsx';
import Gallery from './sections/Gallery.jsx';
import Benefits from './sections/Benefits.jsx';
import Awards from './sections/Awards.jsx';
import Reviews from './sections/Reviews.jsx';
import Enrollment from './sections/Enrollment.jsx';
import Pricing from './sections/Pricing.jsx';
import ApplicationForm from './components/ApplicationForm.jsx';
import Preloader from './components/Preloader.jsx';
import './components/Preloader.css';

export default function App() {
  const [heroRevealing, setHeroRevealing] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const markHeroVideoReady = useCallback(() => setHeroVideoReady(true), []);
  const [language, setLanguage] = useState('UA');
  const [application, setApplication] = useState(null);
  const [applicationClosing, setApplicationClosing] = useState(false);
  const applicationTrigger = useRef(null);
  const applicationTimer = useRef(null);
  const showHero = useCallback(() => setHeroRevealing(true), []);
  const lenisRef = useRef(null);
  const onGalleryModalChange = useCallback((open) => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (open) lenis.stop();
    else {
      lenis.resize();
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      lenis.start();
    }
  }, []);
  const transitionTimers = useRef([]);
  const transitionActiveRef = useRef(false);
  const aboutImageReadyRef = useRef(null);
  const [sectionTransitionPhase, setSectionTransitionPhase] = useState('idle');

  const openApplication = useCallback((tariff) => {
    if (transitionActiveRef.current) return;
    applicationTrigger.current = document.activeElement;
    lenisRef.current?.stop();
    setApplicationClosing(false);
    setApplication(tariff);
  }, []);
  const closeApplication = useCallback((success = false) => {
    if (applicationTimer.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setApplicationClosing(true);
    if (success) {
      transitionActiveRef.current = true;
      setSectionTransitionPhase('enter');
      transitionTimers.current.push(window.setTimeout(() => setSectionTransitionPhase('logo-in'), 500));
    }
    applicationTimer.current = window.setTimeout(() => {
      applicationTimer.current = null;
      setApplication(null);
      setApplicationClosing(false);
      if (success) {
        if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
        else window.scrollTo(0, 0);
        transitionTimers.current.push(window.setTimeout(() => setSectionTransitionPhase('logo-out'), 1000));
        transitionTimers.current.push(window.setTimeout(() => setSectionTransitionPhase('exit'), 1650));
        transitionTimers.current.push(window.setTimeout(() => {
          setSectionTransitionPhase('idle');
          transitionActiveRef.current = false;
          lenisRef.current?.start();
        }, 2650));
      } else {
        lenisRef.current?.start();
        applicationTrigger.current?.focus({preventScroll:true});
      }
    }, success ? 1000 : reduced ? 0 : 650);
  }, []);
  useEffect(() => () => window.clearTimeout(applicationTimer.current), []);

  // Image decoding can be deferred until the first time a large CSS
  // background appears. Start it as soon as the app mounts instead.
  const prepareAboutImage = useCallback(() => {
    if (!aboutImageReadyRef.current) {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}images/About-Us-Section.webp`;
      aboutImageReadyRef.current = (img.decode
        ? img.decode()
        : new Promise((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        })
      ).catch(() => {});
    }
    return aboutImageReadyRef.current;
  }, []);

  useEffect(() => {
    prepareAboutImage();
  }, [prepareAboutImage]);

  useEffect(() => () => {
    transitionTimers.current.forEach(window.clearTimeout);
    lenisRef.current?.start();
  }, []);

  const navigateWithSplash = useCallback((href) => {
    if (!['#services', '#about', '#team', '#gallery', '#benefits', '#awards', '#reviews', '#enrollment', '#pricing', '#contacts'].includes(href) || transitionActiveRef.current) return;
    const section = document.querySelector(href);
    if (!section) return;

    transitionActiveRef.current = true;
    transitionTimers.current.forEach(window.clearTimeout);
    lenisRef.current?.stop();

    // Inspired by Bali Villa: a bottom-up curtain, a centered logo reveal,
    // a brief hold, an invisible page jump, then a smooth downward exit.
    setSectionTransitionPhase('enter');

    const schedule = (callback, delay) => {
      transitionTimers.current.push(window.setTimeout(callback, delay));
    };

    schedule(() => setSectionTransitionPhase('logo-in'), 500);
    schedule(async () => {
      // Keep the curtain fully closed until the background image is decoded
      // and the text fonts are ready. This matters on the FIRST navigation.
      if (href === '#about') {
        await Promise.all([prepareAboutImage(), document.fonts.ready]);
      }

      if (href === '#benefits') {
        const image = document.querySelector('#benefits .benefits__photo');
        const frost = document.querySelector('#benefits .benefits__card-photo');
        // Load the lazy background before revealing the destination.
        await Promise.all([
          ...[image, frost].filter(Boolean).map(img => {
            img.loading = 'eager';
            return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
          }),
          document.fonts.ready,
        ]);
      }

      const currentSection = document.querySelector(href);
      if (href === '#pricing' && currentSection) {
        await document.fonts.ready;
        currentSection.dispatchEvent(new Event('pricing:prepare-navigation'));
      }
      if (currentSection) {
        const sectionTop = window.scrollY + currentSection.getBoundingClientRect().top;
        const travel = Math.max(0, currentSection.offsetHeight - window.innerHeight);
        const targetY = href === '#about' ? sectionTop + travel * 0.97 : sectionTop + 1;
        if (lenisRef.current) lenisRef.current.scrollTo(targetY, { immediate: true, force: true });
        else window.scrollTo({ top: targetY, behavior: 'instant' });
      }

      // Two frames let the browser settle the photo, text and glass BEFORE
      // the user sees them, rather than during the curtain's exit.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!transitionActiveRef.current) return;
        setSectionTransitionPhase('logo-out');
        schedule(() => {
          setSectionTransitionPhase('exit');
          if (href === '#pricing') {
            // Reveal the cards while the curtain lifts, not during the hidden jump.
            schedule(() => currentSection?.dispatchEvent(new Event('pricing:reveal-navigation')), 480);
          }
        }, 650);
        schedule(() => {
          if (lenisRef.current) {
            lenisRef.current.scrollTo(window.scrollY, { immediate: true, force: true });
            lenisRef.current.start();
          }
          setSectionTransitionPhase('idle');
          transitionActiveRef.current = false;
        }, 1650);
      }));
    }, 2050);
  }, [prepareAboutImage]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Same smooth-wheel scrolling setup used on the Bali Villa website.
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      syncTouch: false,
      autoResize: true,
    });
    lenisRef.current = lenis;
    let frame;
    const animate = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);
  return (
    <>
      <Preloader onReveal={showHero} videoReady={heroVideoReady} />
      <div
        className={`skawi-section-transition skawi-section-transition--${sectionTransitionPhase}`}
        aria-hidden="true"
      >
        <div className="skawi-section-transition__logo">
          <img src={`${import.meta.env.BASE_URL}images/logo.webp`} alt="" width="220" height="220" />
        </div>
      </div>
      <main inert={application !== null}>
        <Hero onVideoReady={markHeroVideoReady} revealing={heroRevealing} language={language} onLanguageChange={setLanguage} onSectionNavigate={navigateWithSplash} />
        <Services language={language} />
        <AboutUs language={language} />
        <Team language={language} />
        <Gallery language={language} onModalChange={onGalleryModalChange} />
        <Benefits language={language} />
        <Awards language={language} />
        <Reviews language={language} onModalChange={onGalleryModalChange} />
        <Enrollment language={language} />
        <Pricing language={language} onApply={openApplication} />
      </main>
      {application !== null && <ApplicationForm tariff={application} language={language} closing={applicationClosing} onClose={closeApplication} />}
    </>
  );
}
