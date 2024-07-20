
from gdsfactory.cross_section import Section
from networkx import center
from numpy import cumsum
from .generic_tech import LAYER_STACK, LAYER, LAYER_VIEWS

import gdsfactory as gf
import bson
# import .utils as utils
from .utils import *
from .constants import *
# from layers import *


def bend(r, wwg=.5, lwg=1, LAYER=LAYER, **kwargs):
    name = "bend"
    design = gf.Component()
    init = gf.Component()
    test = gf.Component()
    device = gf.Component()
    device = gf.Component("bend")
    prob = dict()

    # if lwg == 0:
    # lwg = 2*wwg
    lstub = lwg/2
    # Extrude the Path and the CrossSection
    wg1 = device << gf.path.extrude(gf.path.straight(
        length=lwg), layer=LAYER.WG, width=wwg)
    wg2 = device << gf.path.extrude(gf.path.straight(
        length=lwg), layer=LAYER.WG, width=wwg)
    arc = device << gf.path.extrude(gf.path.arc(
        r, start_angle=0), layer=LAYER.WG, width=wwg)

    ld = wd = 2*r
    design.add_polygon([(0, 0), (ld, 0), (ld, wd), (0, wd)],
                       layer=LAYER.DESIGN)
    design.add_port(name="o1", center=(0, r), width=wwg,
                    orientation=180, layer=LAYER.WG)
    design.add_port(name="o2", center=(r, 0), width=wwg,
                    orientation=-90, layer=LAYER.WG)
    design = device << design

    wg1.connect("o2", design.ports["o1"])
    wg2.connect("o2", design.ports["o2"])
    arc.connect("o1", wg2.ports["o2"])

    device.add_port("o1", port=wg1.ports["o1"])
    device.add_port("o2", port=wg2.ports["o1"])

    # utils.write_img("device", device, DESIGN)
    # utils.write_img("guess", init, DESIGN)
    c = add_bbox(device, layers=[LAYER.WGCLAD, LAYER.BOX],
                 nonport_margin=0.1)
    return c


def mimo(west=0, east=0, south=0, north=0,
         l=2.0, w=2.0, wwg=.5,
         wwg_west=None, wwg_east=None, wwg_south=None, wwg_north=None,
         layer_wg=LAYER.WG, layer_wgclad=LAYER.WGCLAD, layer_box=LAYER.BOX, layer_design=LAYER.DESIGN,
         **kwargs):
    design = gf.Component()

    c = gf.Component()
    lwg = 4*wwg
    p = [(0, 0), (l, 0), (l, w), (0, w)]
    design.add_polygon(p,                       layer=layer_design)
    c.add_polygon(p,                       layer=layer_wg)

    ld = [west,  east, south, north]
    for i, v, d in zip(range(4), ld, [w, w, l, l]):
        if type(v) is int:
            ld[i] = [(.5+j)*d/v for j in range(v)]
    lwwg = [wwg_west, wwg_east, wwg_south, wwg_north]
    for i, v in enumerate(lwwg):
        if v is None:
            v = wwg
        if type(v) is float or type(v) is int:
            lwwg[i] = [v]*len(ld[i])

    n = 0
    for (i, x, y, d, wwg, a) in zip(
        range(4),
        [0,  l, 0, 0],
        [0, 0, 0, w],
        ld,
        lwwg,
        [180, 0, -90, 90]
    ):
        for wwg, v in zip(wwg, cumsum(d)):
            center = (x, y+v) if i in [0, 1] else (x+v, y)
            name = "o"+str(n+1)
            design.add_port(name=name, center=center, width=wwg,
                            orientation=a, layer=layer_wg)
            wg = c << gf.components.straight(
                length=lwg, width=wwg, layer=layer_wg)
            wg.connect("o2", design.ports[name])
            c.add_port(name=name, port=wg.ports["o1"])
            n += 1

    design = c << design
    c = add_bbox(c, layers=[layer_wgclad, layer_box],
                 nonport_margin=.1)
    return c


# def ubend_template(r, l, wwg, lwg=0,
    #                wavelength=1.55, dx=0.05,
    #                #    ϵcore=ϵcore, ϵclad=ϵclad,
    #                dir="", init=None, lmin=0.1, LAYER=LAYER, **kwargs):
    # name = "ubend"
    # design = gf.Component("design")
    # device = gf.Component("ubend")
    # λ = wavelength

    # if lwg == 0:
    #     lwg = 4*wwg

    # # Extrude the Path and the CrossSection
    # wg1 = device << gf.path.extrude(gf.path.straight(
    #     length=lwg), layer=LAYER.WG, width=wwg)
    # wg2 = device << gf.path.extrude(gf.path.straight(
    #     length=lwg), layer=LAYER.WG, width=wwg)

    # ld = l
    # wd = 2*r+wwg

    # design.add_polygon([(0, -wd/2), (ld, -wd/2), (ld, wd/2),
    #                     (0, wd/2)], layer=DESIGN)
    # if init is not None:
    #     xmin = design.xmin
    #     ymin = design.ymin
    #     init = design << init
    #     init.xmin = xmin
    #     init.ymin = ymin
    # else:
    #     init = gf.Component()
    #     init.add_polygon([(0, -wd/2), (ld, -wd/2), (ld, wd/2),
    #                       (0, wd/2)], layer=GUESS)
    #     init = design << init

    # design.add_port(name="o1", center=(0, r), width=wwg,
    #                 orientation=180, layer=LAYER.PORT)
    # design.add_port(name="o2", center=(0, -r), width=wwg,
    #                 orientation=180, layer=LAYER.PORT)
    # # design = device << design

    # wg1.connect("o2", design.ports["o1"], allow_layer_mismatch=True)
    # wg2.connect("o2", design.ports["o2"], allow_layer_mismatch=True)
    # # stub1.connect("o2", wg1.ports["o1"])
    # # stub2.connect("o2", wg2.ports["o1"])

    # device.add_port("o1", port=wg1.ports["o1"])
    # device.add_port("o2", port=wg2.ports["o1"])

    # # design = device << design
    # device.add_ref(design, name="design")
    # # device << gf.components.re
    # # device << test
    # device.show()
    # # init.show()
    # sources = {
    #     "o1": {
    #         "port": "o1",
    #         "wavelengths": [λ],
    #         "mode_numbers": [0],
    #         "powers": [1],
    #         "width": wwg,
    #         "endpoints": device.ports["o1"].endpoints.tolist(),
    #         "center": (device.ports["o1"].center),
    #         "orientation": device.ports["o1"].orientation,
    #     }}
    # for k in sources:
    #     a = sources[k]["orientation"]/180*pi
    #     normal = [cos(a), sin(a)]
    #     sources[k]["normal"] = normal
    #     sources[k]["center"] -= .001*np.array(normal)
    #     sources[k]["center"] = sources[k]["center"].flatten().tolist()

    # monitors = {
    #     "o2":        {
    #         "powers": [1],
    #         "wavelengths": [λ],
    #         "mode_numbers": [0],
    #         "port": "o2"},
    #     # {"power": 1,"wavelength": λ,"port": "o1"},
    # }
    # # device.metadata["sources"] = sources
    # # device.metadata["monitors"] = monitors
    # return device, sources, monitors, design