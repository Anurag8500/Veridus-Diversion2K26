# Image Requirements for Hero Section

## Required Image

### File: `poly-bg.jpg`
**Location**: `/public/poly-bg.jpg`

**Specifications**:
- **Format**: JPG (for better compression)
- **Recommended Size**: 1920x1080 or larger
- **Aspect Ratio**: 16:9 or wider
- **File Size**: < 500KB (optimized for web)
- **Content**: Polygon/geometric mesh background pattern

**Design Guidelines**:
- Dark theme compatible (will be shown at 30% opacity)
- Abstract geometric or polygon mesh pattern
- Colors: Dark blues, purples, or grayscale
- Should complement the brand color (#8B5CF6)
- Avoid busy patterns (will be blurred with parallax)

**Alternative Names** (if you want to use a different name):
- Update the image path in `src/components/Hero.tsx` line 38:
  ```tsx
  src="/your-image-name.jpg"
  ```

## Current Status
- ❌ `poly-bg.jpg` - NOT FOUND (needs to be added)
- ✅ Hero component configured to use the image
- ✅ Next.js Image optimization enabled
- ✅ Parallax effect ready

## How to Add

1. **Option 1: Add your own image**
   - Place your polygon/mesh background image in `/public/`
   - Name it `poly-bg.jpg`
   - Refresh the page

2. **Option 2: Use a different image**
   - Place your image in `/public/`
   - Update the path in `src/components/Hero.tsx`

3. **Option 3: Generate one**
   - Use tools like:
     - https://trianglify.io/ (geometric patterns)
     - https://www.svgbackgrounds.com/ (SVG patterns)
     - https://coolbackgrounds.io/ (various backgrounds)
   - Export as JPG
   - Optimize with https://tinyjpg.com/
   - Add to `/public/`

## Fallback Behavior

If the image is not found:
- The hero section will still work
- Background will show gradient orbs only
- No errors will be displayed
- Page will load normally

## Testing

After adding the image:
1. Refresh the homepage
2. Move your mouse around to see parallax effect
3. Check that image is visible at 30% opacity
4. Verify smooth mouse tracking animation

## Example Images

You can use similar polygon/mesh backgrounds like:
- Geometric low-poly patterns
- Abstract network/connection patterns
- Gradient mesh backgrounds
- Particle/dot patterns
- Wireframe 3D shapes

The image will be:
- Scaled to 1.1x (for parallax movement)
- Shown at 30% opacity
- Covered with gradient overlays
- Moving subtly with mouse movement
