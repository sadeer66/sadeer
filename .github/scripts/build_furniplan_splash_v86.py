from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

root=Path('.')
src=root/'assets'/'furniplan-splash-v74.webp'
out=root/'assets'/'furniplan-splash-hq-v86.png'

im=Image.open(src).convert('RGB')

# High-quality upscale to a true desktop/iPad-friendly 16:9 canvas.
target=(3200,1800)
im=im.resize(target, Image.Resampling.LANCZOS)

# Recover a little crispness lost by the old highly-compressed web image.
im=ImageEnhance.Contrast(im).enhance(1.035)
im=ImageEnhance.Sharpness(im).enhance(1.35)
im=im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=105, threshold=3))

out.parent.mkdir(parents=True,exist_ok=True)
im.save(out,'PNG',optimize=True)
print(out, out.stat().st_size)
