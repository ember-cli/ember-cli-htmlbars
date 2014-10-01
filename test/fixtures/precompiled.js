(function() {
  function build(dom) {
    var el0 = dom.createDocumentFragment();
    var el1 = dom.createElement("div");
    var el2 = dom.createTextNode("\n  ");
    dom.appendChild(el1, el2);
    var el2 = dom.createTextNode("\n");
    dom.appendChild(el1, el2);
    dom.appendChild(el0, el1);
    var el1 = dom.createTextNode("\n");
    dom.appendChild(el0, el1);
    return el0;
  }
  var cachedFragment;
  return function template(context, env, contextualElement) {
    var dom = env.dom, hooks = env.hooks;
    dom.detectNamespace(contextualElement);
    if (cachedFragment === undefined) {
      cachedFragment = build(dom);
    }
    var fragment = dom.cloneNode(cachedFragment, true);
    var morph0 = dom.createMorphAt(fragment.childNodes[0],0,1);
    hooks.content(morph0, "name", context, [], {context:context,escaped:true,morph:morph0}, env);
    return fragment;
  };
}());