/**
 * Runs in <head> before first paint: sets the theme (no flash) and decides
 * whether the preloader plays (first visit per session only).
 */
export const headScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;d.style.colorScheme=t}catch(e){d.dataset.theme='light'}try{if(sessionStorage.getItem('preloaded')||matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.preloader='skip'}else{d.dataset.preloader='show';sessionStorage.setItem('preloaded','1')}}catch(e){d.dataset.preloader='skip'}})();`;
