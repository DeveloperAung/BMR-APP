(function () {

  // standard editor
  window.editor7 = new Quill("#editor7", {
    modules: { toolbar: "#toolbar7" },
    theme: "snow",
    placeholder: "Enter your messages...",
  });
})();
