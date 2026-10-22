// Retratos dos personagens para os diálogos: renderiza a cabeça de cada modelo uma vez e guarda a imagem.
import * as THREE from 'three';
import * as M from './models.js';

// nome que aparece no diálogo -> modelo e cor de destaque
export const SPEAKERS = {
  'Izuku': ['deku', ['hero'], '#36e38c'], 'Deku': ['deku', ['hero'], '#36e38c'], 'Izuku (pela TV)': ['deku', ['hero'], '#36e38c'],
  'All Might': ['allMight', [], '#4c7cf0'], 'All Might (magro)': ['allMight', ['skinny'], '#4c7cf0'],
  'Bakugo': ['bakugo', ['hero'], '#ff8a2a'], 'Kacchan': ['bakugo', ['hero'], '#ff8a2a'],
  'Uraraka': ['uraraka', [], '#ff7ab0'], 'Iida': ['iida', [], '#8aa4d8'], 'Todoroki': ['todoroki', [], '#ff5a6a'],
  'Kirishima': ['kirishima', [], '#ff4040'], 'Tsuyu': ['tsuyu', [], '#5ac87a'], 'Mineta': ['mineta', [], '#a87ae8'],
  'Aizawa': ['aizawa', [], '#c8c8d8'], 'Kurogiri': ['kurogiri', [], '#9a6ae8'], 'Shigaraki': ['shigaraki', [], '#9aa8b8'],
  'Stain': ['stain', [], '#d83a3a'], 'Kota': ['kota', [], '#ff4a3a'], 'Muscular': ['muscular', [], '#d86a3a'],
  'All For One': ['allForOne', [], '#8a8aa8'], 'Overhaul': ['overhaul', [], '#6ab08a'], 'Eri': ['eri', [], '#ff8aa8'],
  'Gang Orca': ['gangOrca', [], '#5ab0e8'], 'Lady Nagant': ['ladyNagant', [], '#d85ab0'], 'Inasa': ['inasa', [], '#d8b06a'],
  'Present Mic': ['civilian', [3], '#ffd23a'], 'Mandalay (telepatia)': ['civilian', [2], '#6ac87a'], 'Midnight': ['civilian', [2], '#d84a8a'],
  'Tenko': ['shigaraki', [], '#9aa8b8'], 'Nana Shimura': ['vestige', [0x9ad8ff], '#9ad8ff'], 'Yoichi': ['vestige', [0xd8e8ff], '#d8e8ff'],
};

let R = null, scene, cam;
const cache = new Map();
function init() {
  const c = document.createElement('canvas'); c.width = c.height = 192;
  R = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, preserveDrawingBuffer: true });
  R.setSize(192, 192, false);
  R.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 1.4));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(1.5, 2, 3); scene.add(d);
  const b = new THREE.DirectionalLight(0x9ad0ff, 1.2); b.position.set(-2, 1, -2); scene.add(b);
  cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
}

export function portrait(name) {
  const sp = SPEAKERS[name];
  if (!sp) return null;
  if (cache.has(name)) return cache.get(name);
  try {
    if (!R) init();
    const [fn, args] = sp;
    const rig = fn === 'vestige' ? M.vestige(...args) : M[fn](...args);
    scene.add(rig.root);
    rig.root.updateMatrixWorld(true);
    const head = rig.head.getWorldPosition(new THREE.Vector3());
    const s = rig.s * (rig.head.scale.x || 1);
    cam.position.set(head.x + 0.18 * s, head.y + 0.05 * s, head.z + 1.25 * s);
    cam.lookAt(head.x, head.y - 0.02 * s, head.z);
    R.render(scene, cam);
    const url = R.domElement.toDataURL('image/png');
    scene.remove(rig.root);
    cache.set(name, url);
    return url;
  } catch (e) {
    cache.set(name, null);
    return null;
  }
}
export const accentOf = (name) => SPEAKERS[name]?.[2];
