/*
 * BillingEase prototype runtime.
 *
 * A small standalone renderer for the `.dc.html` screen files so they can be
 * served from any static file server. It understands the subset of the format
 * the screens use:
 *   - {{ path }} holes (dotted lookups, plus true/false/null/number/'string' literals)
 *   - <sc-for list as>, <sc-if value>
 *   - <dc-import name="Other"> child components (loads Other.dc.html)
 *   - <helmet> (moved into <head>)
 *   - onXxx="{{ handler }}" event bindings
 *   - class Component extends DCLogic { renderVals() {...} } with setState
 */
(function () {
  'use strict';

  var HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/;

  // Stop the browser from parsing the raw template (holes like d="{{x}}" would
  // log errors); we fetch and render our own copy. Everything after this
  // script becomes inert text inside a hidden <plaintext>.
  var hide = document.createElement('style');
  hide.textContent = 'x-dc,plaintext{display:none!important}';
  document.head.appendChild(hide);
  if (document.readyState === 'loading') document.write('<plaintext>');

  // ---- loading & parsing --------------------------------------------------

  var fileCache = {};

  function loadFile(url) {
    if (!fileCache[url]) {
      fileCache[url] = fetch(url, { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('Could not load ' + url + ' (' + r.status + ')');
          return r.text();
        })
        .then(parseSource);
    }
    return fileCache[url];
  }

  function parseSource(text) {
    // <sc-for>/<sc-if> become <template> so the HTML parser keeps them in place
    // inside tables and selects instead of hoisting them out.
    var src = text
      .replace(/<sc-for\b/g, '<template data-sc-for')
      .replace(/<\/sc-for>/g, '</template>')
      .replace(/<sc-if\b/g, '<template data-sc-if')
      .replace(/<\/sc-if>/g, '</template>');
    var doc = new DOMParser().parseFromString(src, 'text/html');
    var root = doc.querySelector('x-dc');
    var script = doc.querySelector('script[data-dc-script]');
    var defaults = {};
    if (script && script.getAttribute('data-props')) {
      try {
        var decl = JSON.parse(script.getAttribute('data-props'));
        Object.keys(decl).forEach(function (k) {
          if (k.charAt(0) !== '$' && decl[k] && 'default' in decl[k]) defaults[k] = decl[k]['default'];
        });
      } catch (e) {
        console.error('[dc] bad data-props', e);
      }
    }
    var Klass = DCLogic;
    if (script) {
      try {
        Klass = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic);
      } catch (e) {
        console.error('[dc] script error', e);
      }
    }
    return { root: root, Klass: Klass, defaults: defaults };
  }

  // ---- component base ------------------------------------------------------

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch, cb) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next || {});
    if (this.__inst) this.__inst.schedule();
    if (cb) setTimeout(cb, 0);
  };
  DCLogic.prototype.forceUpdate = function () {
    if (this.__inst) this.__inst.schedule();
  };
  DCLogic.prototype.renderVals = function () {
    return {};
  };
  window.DCLogic = DCLogic;

  // ---- holes ---------------------------------------------------------------

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    var q = expr.match(/^'(.*)'$/) || expr.match(/^"(.*)"$/);
    if (q) return q[1];
    var parts = expr.split('.');
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interp(str, scope) {
    return str.replace(HOLE, function (_, e) {
      var v = lookup(e, scope);
      return v == null || v === false ? '' : String(v);
    });
  }

  // ---- instances -----------------------------------------------------------

  function Instance(parsed, props, host, name) {
    this.parsed = parsed;
    this.name = name;
    this.host = host;
    this.children = {};
    this.logic = new parsed.Klass(Object.assign({}, parsed.defaults, props));
    if (!this.logic.state) this.logic.state = {};
    this.logic.__inst = this;
    this.pending = false;
    this.mounted = false;
  }

  Instance.prototype.schedule = function () {
    var self = this;
    if (self.pending) return;
    self.pending = true;
    Promise.resolve().then(function () {
      self.pending = false;
      self.render();
    });
  };

  Instance.prototype.setProps = function (props) {
    this.logic.props = Object.assign({}, this.parsed.defaults, props);
    this.render();
  };

  Instance.prototype.render = function () {
    var vals;
    try {
      vals = this.logic.renderVals() || {};
    } catch (e) {
      console.error('[dc] renderVals failed in ' + this.name, e);
      return;
    }
    this.seen = {};
    this.importCount = 0;
    var next = document.createElement('div');
    var kids = this.parsed.root ? this.parsed.root.childNodes : [];
    for (var i = 0; i < kids.length; i++) this.renderNode(kids[i], vals, next);
    // Patch the live DOM instead of replacing it, so CSS animations, focus,
    // scroll positions and input state survive re-renders.
    if (!this.host.firstChild) {
      while (next.firstChild) this.host.appendChild(next.firstChild);
    } else {
      morphChildren(this.host, next);
    }
    var self = this;
    Object.keys(this.children).forEach(function (k) {
      if (!self.seen[k]) delete self.children[k];
    });
    this.syncChildren();
    if (!this.mounted) {
      this.mounted = true;
      if (typeof this.logic.componentDidMount === 'function') this.logic.componentDidMount();
    } else if (typeof this.logic.componentDidUpdate === 'function') {
      this.logic.componentDidUpdate();
    }
  };

  // Point each child component at its live holder element and render it there.
  Instance.prototype.syncChildren = function () {
    var holders = {};
    (function walk(node) {
      for (var c = node.firstElementChild; c; c = c.nextElementSibling) {
        if (c.hasAttribute('data-dc-import')) { holders[c.__dcKey] = c; continue; }
        walk(c);
      }
    })(this.host);
    var self = this;
    Object.keys(this.children).forEach(function (key) {
      var rec = self.children[key];
      var live = holders[key];
      if (!live) return;
      rec.host = live;
      if (rec.inst) {
        rec.inst.host = live;
        rec.inst.setProps(rec.props);
      } else if (!rec.loading) {
        rec.loading = true;
        loadFile(rec.name + '.dc.html').then(function (parsed) {
          rec.inst = new Instance(parsed, rec.props, rec.host, rec.name);
          rec.inst.render();
        }).catch(function (e) {
          console.error('[dc] import failed: ' + rec.name, e);
        });
      }
    });
  };

  Instance.prototype.renderNode = function (node, scope, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.localName;

    if (tag === 'template' && node.hasAttribute('data-sc-for')) {
      var list = lookup((node.getAttribute('list') || '').replace(/[{}]/g, ''), scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var s = Object.create(scope);
        s[as] = list[i];
        s.$index = i;
        this.renderChildren(node.content, s, out);
      }
      return;
    }
    if (tag === 'template' && node.hasAttribute('data-sc-if')) {
      var cond = lookup((node.getAttribute('value') || '').replace(/[{}]/g, ''), scope);
      if (cond) this.renderChildren(node.content, scope, out);
      return;
    }
    if (tag === 'helmet') {
      installHelmet(node);
      return;
    }
    if (tag === 'dc-import') {
      this.renderImport(node, scope, out);
      return;
    }

    var el = node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
      ? document.createElementNS(node.namespaceURI, node.tagName)
      : document.createElement(tag);
    applyAttrs(el, node, scope);
    this.renderChildren(node, scope, el);
    // controlled form values are set after children (options) exist
    if (el.__dcValue !== undefined) el.value = el.__dcValue;
    out.appendChild(el);
  };

  Instance.prototype.renderChildren = function (parent, scope, out) {
    var kids = parent.childNodes;
    for (var i = 0; i < kids.length; i++) this.renderNode(kids[i], scope, out);
  };

  Instance.prototype.renderImport = function (node, scope, out) {
    var name = node.getAttribute('name');
    var key = name + '#' + this.importCount++;
    this.seen[key] = true;
    var props = {};
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      if (a.name === 'name' || a.name.indexOf('hint-') === 0) continue;
      var camel = a.name.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      var whole = a.value.match(WHOLE);
      props[camel] = whole ? lookup(whole[1], scope) : interp(a.value, scope);
    }
    var holder = document.createElement('div');
    holder.style.display = 'contents';
    holder.setAttribute('data-dc-import', name);
    holder.__dcKey = key;
    out.appendChild(holder);
    var rec = this.children[key] || (this.children[key] = { name: name });
    rec.props = props;
  };

  // ---- DOM patching ------------------------------------------------------

  function sameNode(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType !== 1) return true;
    return a.namespaceURI === b.namespaceURI && a.tagName === b.tagName &&
      a.getAttribute('data-dc-import') === b.getAttribute('data-dc-import');
  }

  function morphChildren(oldP, newP) {
    var o = Array.prototype.slice.call(oldP.childNodes);
    var n = Array.prototype.slice.call(newP.childNodes);
    var len = Math.max(o.length, n.length);
    for (var i = 0; i < len; i++) {
      var on = o[i], nn = n[i];
      if (!nn) { oldP.removeChild(on); continue; }
      if (!on) { oldP.appendChild(nn); continue; }
      if (sameNode(on, nn)) patchNode(on, nn);
      else oldP.replaceChild(nn, on);
    }
  }

  function patchNode(on, nn) {
    if (on.nodeType !== 1) {
      if (on.nodeValue !== nn.nodeValue) on.nodeValue = nn.nodeValue;
      return;
    }
    var i, a;
    for (i = 0; i < nn.attributes.length; i++) {
      a = nn.attributes[i];
      if (on.getAttribute(a.name) !== a.value) on.setAttribute(a.name, a.value);
    }
    for (i = on.attributes.length - 1; i >= 0; i--) {
      a = on.attributes[i];
      if (!nn.hasAttribute(a.name)) on.removeAttribute(a.name);
    }
    on.__dcH = nn.__dcH;
    if (nn.__dcH) Object.keys(nn.__dcH).forEach(function (t) { listen(on, t); });
    if (on.__dcValue !== nn.__dcValue || (nn.__dcValue !== undefined && on.value !== nn.__dcValue)) {
      on.__dcValue = nn.__dcValue;
    }
    if (on.hasAttribute('data-dc-import')) {
      on.__dcKey = nn.__dcKey;
      return;
    }
    morphChildren(on, nn);
    if (nn.__dcValue !== undefined && on.value !== nn.__dcValue) on.value = nn.__dcValue;
    var tag = on.localName;
    if (tag === 'input' || tag === 'option' || tag === 'button' || tag === 'select' || tag === 'textarea' || tag === 'details') {
      ['checked', 'selected', 'disabled', 'open'].forEach(function (p) {
        if (p in nn && on[p] !== nn[p]) on[p] = nn[p];
      });
    }
  }

  function dispatch(e) {
    var h = this.__dcH && this.__dcH[e.type];
    if (h) return h.call(this, e);
  }

  function listen(el, type) {
    el.__dcL = el.__dcL || {};
    if (el.__dcL[type]) return;
    el.__dcL[type] = true;
    el.addEventListener(type, dispatch);
  }

  // ---- attributes ----------------------------------------------------------

  var EVENT_MAP = { doubleclick: 'dblclick' };
  var PROPS = { checked: 1, selected: 1, disabled: 1, readonly: 1, readOnly: 1, multiple: 1, hidden: 1, open: 1 };

  function applyAttrs(el, node, scope) {
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      var name = a.name;
      if (name.indexOf('hint-') === 0) continue;
      var whole = a.value.match(WHOLE);
      var value = whole ? lookup(whole[1], scope) : (a.value.indexOf('{{') >= 0 ? interp(a.value, scope) : a.value);

      if (/^on[a-z]/i.test(name) && whole) {
        if (typeof value !== 'function') continue;
        var evt = name.slice(2).toLowerCase();
        evt = EVENT_MAP[evt] || evt;
        if (evt === 'change') {
          var t = (node.getAttribute('type') || '').toLowerCase();
          var isText = (node.localName === 'input' && ['checkbox', 'radio', 'file'].indexOf(t) < 0) || node.localName === 'textarea';
          evt = isText ? 'input' : 'change';
        }
        el.__dcH = el.__dcH || {};
        el.__dcH[evt] = value;
        listen(el, evt);
        continue;
      }
      if (name === 'value' && (node.localName === 'input' || node.localName === 'textarea' || node.localName === 'select')) {
        el.__dcValue = value == null ? '' : String(value);
        if (node.localName === 'input') el.setAttribute('value', el.__dcValue);
        continue;
      }
      if (name === 'defaultvalue' || name === 'default-value') {
        el.setAttribute('value', value == null ? '' : String(value));
        continue;
      }
      if (PROPS[name] && whole) {
        if (value) el.setAttribute(name, '');
        try { el[name] = !!value; } catch (e) { /* read-only prop */ }
        continue;
      }
      if (value === false || value == null) {
        if (name.indexOf('aria-') === 0) el.setAttribute(name, 'false');
        continue;
      }
      if (value === true) {
        el.setAttribute(name, name.indexOf('aria-') === 0 ? 'true' : '');
        continue;
      }
      el.setAttribute(name, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  }

  // ---- helmet --------------------------------------------------------------

  var installed = {};
  function installHelmet(node) {
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.nodeType !== 1) continue;
      var sig = k.outerHTML;
      if (installed[sig]) continue;
      installed[sig] = true;
      var el = document.createElement(k.localName);
      for (var j = 0; j < k.attributes.length; j++) el.setAttribute(k.attributes[j].name, k.attributes[j].value);
      el.textContent = k.textContent;
      document.head.appendChild(el);
    }
  }

  // ---- boot ----------------------------------------------------------------

  function boot() {
    if (!document.querySelector('meta[name=viewport]')) {
      var vp = document.createElement('meta');
      vp.name = 'viewport';
      vp.content = 'width=device-width, initial-scale=1';
      document.head.appendChild(vp);
    }
    var page = location.pathname.split('/').pop() || 'Main.dc.html';
    var host = document.createElement('div');
    host.id = 'dc-root';
    document.body.appendChild(host);
    loadFile(page).then(function (parsed) {
      var inst = new Instance(parsed, {}, host, page);
      inst.render();
      window.__dcRoot = inst;
    }).catch(function (e) {
      console.error('[dc] boot failed', e);
      if (!/NotFound\.dc\.html$/.test(page) && /\(404\)/.test(String(e && e.message))) { location.replace('NotFound.dc.html#' + encodeURIComponent(page)); return; }
      host.textContent = 'Could not load this screen. Serve the prototype folder over HTTP (see README).';
    });
  }

  // The shared data store and the sample month load before any screen renders.
  var DATA_FILES = ['store.js', 'data-home.js', 'data-in.js', 'data-sell.js', 'data-out.js', 'data-spend.js', 'data-books.js', 'data-biz.js'];

  function loadScript(src) {
    return new Promise(function (resolve) {
      var el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = function () { console.error('[dc] could not load ' + src); resolve(); };
      document.head.appendChild(el);
    });
  }

  function rerender() {
    if (window.__dcRoot) window.__dcRoot.render();
  }

  function start() {
    var chain = Promise.resolve();
    DATA_FILES.forEach(function (f) { chain = chain.then(function () { return loadScript(f); }); });
    chain.then(function () {
      // ?reset=1 puts the sample month back; ?start=empty starts a brand new business.
      if (window.BE && /[?&]reset=1\b/.test(location.search)) {
        window.BE.reset();
        try { sessionStorage.setItem('be.flash', 'Sample data reset. You’re back at Oct 4 with Northwind Studio’s October.'); } catch (e) { /* ignore */ }
        history.replaceState(null, '', location.pathname + location.hash);
      } else if (window.BE && /[?&]start=empty\b/.test(location.search)) {
        window.BE.startEmpty();
        history.replaceState(null, '', location.pathname + location.hash);
      }
      window.addEventListener('be:change', rerender);
      window.addEventListener('hashchange', rerender);
      boot();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
