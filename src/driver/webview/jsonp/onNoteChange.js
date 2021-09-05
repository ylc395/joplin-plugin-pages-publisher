(function () {
  const src = document.currentScript.src;
  const [_, id] = src.match(/\?id=(.+?)&/);
  window.appEventBus.emit('noteChange', id);
  document.currentScript.remove();
})();
