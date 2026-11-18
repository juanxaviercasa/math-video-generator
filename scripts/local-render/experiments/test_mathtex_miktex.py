import os
from pathlib import Path

for _miktex_bin in (
    Path.home() / "AppData" / "Local" / "Programs" / "MiKTeX" / "miktex" / "bin" / "x64",
    Path(r"C:\Program Files\MiKTeX\miktex\bin\x64"),
):
    if _miktex_bin.exists() and str(_miktex_bin) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = str(_miktex_bin) + os.pathsep + os.environ.get("PATH", "")

from manim import *

print("Testing MathTex with MiKTeX...")
try:
    tex = MathTex(r"x = \frac{-b \pm \sqrt{\Delta}}{2a}")
    print("SUCCESS: MathTex rendered successfully:", tex)
except Exception as e:
    print("ERROR rendering MathTex:", e)
    import traceback
    traceback.print_exc()
