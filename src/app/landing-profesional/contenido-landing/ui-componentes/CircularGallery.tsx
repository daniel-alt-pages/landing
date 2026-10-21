'use client';

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { useEffect, useRef } from 'react';

import type { CotizGalleryItem } from '@/app/landing-profesional/contenido-landing/datos-marketing/institutionGalleryItems';

type GL = Renderer['gl'];

/** Dimensiones base del rectángulo del logo en px CSS (viewport del canvas). */
const GALLERY_CARD_WIDTH_PX = 350;
const GALLERY_CARD_HEIGHT_PX = 450;

/** Hueco horizontal visible entre tarjetas (px CSS). Mayor con `bend` en `onResize`. */
const GALLERY_GAP_PX = 96;
/** Extra de separación por unidad de `bend` (evita roce al rotar en la curva). */
const GALLERY_GAP_PER_BEND_PX = 16;

/** Entrada escalonada: retraso entre institución y duración de cada “pop”. */
const INTRO_STAGGER_S = 0.09;
const INTRO_ITEM_S = 0.52;
const MAX_GALLERY_DPR = 2.5;
const MIN_GALLERY_DPR = 2;
const GALLERY_TEXTURE_ANISOTROPY = 8;

function getResponsiveCardSize(screen: ScreenSize): { width: number; height: number; gap: number } {
  const inset = screen.width < 640 ? 28 : 56;
  const effectiveWidth = Math.max(280, screen.width - inset * 2);
  const maxCardHeight = Math.max(200, screen.height * 0.58);

  if (effectiveWidth < 520) {
    return {
      width: Math.min(200, effectiveWidth * 0.5),
      height: Math.min(260, maxCardHeight),
      gap: 52,
    };
  }
  if (effectiveWidth < 768) {
    return {
      width: Math.min(220, effectiveWidth * 0.42),
      height: Math.min(280, maxCardHeight),
      gap: 64,
    };
  }
  if (effectiveWidth < 1100) {
    return {
      width: Math.min(240, effectiveWidth * 0.28),
      height: Math.min(300, maxCardHeight),
      gap: 88,
    };
  }
  return {
    width: Math.min(GALLERY_CARD_WIDTH_PX, effectiveWidth * 0.22),
    height: Math.min(GALLERY_CARD_HEIGHT_PX, maxCardHeight),
    gap: GALLERY_GAP_PX,
  };
}

function debounce<T extends (...args: never[]) => void>(func: T, wait: number) {
  let timeoutId: number | undefined;
  return function debounced(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: object): void {
  const proto = Object.getPrototypeOf(instance) as Record<string, unknown>;
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key === 'constructor') return;
    const v = (instance as Record<string, unknown>)[key];
    if (typeof v === 'function') {
      (instance as Record<string, unknown>)[key] = (v as (...a: never[]) => unknown).bind(instance);
    }
  });
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(
  gl: GL,
  text: string,
  font = 'bold 30px monospace',
  color = 'black',
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2d context');

  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const fontSize = getFontSize(font);
  const textHeight = Math.ceil(fontSize * 1.2);

  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;

  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

interface TitleProps {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor?: string;
  font?: string;
}

class Title {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor: string;
  font: string;
  mesh!: Mesh;
  /** Ancho / alto del texture canvas del pie. */
  private captionAspect = 1;

  constructor({
    gl,
    plane,
    renderer,
    text,
    textColor = '#545050',
    font = '500 17px "Plus Jakarta Sans", system-ui, sans-serif',
  }: TitleProps) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: /* glsl */ `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: /* glsl */ `
        precision highp float;
        uniform sampler2D tMap;
        uniform float uCaptionReveal;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          color.a *= uCaptionReveal;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture }, uCaptionReveal: { value: 0 } },
      transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    this.captionAspect = width / height;
    this.applyLayout();
    this.mesh.setParent(this.plane);
  }

  setCaptionReveal(t: number) {
    (this.mesh.program.uniforms.uCaptionReveal as { value: number }).value = t;
  }

  /** Re-sincroniza escala/posición del pie cuando cambia el tamaño del plano (resize). */
  applyLayout() {
    const textHeightScaled = this.plane.scale.y * 0.09;
    const textWidthScaled = textHeightScaled * this.captionAspect;
    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.04;
  }
}

interface ScreenSize {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface MediaProps {
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius?: number;
  font?: string;
}

class Media {
  extra = 0;
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius: number;
  font?: string;
  program!: Program;
  plane!: Mesh;
  title!: Title;
  padding!: number;
  width!: number;
  widthTotal!: number;
  x!: number;
  speed = 0;
  isBefore = false;
  isAfter = false;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font,
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true,
      minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
      magFilter: this.gl.LINEAR,
      anisotropy: GALLERY_TEXTURE_ANISOTROPY,
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: /* glsl */ `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uIntroReveal;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          float intro = clamp(uIntroReveal, 0.0, 1.0);
          float grow = intro * (2.0 - intro);
          p.xy *= 0.88 + 0.12 * grow;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          p.z += (1.0 - intro) * -1.25;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: /* glsl */ `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uTextureFitScale;
        uniform float uIntroReveal;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec2 uvc = uv - 0.5;
          uv = clamp(uvc / uTextureFitScale + 0.5, 0.001, 0.999);
          vec4 color = texture2D(tMap, uv);

          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);

          float edgeSmooth = 0.002;
          float alpha = (1.0 - smoothstep(-edgeSmooth, edgeSmooth, d)) * uIntroReveal * color.a;

          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uIntroReveal: { value: 0 },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
        uTextureFitScale: { value: 0.74 },
      },
      transparent: true,
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    });
  }

  syncIntro(elapsedSec: number) {
    const half = Math.max(1, this.length / 2);
    const slot = this.index % half;
    const raw = Math.min(1, Math.max(0, (elapsedSec - slot * INTRO_STAGGER_S) / INTRO_ITEM_S));
    const ease = 1 - (1 - raw) ** 3;
    (this.program.uniforms.uIntroReveal as { value: number }).value = ease;
    this.title.setCaptionReveal(ease);
  }

  update(scroll: { current: number; last: number }, direction: 'right' | 'left', introElapsedSec: number) {
    this.syncIntro(introElapsedSec);
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = false;
      this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = false;
      this.isAfter = false;
    }
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    const card = getResponsiveCardSize(this.screen);
    this.plane.scale.y = (card.height / this.screen.height) * this.viewport.height;
    this.plane.scale.x = (card.width / this.screen.width) * this.viewport.width;
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    const gapPx = card.gap + Math.abs(this.bend) * GALLERY_GAP_PER_BEND_PX;
    this.padding = (gapPx / this.screen.width) * this.viewport.width;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
    this.title.applyLayout();
  }
}

interface AppConfig {
  items?: CotizGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
}

class App {
  container: HTMLElement;
  scrollSpeed: number;
  scroll: {
    ease: number;
    current: number;
    target: number;
    last: number;
    position?: number;
  };
  onCheckDebounce: ReturnType<typeof debounce<() => void>>;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  mediasImages: CotizGalleryItem[] = [];
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  raf = 0;

  boundOnResize!: () => void;
  boundOnWheel!: (e: Event) => void;
  boundOnTouchDown!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchMove!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchUp!: () => void;

  isDown = false;
  start = 0;
  startY = 0;
  dragAxis: 'horizontal' | 'vertical' | null = null;
  introT0 = performance.now();

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 1,
      textColor = '#ffffff',
      borderRadius = 0,
      font = '500 17px "Plus Jakarta Sans", system-ui, sans-serif',
      scrollSpeed = 2,
      scrollEase = 0.05,
    }: AppConfig,
  ) {
    document.documentElement.classList.remove('no-js');
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this) as () => void, 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(Math.max(window.devicePixelRatio || 1, MIN_GALLERY_DPR), MAX_GALLERY_DPR),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 34;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100,
    });
  }

  createMedias(
    items: CotizGalleryItem[] | undefined,
    bend: number,
    textColor: string,
    borderRadius: number,
    font: string,
  ) {
    const defaultItems: CotizGalleryItem[] = [
      { image: 'https://picsum.photos/seed/1/800/600?grayscale', text: 'Bridge' },
      { image: 'https://picsum.photos/seed/2/800/600?grayscale', text: 'Desk Setup' },
      { image: 'https://picsum.photos/seed/3/800/600?grayscale', text: 'Waterfall' },
      { image: 'https://picsum.photos/seed/4/800/600?grayscale', text: 'Strawberries' },
      { image: 'https://picsum.photos/seed/5/800/600?grayscale', text: 'Deep Diving' },
      { image: 'https://picsum.photos/seed/16/800/600?grayscale', text: 'Train Track' },
      { image: 'https://picsum.photos/seed/17/800/600?grayscale', text: 'Santorini' },
      { image: 'https://picsum.photos/seed/8/800/600?grayscale', text: 'Blurry Lights' },
      { image: 'https://picsum.photos/seed/9/800/600?grayscale', text: 'New York' },
      { image: 'https://picsum.photos/seed/10/800/600?grayscale', text: 'Good Boy' },
      { image: 'https://picsum.photos/seed/21/800/600?grayscale', text: 'Coastline' },
      { image: 'https://picsum.photos/seed/12/800/600?grayscale', text: 'Palm Trees' },
    ];
    const galleryItems = items?.length ? items : defaultItems;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map(
      (data, index) =>
        new Media({
          geometry: this.planeGeometry,
          gl: this.gl,
          image: data.image,
          index,
          length: this.mediasImages.length,
          renderer: this.renderer,
          scene: this.scene,
          screen: this.screen,
          text: data.shortLabel ?? data.text,
          viewport: this.viewport,
          bend,
          textColor,
          borderRadius,
          font,
        }),
    );
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    if (!this.container.contains(e.target as Node | null)) return;
    this.isDown = true;
    this.dragAxis = null;
    this.scroll.position = this.scroll.current;
    this.start = 'touches' in e ? e.touches[0].clientX : e.clientX;
    this.startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (!this.isDown) return;
    const isTouchEvent = 'touches' in e;
    const x = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const y = isTouchEvent ? e.touches[0].clientY : e.clientY;
    const dx = x - this.start;
    const dy = this.startY - y;
    if (!this.dragAxis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      this.dragAxis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }
    if (this.dragAxis === 'vertical') return;
    const dragDirection = isTouchEvent ? -1 : 1;
    const distance = dx * (this.scrollSpeed * 0.025) * dragDirection;
    this.scroll.target = (this.scroll.position ?? 0) + distance;
  }

  onTouchUp() {
    this.isDown = false;
    this.dragAxis = null;
    this.onCheck();
  }

  onWheel(e: Event) {
    const wheelEvent = e as WheelEvent;
    const delta = wheelEvent.deltaY || (wheelEvent as WheelEvent & { wheelDelta?: number }).wheelDelta || 0;
    this.scroll.target += (delta > 0 ? -this.scrollSpeed : this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias.length || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
  }

  update() {
    const introElapsed = (performance.now() - this.introT0) / 1000;
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    this.medias.forEach((media) => media.update(this.scroll, direction, introElapsed));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    window.addEventListener('resize', this.boundOnResize);
    this.container.addEventListener('wheel', this.boundOnWheel, { passive: true });
    this.container.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    this.container.addEventListener('touchstart', this.boundOnTouchDown, { passive: true });
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundOnTouchUp);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    this.container.removeEventListener('wheel', this.boundOnWheel);
    this.container.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    this.container.removeEventListener('touchstart', this.boundOnTouchDown);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    const canvas = this.renderer?.gl?.canvas as HTMLCanvasElement | undefined;
    if (canvas?.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }
}

export interface CircularGalleryProps {
  items?: CotizGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
}

export default function CircularGallery({
  items,
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  font = '500 17px "Plus Jakarta Sans", system-ui, sans-serif',
  scrollSpeed = 2,
  scrollEase = 0.05,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const app = new App(containerRef.current, {
      items,
      bend,
      textColor,
      borderRadius,
      font,
      scrollSpeed,
      scrollEase,
    });
    return () => {
      app.destroy();
    };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase]);

  return (
    <div
      className="h-full w-full cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
      ref={containerRef}
      role="region"
      aria-label="Carrusel circular. Arrastra o usa la rueda del ratón."
    />
  );
}
