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
    this.container.addEventListener('mousedown', (e) => { this.isDragging = true; this.prevMouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mouseup', () => { this.isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.sphere) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.sphere.rotation.y += dx * 0.005;
      this.sphere.rotation.x += dy * 0.005;
      this.sphere.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.sphere.rotation.x));
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });
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