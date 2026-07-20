class PanoramaViewer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.imageUrl = options.imageUrl;
    this.autoRotate = options.autoRotate !== false;
    this.onLoad = options.onLoad || (() => {});
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphere = null;
    this.animationId = null;
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 };
    
    this.init();
  }
  
  init() {
    const { width, height } = this.container.getBoundingClientRect();
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 0.1);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    this.loadTexture();
    this.bindEvents();
    this.animate();
  }
  
  loadTexture() {
    const loader = new THREE.TextureLoader();
    loader.load(this.imageUrl, (texture) => {
      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      this.sphere = new THREE.Mesh(geometry, material);
      this.scene.add(this.sphere);
      this.onLoad();
    }, undefined, () => {
      console.error('全景图加载失败:', this.imageUrl);
    });
  }
  
  bindEvents() {
	  const container = this.container;
	  let isDragging = false;
	  let prevPos = { x: 0, y: 0 };

	  // ✅ 鼠标
	  container.addEventListener('mousedown', (e) => {
		isDragging = true;
		prevPos = { x: e.clientX, y: e.clientY };
	  });
	  
	  // ✅ 触摸
	  container.addEventListener('touchstart', (e) => {
		if (e.touches.length === 1) {
		  isDragging = true;
		  prevPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
	  }, { passive: false });
	  
	  // ✅ 移动（鼠标 + 触摸）
	  const onMove = (x, y) => {
		if (!isDragging || !this.sphere) return;
		const dx = x - prevPos.x;
		const dy = y - prevPos.y;
		this.sphere.rotation.y += dx * 0.005;
		this.sphere.rotation.x += dy * 0.005;
		this.sphere.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.sphere.rotation.x));
		prevPos = { x, y };
	  };
	  
	  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
	  window.addEventListener('touchmove', (e) => {
		if (e.touches.length === 1) {
		  onMove(e.touches[0].clientX, e.touches[0].clientY);
		}
	  }, { passive: false });
	  
	  // ✅ 结束
	  window.addEventListener('mouseup', () => { isDragging = false; });
	  window.addEventListener('touchend', () => { isDragging = false; });
    
    this.container.addEventListener('wheel', (e) => {
      if (!this.sphere) return;
      this.camera.fov += e.deltaY * 0.05;
      this.camera.fov = Math.max(30, Math.min(120, this.camera.fov));
      this.camera.updateProjectionMatrix();
    });
    window.addEventListener('resize', () => {
      const { width, height } = this.container.getBoundingClientRect();
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    });
  }
  
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (this.sphere && this.autoRotate && !this.isDragging) {
      this.sphere.rotation.y += 0.001;
    }
    this.renderer.render(this.scene, this.camera);
  }
  
  dispose() {
    cancelAnimationFrame(this.animationId);
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }
    if (this.sphere) {
      this.sphere.geometry.dispose();
      this.sphere.material.dispose();
      this.scene.remove(this.sphere);
    }
  }
}