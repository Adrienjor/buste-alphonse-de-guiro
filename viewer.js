(() => {
  const viewer = document.getElementById('viewer');
  const status = document.getElementById('status');
  const total = 65585940;
  let received = 0;
  let objectURL;
  const reportError = () => {
    status.textContent = 'Le modèle n’a pas pu être chargé. Vérifiez votre connexion puis actualisez la page.';
  };
  viewer.addEventListener('load', () => {
    status.textContent = 'Modèle chargé — explorez le buste en 3D.';
    if (objectURL) { URL.revokeObjectURL(objectURL); objectURL = null; }
  });
  viewer.addEventListener('error', reportError);
  async function download(name) {
    const response = await fetch(name);
    if (!response.ok) throw new Error(`Chargement impossible : ${name} (${response.status})`);
    const reader = response.body.getReader();
    const chunks = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      status.textContent = `Chargement du modèle : ${Math.min(100, Math.round(received / total * 100))} %`;
    }
    return new Blob(chunks);
  }
  async function main() {
    const parts = await Promise.all(['model-1.bin','model-2.bin','model-3.bin','model-4.bin'].map(download));
    if (received !== total) throw new Error('Modèle incomplet');
    status.textContent = 'Préparation de la visualisation 3D…';
    const ready = customElements.whenDefined('model-viewer');
    let timeout;
    try {
      await Promise.race([ready, new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Lecteur 3D indisponible')), 30000);
      })]);
    } finally { clearTimeout(timeout); }
    objectURL = URL.createObjectURL(new Blob(parts, {type: 'model/gltf-binary'}));
    viewer.src = objectURL;
  }
  main().catch(error => { console.error(error); reportError(); });
})();
