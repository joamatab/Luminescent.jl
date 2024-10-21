import luminescent as lumi
from luminescent import MATERIALS
from gdsfactory.generic_tech import LAYER, LAYER_STACK
import gdsfactory as gf
import pprint as pp

c = gf.components.bend_euler(5)
c = gf.components.bend_circular(5)
c.plot()
gf.export.to_stl(c, "demo.stl")
sol = lumi.write_sparams(c, name="bend", wavelength=1.55, keys=["2,1"],  # same as keys=["o2@0,o1@0"]
                         core_layer=LAYER.WG,   bbox_layer=LAYER.WAFER,  # defaults
                         layer_stack=LAYER_STACK, materials=MATERIALS,  # defaults
                         dx=0.1, approx_2D=True, run=False)
# lumi.show_solution()
