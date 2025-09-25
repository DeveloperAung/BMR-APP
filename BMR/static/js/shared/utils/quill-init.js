export function initQuillEditor({ editorSelector, toolbarSelector, placeholder = 'Enter text...' }) {
  const quill = new Quill(editorSelector, {
    modules: { toolbar: toolbarSelector },
    theme: 'snow',
    placeholder
  });
  return quill;
}