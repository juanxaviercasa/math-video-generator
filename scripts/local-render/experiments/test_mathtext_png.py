import matplotlib.pyplot as plt
from manim import *

fig = plt.figure(figsize=(8, 2), dpi=300)
fig.patch.set_alpha(0.0)
ax = fig.add_axes([0, 0, 1, 1])
ax.axis('off')
ax.patch.set_alpha(0.0)
ax.text(0.5, 0.5, r"$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$", size=26, color='white', ha='center', va='center')
fig.savefig('test_latex_dpi.png', format='png', transparent=True, bbox_inches='tight', pad_inches=0.05)
plt.close(fig)

img = ImageMobject('test_latex_dpi.png')
print('SUCCESS! ImageMobject created:', img.height, img.width)
