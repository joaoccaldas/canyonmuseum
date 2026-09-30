import * as THREE from 'three';

export const clamp01 = v => Math.min(1, Math.max(0, v));
export const smoothstep01 = t => t * t * (3 - 2 * t);

export function physical(color, roughness=.28, metalness=.1, emissive=null) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: .82,
    clearcoatRoughness: .07,
    envMapIntensity: 1.8,
    emissive: emissive || '#000000',
    emissiveIntensity: emissive ? .55 : 0,
  });
}

export function matte(color, roughness=.75, metalness=.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: .7 });
}

export function glow(color, opacity=.9) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    toneMapped: false,
  });
}

export function box(w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeTube(a, b, r, material) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const delta = vb.clone().sub(va), len = delta.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), material);
  mesh.position.copy(va).add(vb).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), delta.normalize());
  return mesh;
}

export function wireBike(material) {
  const group = new THREE.Group();
  const wheelGeo = new THREE.TorusGeometry(.34, .018, 5, 22);
  for (const x of [-.55, .55]) {
    const wheel = new THREE.Mesh(wheelGeo, material);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(x, .38, 0);
    group.add(wheel);
  }
  const pts = {
    bb: [-.05,.37,0], seat: [-.12,.84,0], head: [.38,.78,0],
    rear: [-.55,.38,0], front: [.55,.38,0], cockpit: [.53,.94,0],
  };
  for (const [a,b] of [['rear','bb'],['bb','seat'],['seat','head'],['head','bb'],['head','front'],['seat','rear'],['head','cockpit']]) {
    group.add(makeTube(pts[a], pts[b], .018, material));
  }
  return group;
}

export function assetMeshes(asset, prefixes) {
  const matches = [];
  asset.traverse(src => {
    if (src.isMesh && prefixes.some(prefix => src.name.startsWith(prefix))) matches.push(src);
  });
  return matches;
}

export const ART_AXIS_FIX = new THREE.Matrix4().makeRotationX(Math.PI/2);
export const ART_FACE_HALL = new THREE.Matrix4()
  .makeRotationY(Math.PI/2)
  .multiply(ART_AXIS_FIX);

export function bakedAssetMesh(src, authoredOrientation=ART_AXIS_FIX) {
  const copy = new THREE.Mesh(src.geometry.clone(), src.material);
  copy.name = src.name;
  copy.geometry.applyMatrix4(src.matrixWorld);
  if (authoredOrientation) copy.geometry.applyMatrix4(authoredOrientation);
  copy.position.set(0,0,0);
  copy.rotation.set(0,0,0);
  copy.scale.set(1,1,1);
  copy.updateMatrix();
  return copy;
}

export function normalizeAssetGroup(group) {
  const pos = group.position.clone(), quat = group.quaternion.clone(), scale = group.scale.clone();
  group.position.set(0,0,0);
  group.quaternion.identity();
  group.scale.set(1,1,1);
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  if (!bounds.isEmpty()) {
    const center = bounds.getCenter(new THREE.Vector3());
    const dy = bounds.min.y;
    group.traverse(object => {
      if (object.isMesh) object.geometry.translate(-center.x, -dy, -center.z);
    });
  }
  group.position.copy(pos);
  group.quaternion.copy(quat);
  group.scale.copy(scale);
  group.updateMatrixWorld(true);
  return group;
}

export function cloneBikeForCollection(root) {
  const saved = [];
  root.traverse(object => {
    saved.push([object, object.userData]);
    object.userData = object.userData?.part ? { part: object.userData.part } : {};
  });
  try {
    return root.clone(true);
  } finally {
    for (const [object, userData] of saved) object.userData = userData;
  }
}

export function repaintBike(root, theme, simplified=false) {
  root.traverse(object => {
    if (!object.isMesh) return;
    if (simplified) {
      const part = object.userData?.part || '';
      if (!/frame|fork|wheel_front|wheel_rear|base_bar|basebar|extensions|seatpost|saddle/.test(part)) {
        object.visible = false;
        return;
      }
    }
    const source = [].concat(object.material || []);
    const materials = source.map(material => {
      const copy = material.clone();
      copy.envMapIntensity = 2.3;
      if (copy.name === 'paint_frame' || /paint/i.test(copy.name || '')) {
        copy.color?.set(theme.paint);
        copy.roughness = .085;
        copy.metalness = Math.max(copy.metalness || 0, .18);
        if ('clearcoat' in copy) {
          copy.clearcoat = 1;
          copy.clearcoatRoughness = .045;
        }
      } else if (/decal|logo|graphic/i.test(copy.name || '')) {
        copy.color?.set(theme.accent);
        if (copy.emissive) {
          copy.emissive.set(theme.accent);
          copy.emissiveIntensity = .12;
        }
      }
      return copy;
    });
    object.material = Array.isArray(object.material) ? materials : materials[0];
    object.castShadow = false;
    object.receiveShadow = false;
  });
}
