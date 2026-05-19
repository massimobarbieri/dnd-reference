(function () {
  'use strict';

  if (window.location.protocol !== 'file:') return;

  var target = 'http://localhost:8080/' + (window.location.hash || '#/');
  window.location.replace(target);
})();
