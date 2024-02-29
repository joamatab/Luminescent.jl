var documenterSearchIndex = {"docs":
[{"location":"guide/#","page":"-","title":"","text":"","category":"section"},{"location":"guide/","page":"-","title":"-","text":"Engineers run simulations to improve designs. Each time the design changes, the simulation is re-run. This can be done systematically in \"parameter sweeps\" where different combinations of parameter values are simulated to determine the best design. However, this scales exponentially wrt the number of parameters or DOFs. ","category":"page"},{"location":"guide/#General-workflow","page":"-","title":"General workflow","text":"","category":"section"},{"location":"guide/","page":"-","title":"-","text":"We use gradient descent, the same as in machine learning. In lieu of optimizing neural network parameters, we're optimizing geometry (or source) parameters. In each training iteration, we generate geometry, run the simulation, calculate the objective metric, and do a backward pass to derive the gradient wrt the geometry parameters. We then do a gradient based parameter update in preparation for the next iteration.","category":"page"},{"location":"guide/","page":"-","title":"-","text":"The geometry is thus the first step3. It typically has a static component which we can't change such as interfacing waveguides. Then there's a design component which we can change or optimize. The user is responsible for generating the design geometry wrt design parameters. If any pattern is allowed in the design region, our sister package Jello.jl can be used as a length scale controlled geometry generator. In any case, the result needs to be a 2d/3d array of each relevant materials property eg permitivity. ","category":"page"},{"location":"guide/","page":"-","title":"-","text":"With geometry ready, we can run the simulation. Duration is roughly the time it takes to reach steady state, such as how long it take for the signal to reach output port. The objective is usually a steady state metric which can be computed using values from the final period.  We optimize geometry for some objective. ","category":"page"},{"location":"#Home","page":"Home","title":"Home","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Currently Prerelease. Expect breaking changes. Report bugs on (Github )[ https://github.com/paulxshen/FDTDEngine.jl] - we usually respond within a day","category":"page"},{"location":"#Overview","page":"Home","title":"Overview","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Generative design meets Maxwell's Equations. Differentiable FDTD package for inverse design & topology optimization in semiconductor photonics, acoustics and RF. GPU and automatic differentiation (AD) compatible. Uses AD by Zygote.jl for adjoint optimization. Integrates with Jello.jl to generate length scale controlled paramaterized geometry . Staggered Yee grid update with fully featured boundary conditions & sources. Customizable physics to potentially incorporate dynamics like heat transfer, charge transport.","category":"page"},{"location":"#Gallery","page":"Home","title":"Gallery","text":"","category":"section"},{"location":"#Quarter-wavelength-antenna-radiating-above-conductive-ground-plane","page":"Home","title":"Quarter wavelength antenna radiating above conductive ground plane","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"(Image: )","category":"page"},{"location":"#Simulation-of-coupling-into-dielectric-slab-waveguide-using-modal-source","page":"Home","title":"Simulation of coupling into dielectric slab waveguide using modal source","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"(Image: )","category":"page"},{"location":"#Simulation-of-plane-wave-scattering-on-Periodic-array","page":"Home","title":"Simulation of plane wave scattering on Periodic array","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"(Image: )","category":"page"},{"location":"#Generative-Inverse-design-of-compact-silicon-photonics-splitter","page":"Home","title":"Generative Inverse design of compact silicon photonics splitter","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"(Image: )","category":"page"},{"location":"#Installation","page":"Home","title":"Installation","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Install via ","category":"page"},{"location":"","page":"Home","title":"Home","text":"Pkg.add(url=\"https://github.com/paulxshen/FDTDEngine.jl\")\nPkg.add(url=\"https://github.com/paulxshen/FDTDToolkit.jl\")","category":"page"},{"location":"","page":"Home","title":"Home","text":"FDTDToolkit.jl contains visualization utilities","category":"page"},{"location":"#Quickstart","page":"Home","title":"Quickstart","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"We do a quick 3d simulation of plane wave scattering on periodic array of dielectric spheres (see gallery movie)","category":"page"},{"location":"","page":"Home","title":"Home","text":"\"\"\"\nsimulation of plane wave scattering on periodic array of dielectric spheres\n\"\"\"\n\nusing UnPack, LinearAlgebra, GLMakie\n# using FDTDEngine,FDTDToolkit\ndir = pwd()\ninclude(\"$(dir)/src/main.jl\")\ninclude(\"$dir/../FDTDToolkit.jl/src/main.jl\")\n\n\nname = \"3d_scattering\"\nT = 8.0f0 # simulation duration in [periods]\nnx = 16\ndx = 1.0f0 / nx # pixel resolution in [wavelengths]\n\n\"geometry\"\nl = 2 # domain physical size length\nsz = nx .* (l, l, l) # domain voxel dimensions\nϵ1 = ϵmin = 1 #\nϵ2 = 2.25f0 # \nb = F.([norm(v .- sz ./ 2) < 0.5 / dx for v = Base.product(Base.oneto.(sz)...)]) # sphere\nϵ = ϵ2 * b + ϵ1 * (1 .- b)\n\n\"setup\"\nboundaries = [Periodic(2), Periodic(3)]# unspecified boundaries default to PML\nsources = [\n    PlaneWave(t -> cos(F(2π) * t), -1; Jz=1) # Jz excited plane wave from -x plane (eg -1)\n]\nn = [1, 0, 0] # normal \nδ = 0.2f0 # margin\n# A = (l - δ)^2\nlm = 1 # monitor side length\nmonitors = [\n    Monitor([δ, l / 2, l / 2], [0, lm, lm], n,), # (center, dimensions, normal)\n    Monitor([l - δ, l / 2, l / 2], [0, lm, lm], n,),\n]\nconfigs = setup(boundaries, sources, monitors, dx, sz; ϵmin, T)\n@unpack μ, σ, σm, dt, geometry_padding, geometry_splits, field_padding, source_instances, monitor_instances, u0, = configs\n\nϵ, μ, σ, σm = apply(geometry_padding; ϵ, μ, σ, σm)\np = apply(geometry_splits; ϵ, μ, σ, σm)\n\n\n# run simulation\nt = 0:dt:T\nu = [[similar.(a) for a = u0] for t = t]\nu[1] = u0\n@showtime reduce(\n    (u, (u1, t)) -> step3!(u1, u, p, t, dx, dt, field_padding, source_instances),\n    zip(u[2:end], t[1:end-1]),\n    init=u0)\ny = hcat([power.((m,), u) for m = monitor_instances]...)\n\n# make movie\nEz = map(u) do u\n    u[1][3]\nend\nϵz = p[1][3]\ndir = @__DIR__\n\nrecordsim(\"$dir/$(name)_nres_$nx.mp4\", Ez, y;\n    dt,\n    monitor_instances,\n    source_instances,\n    geometry=ϵz,\n    elevation=30°,\n    playback=1,\n    axis1=(; title=\"$name\\nEz\"),\n    axis2=(; title=\"monitor powers\"),\n)\n","category":"page"},{"location":"#Guide","page":"Home","title":"Guide","text":"","category":"section"},{"location":"#Implementation","page":"Home","title":"Implementation","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"<!– Supports 1d (Ez, Hy), 2d TMz (Ez, Hx, Hy), 2d TEz (Hz, Ex, Ey) and 3d. –>  Length and time are in units of wavelength and period. This normalization allows usage of relative  permitivity and permeability  in equations . Fields including electric, magnetic and current density are simply bundled as a vector of vectors of arrays . Boundary conditions pad the field arrays . PML paddings are multilayered, while All other boundaries add single layers. Paddings are stateful and permanent, increasing the size of field and geometry arrays.  Finite differencing happens every update step3 and are coordinated to implictly implement a staggered Yee's grid .","category":"page"},{"location":"#Sources","page":"Home","title":"Sources","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"If a source has fewer nonzero dimensions than the simulation domain, its signal will get normalized along its singleton dimensions. For example, all planar sources in 3d or line sources in 2d will get scaled up by a factor of 1/dx. This way, discretisation would not affect radiated power.","category":"page"},{"location":"","page":"Home","title":"Home","text":"PlaneWave\nSource","category":"page"},{"location":"#Main.FDTDEngine.PlaneWave","page":"Home","title":"Main.FDTDEngine.PlaneWave","text":"function PlaneWave(f, dims; fields...)\n\nConstructs plane wave source\n\nArgs\n\nf: time function\ndims: eg -1 for wave coming from -x face\nfields: which fields to excite & their scaling constants (typically a current source, eg Jz=1)\n\n\n\n\n\n","category":"type"},{"location":"#Main.FDTDEngine.Source","page":"Home","title":"Main.FDTDEngine.Source","text":"function Source(f, c, lb, ub, label=\"\"; fields...)\nfunction Source(f, c, L, label=\"\"; fields...)\n\nConstructs custom  source. Can be used to specify uniform or modal sources\n\nArgs\n\nf: time function\nc: origin or center of source\nlb: lower bounds wrt to c\nub: upper bounds wrt to c\nL: source dimensions in [wavelengths]\nfields: which fields to excite & their scaling constants (typically a current source, eg Jz=1)\n\n\n\n\n\n","category":"type"},{"location":"","page":"Home","title":"Home","text":"<!– GaussianBeam –>","category":"page"},{"location":"#Boundaries","page":"Home","title":"Boundaries","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Unspecified boundaries default to PML ","category":"page"},{"location":"","page":"Home","title":"Home","text":"Periodic\nPML\nPEC\nPMC","category":"page"},{"location":"#Main.FDTDEngine.Periodic","page":"Home","title":"Main.FDTDEngine.Periodic","text":"Periodic(dims)\n\nperiodic boundary\n\n\n\n\n\n","category":"type"},{"location":"#Main.FDTDEngine.PML","page":"Home","title":"Main.FDTDEngine.PML","text":"function PML(dims, d=0.25f0, σ=20.0f0)\n\nConstructs perfectly matched layers (PML aka ABC, RBC) boundary of depth d wavelengths  Doesn't need to be explictly declared as all unspecified boundaries default to PML\n\n\n\n\n\n","category":"type"},{"location":"#Main.FDTDEngine.PEC","page":"Home","title":"Main.FDTDEngine.PEC","text":"PEC(dims)\n\nperfect electrical conductor dims: eg -1 for -x side\n\n\n\n\n\n","category":"type"},{"location":"#Main.FDTDEngine.PMC","page":"Home","title":"Main.FDTDEngine.PMC","text":"PMC(dims)\n\nperfect magnetic conductor\n\n\n\n\n\n","category":"type"},{"location":"#Monitors","page":"Home","title":"Monitors","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Monitor\npower\npower_density","category":"page"},{"location":"#Main.FDTDEngine.Monitor","page":"Home","title":"Main.FDTDEngine.Monitor","text":"function Monitor(c, L; normal=nothing, label=\"\")\nfunction Monitor(c, lb, ub; normal=nothing, label=\"\")\n\nConstructs monitor which can span a point, line, surface, or volume monitoring fields or power. \n\nArgs\n\nc: origin or center of monitor\nL: physical dimensions of monitor\nlb: lower bounds wrt to c\nub: upper bounds wrt to c\nnormal: flux monitor direction (eg normal to flux surface)\n\n\n\n\n\n","category":"type"},{"location":"#Main.FDTDEngine.power","page":"Home","title":"Main.FDTDEngine.power","text":"function power(m::MonitorInstance, u)\n\ntotal power (Poynting flux) passing thru monitor surface\n\n\n\n\n\n","category":"function"},{"location":"#Main.FDTDEngine.power_density","page":"Home","title":"Main.FDTDEngine.power_density","text":"function power_density(m::MonitorInstance, u)\n\npower density (avg Poynting flux) passing thru monitor surface\n\n\n\n\n\n","category":"function"},{"location":"#Physics","page":"Home","title":"Physics","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"step3!\nstep3","category":"page"},{"location":"#Main.FDTDEngine.step3!","page":"Home","title":"Main.FDTDEngine.step3!","text":"function step3!(u, p, t, field_padding, source_instances)\nfunction step3!(u1, u, p, t, field_padding, source_instances)\n\nUpdates fields for 3d. Please use step3 instead of step3! when doing AD. Mutating step3! Writes new fields either onto old fields or into buffer arrays u1\n\n\n\n\n\n","category":"function"},{"location":"#Main.FDTDEngine.step3","page":"Home","title":"Main.FDTDEngine.step3","text":"function step3(u, p, t, field_padding, source_instances)\n\nUpdates fields for 3d in a manner amenable to AD. See also Mutating step3!\n\n\n\n\n\n","category":"function"},{"location":"","page":"Home","title":"Home","text":"<!– step1 –> <!– stepTMz –> <!– stepTEz –>","category":"page"},{"location":"#GPU-support","page":"Home","title":"GPU support","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Simply use Flux.gpu to move simulation variables to GPU. This turns Arrays into CUDA arrays which get processed on GPU for both forward and backpropagation passes","category":"page"},{"location":"#Automatic-differentiation-adjoints","page":"Home","title":"Automatic differentiation adjoints","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Compatible with Zygote.jl and Flux.jl. Please use step3 instead of step3! when doing AD. See inverse design examples ","category":"page"},{"location":"#Generative-inverse-design","page":"Home","title":"Generative inverse design","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Please contact us for latest scripts. We wrote (Jello.jl)[https://github.com/paulxshen/Jello.jl], an innovative Fourier domain neural model to generate length scale controlled efficiently  paramaterized geometry .","category":"page"},{"location":"#Comparison-with-other-FDTD-software","page":"Home","title":"Comparison with other FDTD software","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Our focus is on inverse design and topology optimization using adjoints from automatic differentiation. We love a streamlined API backed by a clear, concise and extensible codebase. Attention is paid to speed and malloc but that's not our main concern. Meep is the most popular open source  FDTD package owing to its maturity and comprehensive features. It supports AD in certain cases using custom adjoints which we avoid in our package in favor of more flexibility . There are numerous commercial software eg Ansys Lumerical, Comsol and various EDA or SI software. TMK none of them supports AD for inverse design ","category":"page"},{"location":"#Tutorials","page":"Home","title":"Tutorials","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"see (examples/)[https://github.com/paulxshen/FDTDEngine.jl/blob/main/examples/]","category":"page"},{"location":"#People","page":"Home","title":"People","text":"","category":"section"},{"location":"#Community","page":"Home","title":"Community","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Discussion & updates at Julia Discourse","category":"page"},{"location":"#Contributors","page":"Home","title":"Contributors","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Paul Shen <pxshen@alumni.stanford.edu> Consulting and technical support available  2024 (c) Paul Shen","category":"page"}]
}
