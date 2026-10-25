/** Inline, render-blocking theme resolver: applies the saved or system theme before first paint (no flash). */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
