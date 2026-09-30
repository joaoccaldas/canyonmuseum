import * as THREE from 'three';

export function buildAnimatedChain({ chainNode, toThreeVector, meshesOf }) {
  if (!chainNode?.userData?.chain_path) return null;
  const pts = JSON.parse(chainNode.userData.chain_path).map(toThreeVector);
  const pitch = chainNode.userData.chain_pitch;
  const count = chainNode.userData.chain_links;
  const lengths = [0];
  for (let i = 1; i <= pts.length; i++) lengths.push(lengths[i - 1] + pts[i % pts.length].distanceTo(pts[i - 1]));
  const total = lengths[lengths.length - 1];
  const templates = {};
  chainNode.traverse(object => {
    if (object.isMesh && /chainlink_(outer|inner)/.test(object.name)) {
      templates[object.name.includes('outer') ? 'outer' : 'inner'] = object;
      object.visible = false;
    }
  });
  if (!templates.outer || !templates.inner) return null;

  const instances = ['outer', 'inner'].map(kind => {
    templates[kind].updateMatrix();
    const geometry = templates[kind].geometry.clone().applyMatrix4(templates[kind].matrix);
    const mesh = new THREE.InstancedMesh(geometry, templates[kind].material, Math.ceil(count / 2));
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    mesh.userData.chainKind = kind;
    chainNode.add(mesh);
    (meshesOf.chain ||= []).push(mesh);
    mesh.userData.baseMat = mesh.material;
    return mesh;
  });

  const p = new THREE.Vector3(), qv = new THREE.Vector3();
  const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1), one = new THREE.Vector3(1, 1, 1);
  const pointAt = (distance, out) => {
    distance = ((distance % total) + total) % total;
    let lo = 0, hi = lengths.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lengths[mid] <= distance) lo = mid;
      else hi = mid;
    }
    const segment = lengths[lo + 1] - lengths[lo];
    const t = segment > 0 ? (distance - lengths[lo]) / segment : 0;
    return out.copy(pts[lo]).lerp(pts[(lo + 1) % pts.length], t);
  };

  const chain = {
    s: 0, total, pitch,
    update() {
      for (let i = 0; i < count; i++) {
        const s0 = this.s + i * pitch;
        pointAt(s0, p); pointAt(s0 + pitch, qv);
        quaternion.setFromAxisAngle(zAxis, Math.atan2(qv.y - p.y, qv.x - p.x));
        p.add(qv).multiplyScalar(.5);
        matrix.compose(p, quaternion, one);
        instances[i % 2].setMatrixAt(i >> 1, matrix);
      }
      instances.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
    },
  };
  chain.update();
  return chain;
}

export function buildRearDisc({ wheel, material, meshesOf }) {
  if (!wheel) return null;
  const profile = [];
  for (let i = 0; i <= 24; i++) {
    const r = .018 + (.239 - .018) * i / 24;
    profile.push(new THREE.Vector2(r, .0115 * Math.cos(i / 24 * Math.PI / 2) + .0035));
  }
  const half = new THREE.LatheGeometry(profile, 128);
  half.rotateX(Math.PI / 2);
  const group = new THREE.Group();
  const a = new THREE.Mesh(half, material), b = new THREE.Mesh(half, material);
  b.rotation.y = Math.PI;
  a.castShadow = b.castShadow = true;
  a.userData.baseMat = b.userData.baseMat = material;
  group.add(a, b);
  group.visible = false;
  group.name = 'disc_option';
  wheel.add(group);
  (meshesOf.wheel_rear ||= []).push(a, b);
  return group;
}

export function createDimensionOverlay({ scene, profile, query }) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const labels = [];

  function build() {
    if (profile.dimsOverlay === false) {
      const button = query('#dimsBtn');
      if (button) button.style.display = 'none';
      return;
    }
    const bb = new THREE.Vector3(0, .2645, .16), head = new THREE.Vector3(.44, .7455, .16);
    const rear = new THREE.Vector3(-.41325, .3395, .16), front = new THREE.Vector3(.59975, .3395, .16);
    const solid = new THREE.LineBasicMaterial({ color:0x19b3ff, transparent:true, opacity:.95, depthTest:false });
    const dashed = new THREE.LineDashedMaterial({ color:0x19b3ff, dashSize:.012, gapSize:.01, transparent:true, opacity:.7, depthTest:false });
    const line = (a, b, material=solid) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([a,b]);
      const item = new THREE.Line(geometry, material);
      item.computeLineDistances();
      item.renderOrder = 10;
      group.add(item);
    };
    const label = (point, html) => {
      const element = document.createElement('div');
      element.className = 'dim';
      element.innerHTML = html;
      query('#dimlayer')?.appendChild(element);
      labels.push({ p:point, el:element });
    };
    const stackTop = new THREE.Vector3(bb.x, head.y, bb.z);
    line(bb, stackTop); line(stackTop, head); line(bb, head, dashed);
    label(bb.clone().lerp(stackTop,.5), '<b>481</b> stack');
    label(stackTop.clone().lerp(head,.5).add(new THREE.Vector3(0,.03,0)), '<b>440</b> reach');
    const g0 = new THREE.Vector3(rear.x,.02,.16), g1 = new THREE.Vector3(front.x,.02,.16);
    line(g0,g1); line(rear,g0,dashed); line(front,g1,dashed);
    label(g0.clone().lerp(g1,.5).add(new THREE.Vector3(0,.03,0)), '<b>1013</b> wheelbase');
    line(bb,rear); label(bb.clone().lerp(rear,.5).add(new THREE.Vector3(0,-.04,0)), '<b>420</b> chainstay');
    const steer = new THREE.Vector3(-Math.cos(73*Math.PI/180),Math.sin(73*Math.PI/180),0);
    line(head.clone().addScaledVector(steer,.12),head.clone().addScaledVector(steer,-.48),dashed);
    label(head.clone().addScaledVector(steer,-.44).add(new THREE.Vector3(.07,0,0)), '<b>73°</b> head');
    const seat = new THREE.Vector3(-Math.cos(81*Math.PI/180),Math.sin(81*Math.PI/180),0);
    line(bb,bb.clone().addScaledVector(seat,.78),dashed);
    label(bb.clone().addScaledVector(seat,.62).add(new THREE.Vector3(-.07,0,0)), '<b>81°</b> seat');
    label(new THREE.Vector3(bb.x,.2045,.16), '<b>75</b> BB drop');
  }

  return { group, labels, build };
}

export function createWindTunnel({ scene, coarse }) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  let material = null;

  function build() {
    for (const child of [...group.children]) {
      child.geometry?.dispose();
      child.material?.dispose();
      group.remove(child);
    }
    const obstacles = [[.47,.72,0,.09],[.25,.5,0,.07],[.02,.3,0,.08],[-.1,.62,0,.07],[-.16,.99,0,.1],[.62,.98,0,.15],[.4,.95,0,.1],[-.33,1.05,0,.1],[.6,.34,0,.05],[-.41,.34,0,.06],[.14,.74,0,.06]];
    const lines = coarse ? 32 : 64, segments = 90;
    const positions = [], along = [], seeds = [];
    for (let k = 0; k < lines; k++) {
      const rand = n => ((Math.sin(n*127.1+41.7)*43758.5453)%1+1)%1;
      const y0=.08+rand(k+1)*1.75, z0=(rand(k+211)-.5)*.85, seed=rand(k+731);
      for (let i=0;i<segments;i++) {
        const x=2.4-4.8*i/(segments-1);
        let y=y0,z=z0;
        for(const [cx,cy,cz,r] of obstacles){
          const dy=y0-cy,dz=z0-cz,q=Math.hypot(dy,dz*2.2)+1e-4;
          if(q<r*2.2){
            const gain=Math.exp(-Math.pow((x-cx)/(r*2.4),2));
            const push=(r*2.2-q)*.55*gain;
            y+=dy/q*push; z+=dz/q*push*1.4+Math.sign(dz||.01)*push*.5;
          }
        }
        positions.push(x,y,z); along.push(i/(segments-1)); seeds.push(seed);
      }
    }
    const indices=[];
    for(let k=0;k<lines;k++) for(let i=0;i<segments-1;i++) indices.push(k*segments+i,k*segments+i+1);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('along',new THREE.Float32BufferAttribute(along,1));
    geometry.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
    geometry.setIndex(indices);
    material=new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{t:{value:0},col:{value:new THREE.Color(0xbfe9ff)}},
      vertexShader:'attribute float along; attribute float seed; varying float va; varying float vs; void main(){ va=along; vs=seed; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:'uniform float t; uniform vec3 col; varying float va; varying float vs; void main(){ float p=fract(va*3.0 - t*0.55 + vs*7.0); float a=smoothstep(0.,.25,p)*smoothstep(1.,.55,p); float edge=smoothstep(0.,.08,va)*smoothstep(1.,.9,va); gl_FragColor=vec4(col, a*edge*.075); }',
    });
    group.add(new THREE.LineSegments(geometry,material));
  }

  return { group, build, material: () => material };
}
