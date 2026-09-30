import * as THREE from 'three';

export function createViewerInteraction({
  canvas, camera, controls, bike, meshesOf, partsMeta, groupLabels,
  state, materials, coarse, reduced, views, query, queryAll,
}) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let tweenState = null;
  let downAt = null;
  let hoverRaf = 0;

  function partOf(object) {
    while (object && !(object.userData && object.userData.part)) object = object.parent;
    if (!object) return null;
    let id = object.userData.part;
    if (partsMeta[id]?.alias) id = partsMeta[id].alias;
    return id;
  }

  function isShown(object) {
    while (object) {
      if (!object.visible) return false;
      object = object.parent;
    }
    return true;
  }

  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1,
    );
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(bike, true).find(item => item.object.visible && isShown(item.object));
    return hit ? partOf(hit.object) : null;
  }

  function highlight(id, on, strength=.22) {
    for (const mesh of meshesOf[id] || []) {
      if (!on) {
        mesh.material = mesh.userData.baseMat;
        continue;
      }
      const base = mesh.userData.baseMat;
      const clone = material => {
        const copy = material.clone();
        copy.onBeforeCompile = material.onBeforeCompile;
        copy.customProgramCacheKey = material.customProgramCacheKey;
        if (copy.emissive) {
          copy.emissive = new THREE.Color(0x2aa8ff);
          copy.emissiveIntensity = strength;
        }
        return copy;
      };
      mesh.material = Array.isArray(base) ? base.map(clone) : clone(base);
    }
  }

  function applyGhost() {
    const isolate = state.isolate && state.sel;
    const keep = new Set(state.sel ? [state.sel, ...Object.keys(partsMeta).filter(key => partsMeta[key].alias === state.sel)] : []);
    for (const [id, meshes] of Object.entries(meshesOf)) {
      const shown = keep.has(id);
      for (const mesh of meshes) {
        if (state.xray && !(id === 'frame' || id === 'fork' || id === 'frame_decals' || id === 'fork_decals')) {
          mesh.material = mesh.userData.baseMat;
          continue;
        }
        if (state.xray) {
          mesh.material = materials.xray;
          continue;
        }
        if (isolate && !shown) mesh.material = materials.ghost;
        else if (!(state.sel && shown)) mesh.material = mesh.userData.baseMat;
      }
    }
    if (state.sel && !state.xray) highlight(state.sel, true, .12);
    if (state.hover && state.hover !== state.sel && !isolate && !state.xray) highlight(state.hover, true, .18);
  }

  function syncList() {
    queryAll('[data-part]').forEach(button => button.classList.toggle('active', button.dataset.part === state.sel));
  }

  function select(id) {
    if (state.sel && state.sel !== id) highlight(state.sel, false);
    state.sel = id;
    if (!id) {
      state.isolate = false;
      query('#card')?.classList.remove('open');
      applyGhost();
      syncList();
      return;
    }
    const part = partsMeta[id] || { name:id, spec:'' };
    const group = query('#cardGroup'), name = query('#cardName'), spec = query('#cardSpec');
    const note = query('#cardNote'), weight = query('#cardWeight');
    if (group) group.textContent = groupLabels[part.group] || '';
    if (name) name.textContent = part.name;
    if (spec) spec.textContent = part.spec || '';
    if (note) note.textContent = part.note || '';
    if (weight) weight.textContent = part.weight ? part.weight + ' g' : '—';
    query('#card')?.classList.add('open');
    applyGhost();
    syncList();
  }

  function focusPart(id) {
    const bounds = new THREE.Box3();
    for (const mesh of meshesOf[id] || []) if (isShown(mesh)) bounds.expandByObject(mesh);
    if (bounds.isEmpty()) return;
    const center = bounds.getCenter(new THREE.Vector3());
    const radius = Math.max(.08, bounds.getSize(new THREE.Vector3()).length() * .5);
    const direction = camera.position.clone().sub(controls.target).normalize();
    tween(
      camera.position.clone(),
      controls.target.clone(),
      center.clone().addScaledVector(direction, radius * 3.2 / Math.tan(camera.fov * Math.PI / 360) * .55),
      center,
      1.1,
    );
  }

  function tween(p0, t0, p1, t1, duration=1.4) {
    if (reduced) {
      camera.position.copy(p1);
      controls.target.copy(t1);
      tweenState = null;
      return;
    }
    tweenState = { p0, t0, p1, t1, t:0, dur:duration };
  }

  function flyTo(name, duration=1.4) {
    const view = views[name];
    if (!view) return;
    const p1 = new THREE.Vector3(...view.p), t1 = new THREE.Vector3(...view.t);
    if (coarse && name === 'hero') p1.multiplyScalar(1.25);
    const phoneFit = document.documentElement.classList.contains('phone-fit');
    if (innerWidth < innerHeight || phoneFit) {
      p1.sub(t1).multiplyScalar(phoneFit && name === 'exploded' ? 1.75 : 1.55).add(t1);
    }
    if (!duration) {
      camera.position.copy(p1);
      controls.target.copy(t1);
    } else {
      tween(camera.position.clone(), controls.target.clone(), p1, t1, duration);
    }
    queryAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  }

  function updateTween(dt, ease) {
    if (!tweenState) return;
    tweenState.t = Math.min(tweenState.dur, tweenState.t + dt);
    const u = ease(tweenState.t / tweenState.dur);
    camera.position.lerpVectors(tweenState.p0, tweenState.p1, u);
    controls.target.lerpVectors(tweenState.t0, tweenState.t1, u);
    if (tweenState.t >= tweenState.dur) tweenState = null;
  }

  canvas.addEventListener('pointerdown', event => {
    downAt = [event.clientX, event.clientY, performance.now()];
    document.body.classList.add('engaged');
  });
  canvas.addEventListener('pointerup', event => {
    if (!downAt) return;
    const moved = Math.hypot(event.clientX - downAt[0], event.clientY - downAt[1]);
    if (moved < 6 && performance.now() - downAt[2] < 500) select(pick(event));
    downAt = null;
  });
  canvas.addEventListener('pointermove', event => {
    if (coarse || event.buttons || hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      const id = pick(event);
      if (id !== state.hover) {
        const previous = state.hover;
        state.hover = id;
        if (previous && previous !== state.sel) highlight(previous, false);
        applyGhost();
      }
      const tip = query('#tip');
      if (!tip) return;
      if (id && partsMeta[id]) {
        tip.textContent = partsMeta[id].name;
        tip.style.transform = `translate(${event.clientX + 14}px,${event.clientY + 14}px)`;
        tip.classList.add('on');
        canvas.style.cursor = 'pointer';
      } else {
        tip.classList.remove('on');
        canvas.style.cursor = '';
      }
    });
  });
  canvas.addEventListener('pointerleave', () => {
    query('#tip')?.classList.remove('on');
    if (state.hover && state.hover !== state.sel) highlight(state.hover, false);
    state.hover = null;
  });

  return { select, focusPart, flyTo, applyGhost, updateTween, isShown };
}
