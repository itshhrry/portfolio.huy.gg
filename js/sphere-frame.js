/* Places the page's intro inside the Sphere frame, at the top of the app's scrolling area, so it scrolls away with the
   content and the frame keeps the only scrollbar. The exported page is same-origin, and its <main> keeps every node
   outside #page across renders, so the intro stays once placed. */
(function () {
  const tpl = document.getElementById('sphere-intro');
  document.querySelectorAll('iframe.sphere-frame').forEach(function (f) {
    f.addEventListener('load', function () {
      const main = f.contentDocument && f.contentDocument.getElementById('main');
      if (main && tpl) main.insertBefore(tpl.content.cloneNode(true), main.firstChild);
    });
  });
})();
