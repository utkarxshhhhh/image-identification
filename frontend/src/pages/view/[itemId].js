import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import api from "@/lib/api";

/**
 * AR / 3D Viewer page  –  /view/[itemId]
 *
 * Flow:
 *  1. Fetch food item data from the public API.
 *  2. Check for WebXR AR support (immersive-ar).
 *  3. If AR is supported → launch WebXR session with Three.js.
 *  4. If AR is NOT supported → fall back to a simple 360° Three.js viewer.
 *
 * The user can tap on the placed model (AR) or click the info button to
 * reveal a slide-up overlay with the item details.
 */
export default function ARViewer() {
  const router = useRouter();
  const { itemId } = router.query;

  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [error, setError] = useState("");
  const [arSupported, setArSupported] = useState(null); // null = unknown
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [arStarted, setArStarted] = useState(false);

  const canvasRef = useRef(null);
  const threeRef = useRef({}); // stores Three.js objects

  // ── 1. Fetch item data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!itemId) return;
    (async () => {
      try {
        const { data } = await api.get(`/items/public/${itemId}`);
        setItem(data);
      } catch {
        setError("Item not found or unavailable.");
      } finally {
        setLoadingItem(false);
      }
    })();
  }, [itemId]);

  // ── 2. Detect WebXR AR support ────────────────────────────────────────────
  useEffect(() => {
    if (!("xr" in navigator)) {
      setArSupported(false);
      return;
    }
    navigator.xr
      .isSessionSupported("immersive-ar")
      .then((supported) => setArSupported(supported))
      .catch(() => setArSupported(false));
  }, []);

  // ── 3. Initialise Three.js fallback viewer (non-AR) ───────────────────────
  const initFallback3D = useCallback(async () => {
    if (!item?.modelUrl || !canvasRef.current) return;

    // Dynamic imports keep Three.js out of the initial bundle
    const THREE = await import("three");
    const { GLTFLoader } = await import(
      "three/examples/jsm/loaders/GLTFLoader"
    );
    const { OrbitControls } = await import(
      "three/examples/jsm/controls/OrbitControls"
    );

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      55,
      canvas.clientWidth / canvas.clientHeight,
      0.01,
      100
    );
    camera.position.set(0, 0.5, 1.5);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Orbit controls for the fallback viewer
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    // Load the GLB model
    const loader = new GLTFLoader();
    loader.load(
      item.modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        model.scale.setScalar(1 / maxDim);

        scene.add(model);
        setModelLoaded(true);
        threeRef.current.model = model;
      },
      undefined,
      (err) => console.error("GLB load error", err)
    );

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(canvas);

    // Render loop
    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    threeRef.current = { renderer, scene, camera, controls, ro, rafId };
  }, [item]);

  // ── 4. Initialise WebXR AR session ────────────────────────────────────────
  const startAR = useCallback(async () => {
    if (!item?.modelUrl || !canvasRef.current) return;

    const THREE = await import("three");
    const { GLTFLoader } = await import(
      "three/examples/jsm/loaders/GLTFLoader"
    );

    const canvas = canvasRef.current;

    // WebXR-compatible renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.xr.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    // Hit-test reticle (small ring to show where the surface is)
    const reticleGeo = new THREE.RingGeometry(0.04, 0.05, 32).rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Load the GLB model (lazy)
    let model = null;
    let modelPlaced = false;

    const loader = new GLTFLoader();
    loader.load(
      item.modelUrl,
      (gltf) => {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        model.scale.setScalar(0.3 / maxDim); // ~30 cm
        model.visible = false;
        scene.add(model);
        setModelLoaded(true);
      },
      undefined,
      (err) => console.error("GLB load error", err)
    );

    // Request WebXR AR session with hit-testing
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.getElementById("ar-overlay") },
    });

    renderer.xr.setReferenceSpaceType("local");
    await renderer.xr.setSession(session);
    setArStarted(true);

    let hitTestSource = null;
    let hitTestSourceRequested = false;

    // Tap to place model
    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", () => {
      if (reticle.visible && model && !modelPlaced) {
        model.position.setFromMatrixPosition(reticle.matrix);
        model.visible = true;
        modelPlaced = true;
        reticle.visible = false;
      } else if (modelPlaced) {
        // Tap on placed model → toggle info overlay
        setShowInfo((v) => !v);
      }
    });
    scene.add(controller);

    renderer.setAnimationLoop((_, frame) => {
      if (!frame) return;

      const referenceSpace = renderer.xr.getReferenceSpace();
      const xrSession = renderer.xr.getSession();

      // Set up hit-test source once per session
      if (!hitTestSourceRequested) {
        xrSession.requestReferenceSpace("viewer").then((vs) => {
          xrSession
            .requestHitTestSource({ space: vs })
            .then((src) => {
              hitTestSource = src;
            });
        });
        hitTestSourceRequested = true;
      }

      // Move reticle to detected surface
      if (hitTestSource && !modelPlaced) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(
            hit.getPose(referenceSpace).transform.matrix
          );
        } else {
          reticle.visible = false;
        }
      }

      renderer.render(scene, camera);
    });

    session.addEventListener("end", () => {
      setArStarted(false);
      hitTestSource = null;
      hitTestSourceRequested = false;
    });

    threeRef.current = { renderer, session };
  }, [item]);

  // Start the appropriate viewer once item data is ready
  useEffect(() => {
    if (!item) return;
    if (arSupported === false) {
      initFallback3D();
    }
    return () => {
      // Clean up Three.js on unmount
      const { renderer, ro, rafId } = threeRef.current;
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      if (renderer) renderer.dispose();
    };
  }, [item, arSupported, initFallback3D]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loadingItem) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{item?.name} – AR Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Full-screen canvas */}
      <div className="relative w-screen h-screen bg-gray-900 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* AR overlay container – referenced by WebXR domOverlay */}
        <div id="ar-overlay" className="absolute inset-0 pointer-events-none">

          {/* Loading indicator while GLB loads */}
          {!modelLoaded && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm">Loading 3D model…</p>
            </div>
          )}

          {/* "Start AR" button (only shown when AR is supported but not yet started) */}
          {arSupported && !arStarted && modelLoaded && (
            <div className="pointer-events-auto absolute bottom-10 left-1/2 -translate-x-1/2">
              <button
                onClick={startAR}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full shadow-xl text-lg transition"
              >
                Start AR 📱
              </button>
            </div>
          )}

          {/* Hint text in AR mode */}
          {arStarted && !showInfo && (
            <p className="pointer-events-none absolute bottom-8 left-0 right-0 text-center text-white text-sm bg-black/40 py-2">
              Point at a flat surface and tap to place the dish
            </p>
          )}

          {/* Info button */}
          {modelLoaded && (
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="pointer-events-auto absolute top-6 right-6 bg-white/90 hover:bg-white text-orange-600 font-bold rounded-full w-11 h-11 text-xl shadow-lg transition"
            >
              ℹ
            </button>
          )}

          {/* Fallback label */}
          {arSupported === false && (
            <p className="pointer-events-none absolute top-6 left-6 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              3D Viewer (AR not supported)
            </p>
          )}
        </div>

        {/* Slide-up info overlay */}
        {showInfo && item && (
          <div
            className="absolute inset-0 bg-black/50 flex items-end z-10"
            onClick={() => setShowInfo(false)}
          >
            <div
              className="bg-white rounded-t-3xl w-full max-h-[60vh] overflow-y-auto thin-scroll p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800">{item.name}</h1>
                <span className="text-orange-500 font-bold text-xl whitespace-nowrap">
                  ${Number(item.price).toFixed(2)}
                </span>
              </div>

              {item.calories != null && (
                <p className="text-sm text-gray-400 mt-1">
                  🔥 {item.calories} kcal
                </p>
              )}

              {item.description && (
                <p className="text-gray-600 text-sm mt-3">{item.description}</p>
              )}

              {item.ingredients?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Ingredients
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full border border-orange-100"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
