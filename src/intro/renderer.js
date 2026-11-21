// Canvas renderer for the hero intro. Same model as the live site:
// every layer is a full-poster image drawn centred on the canvas at
//   scale = camera * 5000 / (5000 + max(z, -4999))
// so a layer at z = 0 lands exactly on the poster box, and a negative z puts
// it close to the camera (huge). On top of that each layer can have:
//   reveal  0..1  a #0C0D1B silhouette over the image (pieces start dark)
//   mask    0..1  top-down wipe with a soft 200px bottom edge (the wordmark)
//   shadow  a blurred, tinted silhouette behind it (logo glows)

const PAGE = '#0C0D1B'
const FOCAL = 5000

export class Layer {
  x = 0
  y = 0
  z = 0
  scale = 1
  alpha = 1
  reveal = 0
  visible = true
  shadowColor = 'rgba(0,0,0,0)'
  shadowOpacity = 0
  shadowBlur = 0
  shadowX = 0
  shadowY = 0
  mask = 1
  maskSoftness = 200
  constructor(zIndex) {
    this.zIndex = zIndex
  }
}

export class Stage {
  camera = 1
}

let scratch = null
let scratchCtx = null

// layers: Layer[]; images: ImageBitmap[] (index = zIndex)
export function draw(ctx, canvas, layers, stage, images) {
  // exact CSS size when the caller provides it (clientWidth/Height round)
  const w = canvas.cssWidth ?? canvas.clientWidth
  const h = canvas.cssHeight ?? canvas.clientHeight
  const imgW = images[0].width
  const imgH = images[0].height
  if (!scratch) {
    scratch = new OffscreenCanvas(imgW, imgH)
    scratchCtx = scratch.getContext('2d')
    scratchCtx.imageSmoothingEnabled = false
  }
  if (scratch.width !== imgW || scratch.height !== imgH) {
    scratch.width = imgW
    scratch.height = imgH
  }

  ctx.clearRect(0, 0, w, h)
  ctx.save()
  const cx = w / 2
  const cy = h / 2
  ctx.translate(cx, cy)
  ctx.scale(stage.camera, stage.camera)
  ctx.translate(-cx, -cy)

  const offX = (w - imgW) / 2
  const offY = (h - imgH) / 2
  const halfW = imgW / 2
  const halfH = imgH / 2
  // The live code rounds these; we don't, so the last frame lands exactly on
  // the poster box even when the box (or the cropped image) has half pixels,
  // and the swap to the <picture>s doesn't shift.
  const left = -halfW
  const top = -halfH

  const ordered = [...layers].sort((a, b) => a.zIndex - b.zIndex)
  for (const layer of ordered) {
    if (!layer.visible || layer.alpha <= 0) continue
    const img = images[layer.zIndex]
    const depth = FOCAL / (FOCAL + Math.max(layer.z, -(FOCAL - 1)))
    const s = layer.scale * depth

    ctx.save()
    ctx.globalAlpha = layer.alpha
    ctx.translate(offX + layer.x * depth + halfW, offY + layer.y * depth + halfH)
    if (s !== 1) ctx.scale(s, s)

    // glow: tinted silhouette, blurred, behind the image
    if (layer.shadowOpacity > 0) {
      tint(img, layer.shadowColor, imgW, imgH)
      ctx.save()
      ctx.globalAlpha = layer.shadowOpacity
      ctx.filter = layer.shadowBlur > 0 ? `blur(${layer.shadowBlur}px)` : 'none'
      ctx.translate(layer.shadowX, layer.shadowY)
      ctx.drawImage(scratch, left, top)
      ctx.restore()
    }

    const m = Math.max(0, Math.min(1, layer.mask))
    if (m <= 0) {
      ctx.restore()
      continue
    }
    if (m >= 1) {
      ctx.drawImage(img, left, top)
    } else {
      // top-down wipe: rows 0..edge visible, last `soft` rows fade out
      const edge = Math.round(imgH * m)
      const soft = Math.min(Math.round(layer.maskSoftness), edge, imgH * 0.5)
      const solid = Math.max(edge - soft, 0)
      scratchCtx.clearRect(0, 0, imgW, imgH)
      scratchCtx.drawImage(img, 0, 0)
      scratchCtx.clearRect(0, edge, imgW, imgH - edge)
      if (soft > 0) {
        const g = scratchCtx.createLinearGradient(0, 0, 0, edge)
        g.addColorStop(0, 'rgba(255,255,255,1)')
        g.addColorStop(solid / edge, 'rgba(255,255,255,1)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        scratchCtx.save()
        scratchCtx.globalCompositeOperation = 'destination-in'
        scratchCtx.fillStyle = g
        scratchCtx.fillRect(0, 0, imgW, edge)
        scratchCtx.restore()
      }
      ctx.drawImage(scratch, left, top)
    }

    // dark overlay that lifts as the piece arrives
    if (layer.reveal > 0) {
      tint(img, PAGE, imgW, imgH)
      ctx.save()
      ctx.globalAlpha = layer.reveal
      ctx.drawImage(scratch, left, top)
      ctx.restore()
    }
    ctx.restore()
  }
  ctx.restore()
}

function tint(img, color, w, h) {
  scratchCtx.clearRect(0, 0, w, h)
  scratchCtx.drawImage(img, 0, 0)
  scratchCtx.save()
  scratchCtx.globalCompositeOperation = 'source-in'
  scratchCtx.fillStyle = color
  scratchCtx.fillRect(0, 0, w, h)
  scratchCtx.restore()
}

export function resetScratch() {
  scratch = null
  scratchCtx = null
}

// Crop `img` to the poster box's aspect (centred, like object-fit: cover at
// 50% 50%) and resample to `targetW` px wide (never above the crop's size).
export async function toLayerBitmap(img, boxAspect, targetW) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  let sw = iw
  let sh = ih
  if (iw / ih > boxAspect) sw = ih * boxAspect
  else sh = iw / boxAspect
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  const outW = Math.max(1, Math.min(Math.round(targetW), Math.round(sw)))
  const outH = Math.max(1, Math.round(outW / boxAspect))
  return createImageBitmap(img, sx, sy, sw, sh, { resizeWidth: outW, resizeHeight: outH, resizeQuality: 'high' })
}
