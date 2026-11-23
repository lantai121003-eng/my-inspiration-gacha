const characterMotion = (() => {
  const girl = document.getElementById('girl');
  const canvas = girl.querySelector('.character-sprite');
  const context = canvas.getContext('2d');
  const rig = girl.querySelector('.character-rig');
  const head = girl.querySelector('.head-part');
  const arm = girl.querySelector('.arm-front');
  const manifestUrl = new URL('girl/hi3d-animation.json?v=video-entry-brisk-13', document.currentScript.src);
  const sequences = {};
  const motion = { stride: 68, cycleDuration: .8, rampDuration: .16, brakeDistance: 4, settleDuration: 180, brakeDuration: 800, approachDistance: 28 };
  const operation = { arm: 70, head: 0 };
  let animation = null;
  let frameRequest = 0;
  let idleTimer = 0;
  let modeTimer = 0;
  let modeResolve = null;
  let entryResolve = null;
  let entryPromise = Promise.resolve();
  let entryVersion = 0;
  let currentFrame = '';
  let idleIndex = 0;
  let idleLoopStart = 0;
  let loaded = false;
  let actionReady = Promise.resolve();
  let unavailable = false;
  let currentPose = 'ready';

  function reduced() {
    return document.body.classList.contains('no-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function visible() {
    return !document.hidden && !document.getElementById('homePage').hidden && !document.body.classList.contains('scene-paused');
  }

  function reactionAllowed() {
    const drop = document.getElementById('drop');
    return visible() && !reduced() && !drop.hidden && drop.childElementCount > 0 && document.getElementById('preview').hidden && document.getElementById('machine').dataset.stage === 'dropping';
  }

  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function smooth(value) { return value * value * (3 - 2 * value); }

  function cancelLoop() {
    clearTimeout(idleTimer);
    idleTimer = 0;
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    animation?.resolve?.();
    animation = null;
  }

  function releaseEntry() {
    entryResolve?.();
    entryResolve = null;
  }

  function resolveMode() {
    clearTimeout(modeTimer);
    modeResolve?.();
    modeResolve = null;
  }

  function operationFrame(extra = 0) {
    rig.style.transform = 'none';
    head.style.transform = `rotate(${operation.head.toFixed(3)}deg)`;
    arm.style.transform = `rotate(${(operation.arm + extra).toFixed(3)}deg)`;
    girl.querySelectorAll('.leg-front,.leg-back').forEach(leg => { leg.style.transform = 'none'; });
  }

  function paint(name, index) {
    const frames = sequences[name];
    if (!frames?.length) return;
    const safeIndex = Math.min(frames.length - 1, Math.max(0, index));
    const key = `${name}:${safeIndex}`;
    if (currentFrame !== key) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(frames[safeIndex].image, 0, 0);
      currentFrame = key;
    }
    girl.dataset.sequence = name;
    girl.dataset.frame = String(safeIndex + 1);
  }

  function paintPhase(name, phase) {
    const frames = sequences[name];
    const index = frames.findLastIndex((frame, position) => phase >= (frame.phase ?? position / frames.length));
    paint(name, Math.max(0, index));
  }

  function startIdle(reset = false) {
    clearTimeout(idleTimer);
    idleTimer = 0;
    if (!loaded || unavailable || animation) return;
    if (reset) idleIndex = 0;
    girl.dataset.mode = 'sprite';
    girl.dataset.gait = 'standing';
    paint('idle', idleIndex);
    if (reduced() || !visible() || currentPose === 'operating' || sequences.idle.length === 1) return;
    idleTimer = setTimeout(() => {
      idleIndex = idleIndex + 1 < sequences.idle.length ? idleIndex + 1 : idleLoopStart;
      startIdle();
    }, sequences.idle[idleIndex].duration ?? (idleIndex === 0 ? 1100 : 280));
  }

  function finishEntry() {
    entryVersion++;
    cancelLoop();
    resolveMode();
    girl.style.visibility = '';
    girl.style.transform = 'none';
    girl.dataset.gait = 'standing';
    currentPose = 'ready';
    girl.dataset.pose = 'ready';
    releaseEntry();
    if (loaded) startIdle(true);
    else {
      Object.assign(operation, { arm: 70, head: 0 });
      operationFrame();
    }
  }

  function schedule() {
    if (!frameRequest) frameRequest = requestAnimationFrame(tick);
  }

  function tick(now) {
    frameRequest = 0;
    const active = animation;
    if (!active) return;
    if (reduced() || !visible()) {
      if (active.kind === 'entry' || active.kind === 'settle') finishEntry();
      else {
        const resolve = active.resolve;
        animation = null;
        resolve?.();
        startIdle();
      }
      return;
    }
    if (['surprise', 'happy'].includes(active.name) && !reactionAllowed()) {
      const resolve = active.resolve;
      animation = null;
      currentPose = 'ready';
      girl.dataset.pose = 'ready';
      startIdle(true);
      resolve?.();
      return;
    }
    const elapsed = Math.max(0, now - active.start);
    if (active.kind === 'entry') {
      const seconds = elapsed / 1000;
      const speed = active.stride / motion.cycleDuration;
      const ramp = motion.rampDuration;
      let distance;
      if (elapsed < active.cruiseDuration) {
        distance = seconds < ramp ? speed * seconds ** 2 / (2 * ramp) : speed * (seconds - ramp / 2);
      } else {
        const approachSeconds = Math.min(active.approachDuration, elapsed - active.cruiseDuration) / 1000;
        const acceleration = (active.approachEndSpeed - speed) / (active.approachDuration / 1000);
        distance = active.cruiseDistance + speed * approachSeconds + .5 * acceleration * approachSeconds ** 2;
      }
      if (elapsed < active.walkDuration) {
        girl.dataset.gait = elapsed >= active.cruiseDuration ? 'decelerating' : seconds < ramp ? 'starting' : 'walking';
        girl.style.transform = `translate3d(${(-active.distance + distance).toFixed(3)}px,0,0)`;
        girl.dataset.distance = distance.toFixed(3);
        paintPhase('walk', (active.phaseOffset + distance / active.stride) % 1);
      } else {
        const braking = clamp((elapsed - active.walkDuration) / active.brakeDuration);
        const brakeTravel = 1 - (1 - braking) ** 3;
        const travel = active.walkDistance + active.brakeDistance * brakeTravel;
        girl.dataset.gait = braking < 1 ? 'decelerating' : 'settling';
        girl.style.transform = `translate3d(${(-active.distance + travel).toFixed(3)}px,0,0)`;
        girl.dataset.distance = travel.toFixed(3);
        paintPhase('slow_down', braking);
        if (braking === 1) {
          girl.style.transform = 'none';
          animation = { kind: 'settle', start: now };
          schedule();
          return;
        }
      }
    } else if (active.kind === 'settle') {
      if (elapsed >= motion.settleDuration) {
        animation = null;
        startIdle(true);
        releaseEntry();
        return;
      }
    } else if (active.kind === 'clip') {
      const progress = clamp(elapsed / active.duration);
      paintPhase(active.name, progress);
      if (progress === 1) {
        animation = null;
        active.resolve?.();
        if (!active.hold) startIdle(true);
        return;
      }
    } else if (active.kind === 'sequence') {
      const index = Math.floor(elapsed / active.frameDuration);
      if (index >= sequences[active.name].length) {
        animation = null;
        active.resolve?.();
        startIdle(true);
        return;
      }
      paint(active.name, index);
    } else if (active.kind === 'reach') {
      const progress = clamp(elapsed / active.duration);
      const blend = smooth(progress);
      operation.arm = active.from.arm + (20 - active.from.arm) * blend;
      operation.head = active.from.head + (-1 - active.from.head) * blend;
      operationFrame();
      if (progress === 1) {
        animation = null;
        active.resolve?.();
        return;
      }
    } else if (active.kind === 'turn') {
      const progress = clamp(elapsed / 950);
      operationFrame(Math.sin(progress * Math.PI * 2) * Math.sin(progress * Math.PI) ** 2 * 3);
      if (progress === 1) {
        animation = null;
        operationFrame();
        return;
      }
    }
    if (animation) schedule();
  }

  function playClip(name, duration, hold = false) {
    cancelLoop();
    resolveMode();
    girl.dataset.mode = 'sprite';
    girl.dataset.gait = 'standing';
    paint(name, 0);
    if (!loaded || unavailable || reduced() || !visible()) {
      paint(name, sequences[name].length - 1);
      if (!hold) startIdle(true);
      return Promise.resolve();
    }
    const milliseconds = duration ?? sequences[name].reduce((total, frame) => total + (frame.duration ?? 1000 / 24), 0);
    const finished = new Promise(resolve => {
      animation = { kind: 'clip', name, duration: milliseconds, hold, start: performance.now(), resolve };
    });
    schedule();
    return finished;
  }

  function play(name, frameDuration = 110) {
    cancelLoop();
    resolveMode();
    girl.dataset.mode = 'sprite';
    girl.dataset.gait = 'standing';
    paint(name, 0);
    if (!loaded || unavailable || reduced() || !visible()) return Promise.resolve();
    const finished = new Promise(resolve => {
      animation = { kind: 'sequence', name, frameDuration, start: performance.now(), resolve };
    });
    schedule();
    return finished;
  }

  function setPose(pose, duration = 380) {
    if (pose === 'celebrating' && !reactionAllowed()) return Promise.resolve();
    currentPose = pose;
    girl.dataset.pose = pose;
    cancelLoop();
    resolveMode();
    if (pose === 'operating' && sequences.operate_reach?.length) return playClip('operate_reach', undefined, true);
    if (pose === 'waiting' && sequences.operate_release?.length) return playClip('operate_release');
    if (pose === 'operating') {
      girl.dataset.mode = 'operation';
      const from = { ...operation };
      if (reduced() || !duration || !visible()) {
        Object.assign(operation, { arm: 20, head: -1 });
        operationFrame();
        return Promise.resolve();
      }
      const finished = new Promise(resolve => {
        animation = { kind: 'reach', from, duration, start: performance.now(), resolve };
      });
      schedule();
      return finished;
    }
    if (pose === 'celebrating') return sequences.happy?.[0]?.duration ? playClip('happy') : play('happy', 110);
    girl.dataset.mode = 'sprite';
    startIdle(true);
    if (reduced() || !duration || !visible()) return Promise.resolve();
    return new Promise(resolve => {
      modeResolve = resolve;
      modeTimer = setTimeout(() => { modeResolve = null; resolve(); }, Math.min(duration, 160));
    });
  }

  function turn() {
    if (sequences.operate_turn?.length) return playClip('operate_turn', 950, true);
    if (reduced() || !visible()) return;
    cancelLoop();
    animation = { kind: 'turn', start: performance.now() };
    schedule();
  }

  const assetsReady = (async () => {
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) throw new Error('Character animation manifest unavailable');
      const manifest = await response.json();
      if (manifest.canvas?.[0] !== 256 || manifest.canvas?.[1] !== 288) throw new Error('Unsupported character canvas');
      for (const key of Object.keys(motion)) {
        if (Number.isFinite(manifest.motion?.[key]) && manifest.motion[key] > 0) motion[key] = manifest.motion[key];
      }
      async function loadFrames(entries) {
        return Promise.all(entries.map(async entry => {
          const image = new Image();
          const imageUrl = new URL(entry.path, manifestUrl);
          imageUrl.searchParams.set('v', manifest.revision || 'hands-free-1');
          image.src = imageUrl.href;
          await image.decode();
          if (image.naturalWidth !== 256 || image.naturalHeight !== 288) throw new Error('Character frame dimensions do not match');
          return { ...entry, image };
        }));
      }
      if (Object.values(manifest.sequences).some(entries => !entries.length)) throw new Error('Empty character sequence');
      const essentials = ['walk', 'slow_down'];
      await Promise.all(essentials.map(async name => { sequences[name] = await loadFrames(manifest.sequences[name]); }));
      sequences.idle = await loadFrames(manifest.sequences.idle.slice(0, 1));
      actionReady = Promise.all([
        loadFrames(manifest.sequences.idle.slice(1)).then(frames => {
          sequences.idle.push(...frames);
          idleLoopStart = Number.isInteger(manifest.idleLoopStart) && manifest.idleLoopStart >= 0 && manifest.idleLoopStart < sequences.idle.length ? manifest.idleLoopStart : 0;
          girl.dataset.idleMotion = sequences.idle.length > 1 ? 'frames' : 'still';
          if (!animation) startIdle(true);
        }),
        ...Object.entries(manifest.sequences).filter(([name]) => !essentials.includes(name) && name !== 'idle').map(async ([name, entries]) => {
          sequences[name] = await loadFrames(entries);
        })
      ]).catch(() => {
        unavailable = true;
        girl.dataset.assets = 'unavailable';
        girl.classList.add('has-fallback');
        document.getElementById('sceneNote').hidden = false;
      });
      idleLoopStart = Number.isInteger(manifest.idleLoopStart) && manifest.idleLoopStart >= 0 && manifest.idleLoopStart < sequences.idle.length ? manifest.idleLoopStart : 0;
      girl.dataset.idleMotion = sequences.idle.length > 1 ? 'frames' : 'still';
      loaded = true;
      girl.dataset.assets = 'ready';
      if (!animation) startIdle(true);
      return true;
    } catch (error) {
      unavailable = true;
      girl.dataset.assets = 'unavailable';
      girl.classList.add('has-fallback');
      document.getElementById('sceneNote').hidden = false;
      return false;
    }
  })();

  function enter() {
    finishEntry();
    const version = ++entryVersion;
    entryPromise = new Promise(resolve => { entryResolve = resolve; });
    if (reduced() || !visible() || location.hash && location.hash !== '#home') {
      finishEntry();
      return entryPromise;
    }
    girl.style.visibility = 'hidden';
    assetsReady.then(available => {
      if (version !== entryVersion) return;
      if (!available || reduced() || !visible()) { finishEntry(); return; }
      girl.dataset.mode = 'sprite';
      paint('walk', 0);
      const box = canvas.getBoundingClientRect();
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let opaqueRight = 0;
      for (let pixel = 3; pixel < pixels.length; pixel += 4) {
        if (pixels[pixel] > 32) opaqueRight = Math.max(opaqueRight, (pixel - 3) / 4 % canvas.width + 1);
      }
      const machine = document.getElementById('machine');
      const scale = machine.getBoundingClientRect().width / machine.offsetWidth;
      const stride = motion.stride;
      const brakeDistance = motion.brakeDistance;
      const distance = Math.max(stride + brakeDistance, (box.left + box.width * opaqueRight / canvas.width - 10) / scale);
      const walkDistance = distance - brakeDistance;
      const phaseOffset = (1 - walkDistance / stride % 1) % 1;
      const speed = stride / motion.cycleDuration;
      const brakeDuration = motion.brakeDuration;
      const approachDistance = Math.min(motion.approachDistance, walkDistance / 2);
      const approachEndSpeed = Math.min(speed, brakeDistance * 3 / (brakeDuration / 1000));
      const approachDuration = 2 * approachDistance / (speed + approachEndSpeed) * 1000;
      const cruiseDistance = walkDistance - approachDistance;
      const cruiseDuration = (cruiseDistance / speed + motion.rampDuration / 2) * 1000;
      cancelLoop();
      girl.dataset.mode = 'sprite';
      girl.dataset.gait = 'starting';
      girl.dataset.stride = String(stride);
      girl.dataset.distance = '0';
      girl.style.transform = `translate3d(${-distance}px,0,0)`;
      paintPhase('walk', phaseOffset);
      girl.style.visibility = '';
      animation = { kind: 'entry', start: performance.now(), stride, phaseOffset, walkDistance, distance, brakeDistance, brakeDuration, cruiseDistance, cruiseDuration, approachDuration, approachEndSpeed, walkDuration: cruiseDuration + approachDuration };
      schedule();
    });
    return entryPromise;
  }

  function settleMotion() { finishEntry(); }

  new MutationObserver(() => {
    if (reduced() || !visible()) {
      clearTimeout(idleTimer);
      idleTimer = 0;
      if (animation?.kind === 'entry' || animation?.kind === 'settle') finishEntry();
    } else if (!animation && currentPose !== 'operating') startIdle();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishEntry();
    else if (!animation) startIdle();
  });

  return {
    enter, finishEntry, setPose, turn, settleMotion,
    playAction(name) {
      const reaction = ['surprise', 'happy'].includes(name);
      if (reaction && !reactionAllowed()) return Promise.resolve();
      return Promise.all([assetsReady, entryPromise, actionReady]).then(([available]) => {
        if (!available || !['jump', 'surprise', 'happy'].includes(name) || reaction && !reactionAllowed()) return;
        return reaction && sequences[name]?.[0]?.duration ? playClip(name) : play(name);
      });
    },
    get ready() { return Promise.all([entryPromise, actionReady]); }
  };
})();
