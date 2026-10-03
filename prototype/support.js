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
    var focus = rememberFocus(this.host);
    this.seen = {};
    this.importCount = 0;
    var frag = document.createDocumentFragment();
    var kids = this.parsed.root ? this.parsed.root.childNodes : [];
    for (var i = 0; i < kids.length; i++) this.renderNode(kids[i], vals, frag);
    this.host.replaceChildren(frag);
    // drop child instances that were not rendered this time
    var self = this;
    Object.keys(this.children).forEach(function (k) {
      if (!self.seen[k]) delete self.children[k];
    });
    restoreFocus(this.host, focus);
    if (!this.mounted) {
      this.mounted = true;
      if (typeof this.logic.componentDidMount === 'function') this.logic.componentDidMount();
    } else if (typeof this.logic.componentDidUpdate === 'function') {
      this.logic.componentDidUpdate();
    }
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
    out.appendChild(holder);
    var self = this;
    var existing = this.children[key];
    if (existing && existing.ready) {
      existing.host = holder;
      existing.setProps(props);
      return;
    }
    var rec = { ready: false };
    this.children[key] = rec;
    loadFile(name + '.dc.html').then(function (parsed) {
      var inst = new Instance(parsed, props, holder, name);
      rec.ready = true;
      rec.host = holder;
      rec.setProps = function (p) { inst.host = rec.host; inst.setProps(p); };
      inst.render();
    }).catch(function (e) {
      console.error('[dc] import failed: ' + name, e);
    });
    void self;
  };

  // ---- attributes ----------------------------------------------------------

  var EVENT_MAP = { doubleclick: 'dblclick' };
  var PROPS = { value: 1, checked: 1, selected: 1, disabled: 1, readonly: 1, readOnly: 1, multiple: 1, hidden: 1, open: 1 };

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
        el.addEventListener(evt, value);
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

  // ---- focus preservation across re-renders --------------------------------

  function pathOf(el, root) {
    var path = [];
    while (el && el !== root) {
      var p = el.parentNode;
      if (!p) return null;
      path.unshift(Array.prototype.indexOf.call(p.childNodes, el));
      el = p;
    }
    return el === root ? path : null;
  }

  function rememberFocus(root) {
    var a = document.activeElement;
    if (!a || a === document.body || !root.contains(a)) return null;
    var info = { path: pathOf(a, root) };
    try { info.start = a.selectionStart; info.end = a.selectionEnd; } catch (e) { /* not text */ }
    return info;
  }

  function restoreFocus(root, info) {
    if (!info || !info.path) return;
    var el = root;
    for (var i = 0; i < info.path.length && el; i++) el = el.childNodes[info.path[i]];
    if (el && el.focus) {
      el.focus({ preventScroll: true });
      try { if (info.start != null) el.setSelectionRange(info.start, info.end); } catch (e) { /* ignore */ }
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
      host.textContent = 'Could not load this screen. Serve the prototype folder over HTTP (see README).';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
