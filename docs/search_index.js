var documenterSearchIndex = {"docs":
[{"location":"guide/#Guide","page":"Guide","title":"Guide","text":"","category":"section"},{"location":"guide/#Implementation","page":"Guide","title":"Implementation","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"Supports 1d (Ez, Hy), 2d TE (Hz, Ex, Ey), 2d TM (Ez, Hx, Hy), and 3d. Length and time are in units of wavelength and period. This normalization allows usage of relative  permitivity and permeability  in equations . Fields including electric, magnetic and current density are simply bundled as a vector of vectors of arrays . Boundary conditions pad the field arrays . PML paddings are multilayered, while All other boundaries add single layers. Paddings are stateful and permanent, increasing the size of field and geometry arrays.  Finite differencing happens every update maxwell_update and are coordinated to implictly implement a staggered Yee's grid .","category":"page"},{"location":"guide/#Sources","page":"Guide","title":"Sources","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"We support plane waves and custom  (eg modal) sources . A source has a time signal and a spatial profile . Both can be complex valued in which case the real component is taken from product of the two. Set excited current fields and their spatial profiles as keywords . A profile can be constant , a spatial function , or an array . In the case of array, it'll get resized automatically to fit the source 's spatial extent (spanning from lower bounds lb to upper bounds ub). ","category":"page"},{"location":"guide/","page":"Guide","title":"Guide","text":"If a source has fewer nonzero dimensions (from ub - lb) than the simulation domain, its signal will get normalized along its singleton dimensions. For example, all planar sources in 3d will get scaled up by a factor of 1/dx. This way, discretisation would not affect radiated power.","category":"page"},{"location":"guide/","page":"Guide","title":"Guide","text":"PlaneWave\nSource","category":"page"},{"location":"guide/#PlaneWave","page":"Guide","title":"PlaneWave","text":"function PlaneWave(f, dims; fields...)\n\nConstructs plane wave source\n\nArgs\n\nf: time function\ndims: eg -1 for wave coming from -x face\nfields: which fields to excite & their scaling constants (typically a current source, eg Jz=1)\n\n\n\n\n\n","category":"type"},{"location":"guide/#Source","page":"Guide","title":"Source","text":"function Source(f, c, lb, ub, label=\"\"; fields...)\nfunction Source(f, c, L, label=\"\"; fields...)\n\nConstructs custom  source. Can be used to specify uniform or modal sources\n\nArgs\n\nf: time function\nc: origin or center of source\nlb: lower bounds wrt to c\nub: upper bounds wrt to c\nL: source dimensions in [wavelengths]\nfields: which fields to excite & their scaling constants (typically a current source, eg Jz=1)\n\n\n\n\n\n","category":"type"},{"location":"guide/#Boundaries","page":"Guide","title":"Boundaries","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"Unspecified boundaries default to PML ","category":"page"},{"location":"guide/","page":"Guide","title":"Guide","text":"Periodic\nPML\nPEC\nPMC","category":"page"},{"location":"guide/#Periodic","page":"Guide","title":"Periodic","text":"Periodic(dims)\n\nperiodic boundary\n\n\n\n\n\n","category":"type"},{"location":"guide/#PML","page":"Guide","title":"PML","text":"function PML(dims, d=0.25f0, σ=20.0f0)\n\nConstructs perfectly matched layers (PML aka ABC, RBC) boundary of depth `d` wavelengths \nDoesn't need to be explictly declared as all unspecified boundaries default to PML\n\n\n\n\n\n","category":"type"},{"location":"guide/#PEC","page":"Guide","title":"PEC","text":"PEC(dims)\n\nperfect electrical conductor dims: eg -1 for -x side\n\n\n\n\n\n","category":"type"},{"location":"guide/#PMC","page":"Guide","title":"PMC","text":"PMC(dims)\n\nperfect magnetic conductor\n\n\n\n\n\n","category":"type"},{"location":"guide/#Monitors","page":"Guide","title":"Monitors","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"Monitor\nfield\npower\nflux","category":"page"},{"location":"guide/#Monitor","page":"Guide","title":"Monitor","text":"function Monitor(c, L; normal=nothing, label=\"\")\nfunction Monitor(c, lb, ub; normal=nothing, label=\"\")\n\nConstructs monitor which can span a point, line, surface, volume or point cloud monitoring fields or power. \n\nArgs\n\nc: origin or center of monitor\nL: physical dimensions of monitor\nlb: lower bounds wrt to c\nub: upper bounds wrt to c\nnormal: flux monitor direction (eg normal to flux surface)\n\n\n\n\n\n","category":"function"},{"location":"guide/#field","page":"Guide","title":"field","text":"function field(u, k)\nfunction field(u, k, m)\n\nqueries field, optionally at monitor instance m\n\nArgs\n\nu: state\nk: symbol or str of Ex, Ey, Ez, Hx, Hy, Hz, |E|, |E|2, |H|, |H|2\nm\n\n\n\n\n\n","category":"function"},{"location":"guide/#power","page":"Guide","title":"power","text":"function power(m::MonitorInstance, u)\n\ntotal power (Poynting flux) passing thru monitor surface\n\n\n\n\n\n","category":"function"},{"location":"guide/#flux","page":"Guide","title":"flux","text":"function flux(m::MonitorInstance, u)\n\nPoynting flux profile passing thru monitor \n\n\n\n\n\n","category":"function"},{"location":"guide/#Physics","page":"Guide","title":"Physics","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"maxwell_update!\nmaxwell_update","category":"page"},{"location":"guide/#maxwell_update!","page":"Guide","title":"maxwell_update!","text":"function maxwell_update!(u, p, t, field_padding, source_instances)\nfunction maxwell_update!(u1, u, p, t, field_padding, source_instances)\n\nUpdates fields for 3d. Please use maxwell_update instead of maxwell_update! when doing AD. Mutating maxwell_update! Writes new fields either onto old fields or into buffer arrays u1\n\n\n\n\n\n","category":"function"},{"location":"guide/#maxwell_update","page":"Guide","title":"maxwell_update","text":"function maxwell_update(u, p, t, field_padding, source_instances)\n\nUpdates fields for 3d in a manner amenable to AD. See also Mutating maxwell_update!\n\n\n\n\n\n","category":"function"},{"location":"guide/#GPU-support","page":"Guide","title":"GPU support","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"Simply use Flux.gpu to move simulation variables to GPU. This turns Arrays into CUDA arrays which get processed on GPU for both forward and backpropagation passes","category":"page"},{"location":"guide/#Automatic-differentiation-adjoints","page":"Guide","title":"Automatic differentiation adjoints","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"Compatible with Zygote.jl and Flux.jl. Please use maxwell_update instead of maxwell_update! when doing AD. See inverse design examples ","category":"page"},{"location":"guide/#Generative-inverse-design","page":"Guide","title":"Generative inverse design","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"Please contact us for latest scripts. We wrote Jello.jl, an innovative neural model to generate length scale controlled, efficiently  paramaterized geometry .","category":"page"},{"location":"guide/#Comparison-with-other-FDTD-software","page":"Guide","title":"Comparison with other FDTD software","text":"","category":"section"},{"location":"guide/","page":"Guide","title":"Guide","text":"Our focus is on inverse design and topology optimization using adjoints from automatic differentiation. We love a streamlined API backed by a clear, concise and extensible codebase. Attention is paid to speed and malloc but that's not our main concern. Meep is the most popular open source  FDTD package owing to its maturity and comprehensive features. It supports AD in certain cases using custom adjoints which we avoid in our package in favor of more flexibility . There are numerous commercial software eg Ansys Lumerical, Comsol and various EDA or SI software. TMK none of them supports AD for inverse design ","category":"page"},{"location":"tutorials/#Tutorials","page":"Tutorials","title":"Tutorials","text":"","category":"section"},{"location":"tutorials/","page":"Tutorials","title":"Tutorials","text":"see examples/","category":"page"},{"location":"inverse_design_waveguide_bend/#Inverse-Design-Waveguide-Bend","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"","category":"section"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"Complete file at examples folder","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We do inverse design of a compact photonic waveguide bend to demonstrate workflow of FDTD adjoint optimization. First, we seed the design using 2d TE adjoint simulations which serve as fast approximations. Optionlly, we finetune the resulting design in full blown 3d adjoint simulations.","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\nusing UnPack, LinearAlgebra, Random, StatsBase, Dates\nusing Zygote, Flux, CUDA, GLMakie, Jello\nusing Flux: mae, Adam\nusing Zygote: withgradient, Buffer\nusing BSON: @save, @load\nusing AbbreviatedStackTraces\nusing Jello, Luminescent, LuminescentVisualization\nRandom.seed!(1)\n\n# if running directly without module # hide\n# include(\"$(pwd())/src/main.jl\") # hide\n# include(\"$(pwd())/../LuminescentVisualization.jl/src/main.jl\") # hide","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We skip 3d finetuning as it's 20x more compute and memory intensive than 2d adjoints. If wishing to do 3d finetuning, set iterations3d. In any case, 3d forward simulations (without adjoint) only take a few seconds.","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"name = \"inverse_design_waveguide_bend\"\niterations2d = 10\niterations3d = 0\nrecord2d = true\nrecord3d = false\nF = Float32\nongpu = false\nmodel_name = nothing # if load saved model","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We load design layout which includes a 2d static_mask of static waveguide geometry as well as variables with locations of ports, sources, design regions and material properties.","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\n@load \"$(@__DIR__)/layout.bson\" static_mask sources ports designs λ dx ϵbase ϵclad ϵcore hbase hwg hclad\ndx, = [dx,] / λ","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We initialize a Jello.jl Blob object which will generate geometry of design region. Its parameters will get optimized during adjoint optimization. We initialize it with a straight slab connecting input to output port.","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\nszd = Tuple(round.(Int, designs[1].L / λ / dx) .+ 1) # design region size\nif isnothing(model_name)\n    nbasis = 5 # complexity of design region\n    contrast = 10 # edge sharpness \n    rmin = nothing\n    init = [-1 -1 1 -1 -1; -1 1 1 -1 -1; 1 1 -1 -1 -1; -1 -1 -1 -1 -1; -1 -1 -1 -1 -1]\n    # init = nothing # random \n    # init = 1 # uniform slab\n    model = Blob(szd...; init, nbasis, contrast, rmin,)\nelse\n    @load \"$(@__DIR__)/$model_name\" model\nend\nmodel0 = deepcopy(model)\nheatmap(model())","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We set key time intervals. The signal must first propagate to port 2 after which all port power fluxes will get monitored","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\nΔ = zeros(2)\n# Δ[1] = 1\nΔ[1] = 2 + 1.6norm(sources[1].c - ports[2].c) / λ * sqrt(ϵcore) # simulation duration in [periods] for signal to reach output ports\nΔ[2] = 2 # duration to record power at output ports\nT = cumsum(Δ)","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We set boundary conditions, sources , and monitor. The modal source profile is obtained from external mode solver , in our case VectorModesolver.jl . Please refer to guide section of docs website for details . To get an approximate  line source for use in 2d from the cross section profile , we sum and collapse it along its height axis","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\nboundaries = [] # unspecified boundaries default to PML\nmonitors = [\n    # (center, lower bound, upper bound; normal)\n    Monitor(p.c / λ, p.lb / λ, p.ub / λ; normal=p.n)\n    for p = ports\n]\n\n# modal source\n@unpack Ex, Ey, Ez, Hx, Hy, Hz = sources[1].modes[1]\nJy, Jx, Mz = map([Ex, Ez, Hy]) do a\n    transpose(sum(a, dims=2))\nend\nJy, Jx = [Jy, Jx] / maximum(maximum.(abs, [Jy, Jx]))\nc = sources[1].c / λ\nlb_ = [0, sources[1].lb[1]] / λ\nub_ = [0, sources[1].ub[1]] / λ\nsources = [Source(t -> cispi(2t), c, lb_, ub_; Jx, Jy,)]\n\nϵmin = ϵclad\nstatic_mask = F.(static_mask)\nϵbase, ϵcore, ϵclad = F.((ϵbase, ϵcore, ϵclad))\nsz = size(static_mask)\n\nconfigs = maxwell_setup(boundaries, sources, monitors, dx, sz; F, ϵmin)\n@unpack dx, dt, sz, geometry_padding, subpixel_averaging, field_padding, source_instances, monitor_instances, u0, = prob\n\n# n = (size(Jy) .- size(monitor_instances[1])) .÷ 2\n# power_profile = F.(abs.(Jy[range.(1 .+ n, size(Jy) .- n)...]))\npower_profile = F.(real.(Jy .* conj.(Mz)))\npower_profile /= norm(power_profile)\n\nif ongpu\n    using Flux\n    # using CUDA\n    # @assert CUDA.functional()\n    u0, model, static_mask, μ, σ, σm, field_padding, source_instances =\n        gpu.((u0, model, static_mask, μ, σ, σm, field_padding, source_instances))\n    merge!(prob, (; u0, field_padding, source_instances))\nend","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We define a geometry update function that'll be called each adjoint iteration. It calls geometry generator model to generate design region which gets placed onto mask of static features.","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"function make_geometry(model, static_mask, prob)#; make3d=false)\n    @unpack sz, geometry_padding, subpixel_averaging = prob\n    μ = ones(F, sz)\n    σ = zeros(F, sz)\n    σm = zeros(F, sz)\n    # μ = 1\n    # σ = σm = 0\n\n    mask_ = Zygote.Buffer(static_mask)\n    mask_[:, :] = static_mask\n    # place!(mask_, σ.(model), round.(Int, designs[1].o / λ / dx) .+ 1)\n    place!(mask_, model(), round.(Int, designs[1].o / λ / dx) .+ 1)\n    mask = copy(mask_)\n    ϵ = mask * ϵcore + (1 .- mask) * ϵclad\n\n    if length(sz) == 3\n        ϵ = sandwich(ϵ, round.(Int, [hbase, hwg, hclad] / λ / dx)..., ϵbase, ϵclad)\n    end\n\n    p = apply(geometry_padding; ϵ, μ, σ, σm)\n    p = apply(subpixel_averaging, p)\nend","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"Optimal design will maximize powers into port 1 and out of port 2. Monitor normals were set so both are positive. metrics function compute these figures of merit (FOM) quantities by a differentiable FDTD simulation . loss is then defined accordingly ","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\nfunction metrics(model, prob; autodiff=true, history=nothing)\n    p = make_geometry(model, static_mask, prob;)\n    if !isnothing(history)\n        ignore_derivatives() do\n            push!(history, p[:ϵ])\n        end\n    end\n    @unpack u0, field_padding, source_instances, monitor_instances = prob\n    # run simulation\n    _step = if autodiff\n        maxwell_update\n    else\n        maxwell_update!\n    end\n    u = reduce((u, t) -> _step(u, p, t, dx, dt, field_padding, source_instances;), 0:dt:T[1], init=deepcopy(u0))\n    port_fluxes = reduce(T[1]+dt:dt:T[2], init=(u, 0)) do (u, port_fluxes), t\n        _step(u, p, t, dx, dt, field_padding, source_instances),\n        port_fluxes + dt * flux.((u,), monitor_instances[1:2],)\n    end[2] / Δ[2]\n\n    A = area.(monitor_instances)\n    port_mode_powers = [mean(vec(a) .* vec(power_profile)) * A for (a, A) = zip(port_fluxes, A)]\n    port_powers = mean.(port_fluxes) .* A\n    # @info \"\" port_powers port_mode_powers\n    @show port_powers, port_mode_powers\n    # println(\"metrics $port_fluxes\")\n    abs.(port_mode_powers)\nend\n# @show const tp = metrics(model, T[1]=1, T[2]=2, autodiff=false)[1] # total power\n# error()\n\nfunction score(v)\n    sum(-v)\nend\n\n# p0 = make_geometry(model0, static_mask, μ, σ, σm)\nhistory = []\nloss = model -> score(metrics(model, prob; history))","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We now do adjoint optimization. The first few iterations may show very little change but will pick up momentum","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\nopt = Adam(0.1)\nopt_state = Flux.setup(opt, model)\n# iterations2d = 66\n# iterations2d = 400\nfor i = 1:iterations2d\n    println(\"$i\")\n    @time l, (dldm,) = withgradient(loss, model)\n    Flux.update!(opt_state, model, dldm)\n    println(\" $l\\n\")\nend\n@save \"$(@__DIR__)/2d_model_$(time()).bson\" model\n# error()","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We do a simulation movie using optimized geometry","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\n# @show metrics(model)\nfunction runsave(model, prob; kw...)\n    p = make_geometry(model, static_mask, prob)\n    @unpack u0, dx, dt, field_padding, source_instances, monitor_instances = prob\n    @showtime global u = accumulate((u, t) ->\n            maxwell_update!(deepcopy(u), p, t, dx, dt, field_padding, source_instances),\n        0:dt:T[2], init=u0)\n\n    # move to cpu for plotting\n    if ongpu\n        u, p, source_instances = cpu.((u, p, source_instances))\n    end\n    Hz = field.(u, :Hz)\n    ϵEy = field(p, :ϵEy)\n    dir = @__DIR__\n    d = ndims(Hz[1])\n    _name = \"$(d)d_$name\"\n    # error()\n    recordsim(\"$dir/$(_name).mp4\", Hz, ;\n        dt,\n        field=:Hz,\n        monitor_instances,\n        source_instances,\n        geometry=ϵEy,\n        rel_lims=0.5,\n        playback=1,\n        axis1=(; title=\"$(replace( _name,\"_\"=>\" \")|>titlecase)\"),\n        axis2=(; title=\"monitor powers\"),\n        kw...\n    )\n\nend\n\nrecord = model -> runsave(model, prob)\nrecord2d && record(model)","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"(Image: )","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"We now finetune our design in 3d by starting off with optimized model from 2d. We make 3d geometry simply by sandwiching thickened 2d mask between lower substrate and upper clad layers. ","category":"page"},{"location":"inverse_design_waveguide_bend/","page":"Inverse Design Waveguide Bend","title":"Inverse Design Waveguide Bend","text":"\nϵdummy = sandwich(static_mask, round.(Int, [hbase, hwg, hclad] / λ / dx)..., ϵbase, ϵclad)\nsz = size(ϵdummy)\nmodel2d = deepcopy(model)\n\n\n# \"monitors\"\nδ = 0.1 # margin\nmonitors = [Monitor([p.c / λ..., hbase / λ], [p.lb / λ..., -δ / λ], [p.ub / λ..., hwg / λ + δ / λ]; normal=[p.n..., 0]) for p = ports]\n\n# modal source\n@unpack Ex, Ey, Ez, = sources[1].modes[1]\nJy, Jz, Jx = map([Ex, Ey, Ez] / maximum(maximum.(abs, [Ex, Ey, Ez]))) do a\n    reshape(a, 1, size(a)...)\nend\nc = [sources[1].c / λ..., hbase / λ]\nlb = [0, sources[1].lb...] / λ\nub = [0, sources[1].ub...] / λ\nsources = [Source(t -> cispi(2t), c, lb, ub; Jx, Jy, Jz)]\n# sources = [Source(t -> cispi(2t), c, lb, ub; Jx=1)]\n\nconfigs = maxwell_setup(boundaries, sources, monitors, dx, sz; F, ϵmin, Courant=0.3)\nif ongpu\n    u0, model, static_mask, μ, σ, σm, field_padding, source_instances =\n        gpu.((u0, model, static_mask, μ, σ, σm, field_padding, source_instances))\n    merge!(prob, (; u0, field_padding, source_instances))\nend\n\n\nloss = model -> score(metrics(model, prob;))\nopt = Adam(0.1)\nopt_state = Flux.setup(opt, model)\nfor i = 1:iterations3d\n    @time l, (dldm,) = withgradient(loss, model)\n    Flux.update!(opt_state, model, dldm)\n    println(\"$i $l\")\nend\n@save \"$(@__DIR__)/3d_model_$(time()).bson\" model\n\n\nrecord = model -> runsave(model, prob; elevation=70°, azimuth=110°)\nrecord3d && record(model)","category":"page"},{"location":"assets/guide copy/#","page":"-","title":"","text":"","category":"section"},{"location":"assets/guide copy/","page":"-","title":"-","text":"Engineers run simulations to improve designs. Each time the design changes, the simulation is re-run. This can be done systematically in \"parameter sweeps\" where different combinations of parameter values are simulated to determine the best design. However, this scales exponentially wrt the number of parameters or DOFs. ","category":"page"},{"location":"assets/guide copy/#General-workflow","page":"-","title":"General workflow","text":"","category":"section"},{"location":"assets/guide copy/","page":"-","title":"-","text":"We use gradient descent, the same as in machine learning. In lieu of optimizing neural network parameters, we're optimizing geometry (or source) parameters. In each training iteration, we generate geometry, run the simulation, calculate the objective metric, and do a backward pass to derive the gradient wrt the geometry parameters. We then do a gradient based parameter update in preparation for the next iteration.","category":"page"},{"location":"assets/guide copy/","page":"-","title":"-","text":"The geometry is thus the first maxwell_update. It typically has a static component which we can't change such as interfacing waveguides. Then there's a design component which we can change or optimize. The user is responsible for generating the design geometry wrt design parameters. If any pattern is allowed in the design region, our sister package Jello.jl can be used as a length scale controlled geometry generator. In any case, the result needs to be a 2d/3d array of each relevant materials property eg permitivity. ","category":"page"},{"location":"assets/guide copy/","page":"-","title":"-","text":"With geometry ready, we can run the simulation. Duration is roughly the time it takes to reach steady state, such as how long it take for the signal to reach output port. The objective is usually a steady state metric which can be computed using values from the final period.  We optimize geometry for some objective. ","category":"page"},{"location":"people/#People","page":"People","title":"People","text":"","category":"section"},{"location":"people/#Community","page":"People","title":"Community","text":"","category":"section"},{"location":"people/","page":"People","title":"People","text":"Discussion & updates at Julia Discourse","category":"page"},{"location":"people/#Contributors","page":"People","title":"Contributors","text":"","category":"section"},{"location":"people/","page":"People","title":"People","text":"Paul Shen <pxshen@alumni.stanford.edu>  ","category":"page"},{"location":"people/","page":"People","title":"People","text":"Consulting and technical support available  ","category":"page"},{"location":"people/","page":"People","title":"People","text":"2024 (c) Paul Shen  ","category":"page"},{"location":"periodic_scattering/#Periodic-Scattering","page":"Periodic Scattering","title":"Periodic Scattering","text":"","category":"section"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"Complete file at examples folder","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"We simulate  plane wave scattering on periodic array of dielectric spheres","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"using UnPack, LinearAlgebra, GLMakie\nusing Luminescent, LuminescentVisualization\n\n# if running directly without module # hide\n# include(\"$(pwd())/src/main.jl\") # hide\n# include(\"$(pwd())/../LuminescentVisualization.jl/src/main.jl\") # hide","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"Set simulation duration and resolution.  Run on CPU by setting dogpu = false. If running on a newer GPU, set F = Float16","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"name = \"periodic_scattering\"\nT = 10 # simulation duration in [periods]\nnx = 20\ndx = 1.0 / nx # pixel resolution in [wavelengths]\ndogpu = false\nF = Float32","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"We make unit cell geometry containing a dielectric sphere. Each property is made an array","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"l = 2 # domain physical size length in [wavelengths]\nsz = nx .* (l, l, l) # domain voxel dimensions\n\nϵ1 = ϵmin = 1 #\nϵ2 = 2.25 # \nb = F.([norm(v .- sz ./ 2) < 0.5 / dx for v = Base.product(Base.oneto.(sz)...)]) # sphere\nϵ = ϵ2 * b + ϵ1 * (1 .- b)\n\n# μ = 1\nμ = ones(F, sz)\nσ = zeros(F, sz)\nσm = zeros(F, sz)","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"We setup boundary conditions, source and monitor surfaces","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"boundaries = [Periodic(2), Periodic(3)]# unspecified boundaries default to PML\nsources = [\n    PlaneWave(t -> cos(2π * t), -1; Jz=1) # Jz excited plane wave from -x plane (eg -1)\n]\nnormal = [1, 0, 0] #  \nδ = 0.2 # margin\nlm = 1 # monitor side length\nmonitors = [\n    Monitor([δ, l / 2, l / 2], [0, lm, lm]; normal), # (center, dimensions; normal)\n    Monitor([l - δ, l / 2, l / 2], [0, lm, lm]; normal),\n]","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"We do maxwell_setup to instantiate at the given discretisation. We adopt u, p, t naming conventions from ODE literature: u as state, p as params eg geometry","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"prob = maxwell_setup(boundaries, sources, monitors, dx, sz; ϵmin, F)\n@unpack dt, geometry_padding, subpixel_averaging, field_padding, source_instances, monitor_instances, u0, = prob\n\np = apply(geometry_padding; ϵ, μ, σ, σm)\np = apply(subpixel_averaging; p...)\n\n# move to gpu\nif dogpu\n    using Flux\n    # using CUDA\n    # @assert CUDA.functional()\n    u0, p, field_padding, source_instances = gpu.((u0, p, field_padding, source_instances))\nend","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"We run simulation as an accumulate loop. maxwell_update! applies Maxwells equations as staggered time stepping on E, H. It's mutating so a copy is made in order to save sequence of states","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"@showtime u = accumulate(0:dt:T, init=u0) do u, t\n    maxwell_update!(deepcopy(u), p, t, dx, dt, field_padding, source_instances)\nend\nport_powers = [power.(u, (m,),) for m = monitor_instances]\n\n# move back to cpu for plotting\nif dogpu\n    u, p, field_padding, source_instances = cpu.((u, p, field_padding, source_instances))\nend","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"Ready, set, action! We make movie, ","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"Ez = field.(u, :Ez)\nϵEz = field(p, :ϵEz)\ndir = @__DIR__\nrecordsim(\"$dir/$(name).mp4\", Ez, port_powers;\n    dt,\n    field=:Ez,\n    monitor_instances,\n    source_instances,\n    geometry=ϵEz,\n    elevation=30°,\n    playback=1,\n    axis1=(; title=\"$name\"),\n    axis2=(; title=\"monitor powers\"),\n)","category":"page"},{"location":"periodic_scattering/","page":"Periodic Scattering","title":"Periodic Scattering","text":"(Image: )","category":"page"},{"location":"#Home","page":"Home","title":"Home","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Prerelease. First stable release planned for April . Until then, accuracy not validated. Report bugs on Github - we usually respond within a day","category":"page"},{"location":"#Overview","page":"Home","title":"Overview","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Generative design meets Maxwell's Equations. GPU and automatic differentiation (AD) compatible FDTD package in Julia for inverse design & topology optimization in semiconductor photonics, acoustics and RF. Uses AD by Zygote.jl for adjoint optimization. Integrates with Jello.jl to generate length scale controlled paramaterized geometry . Staggered Yee grid update with fully featured boundary conditions & sources in 1d/2d/3d. Customizable physics to potentially incorporate dynamics like heat transfer, charge transport.","category":"page"},{"location":"#Gallery","page":"Home","title":"Gallery","text":"","category":"section"},{"location":"#Generative-Inverse-design-of-compact-silicon-photonics-splitter","page":"Home","title":"Generative Inverse design of compact silicon photonics splitter","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"(Image: )","category":"page"},{"location":"#Quarter-wavelength-antenna-radiating-above-conductive-ground-plane","page":"Home","title":"Quarter wavelength antenna radiating above conductive ground plane","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"(Image: )","category":"page"},{"location":"#Simulation-of-plane-wave-scattering-on-Periodic-array","page":"Home","title":"Simulation of plane wave scattering on Periodic array","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"(Image: ) Please star us on Github if you like our work :)","category":"page"},{"location":"#Installation","page":"Home","title":"Installation","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Install Julia preferably with VSCODE. Then add our package  via ","category":"page"},{"location":"","page":"Home","title":"Home","text":"using Pkg\nPkg.add(url=\"https://github.com/paulxshen/Luminescent.jl\")\nPkg.add(url=\"https://github.com/paulxshen/LuminescentVisualization.jl\")","category":"page"},{"location":"","page":"Home","title":"Home","text":"LuminescentVisualization.jl contains visualization utilities. If you're running tutorials also add","category":"page"},{"location":"","page":"Home","title":"Home","text":"]add UnPack, BSON,DataStructures, StatsBase, Zygote, Jello, GLMakie, CoordinateTransformations,AbbreviatedStackTraces,CUDA,Flux","category":"page"},{"location":"","page":"Home","title":"Home","text":"Omit CUDA if you don't have NVidia GPU","category":"page"},{"location":"#Quickstart","page":"Home","title":"Quickstart","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Please refer to the first tutorial ","category":"page"},{"location":"#People","page":"Home","title":"People","text":"","category":"section"},{"location":"#Community","page":"Home","title":"Community","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Discussion & updates at Julia Discourse","category":"page"},{"location":"#Contributors","page":"Home","title":"Contributors","text":"","category":"section"},{"location":"","page":"Home","title":"Home","text":"Paul Shen <pxshen@alumni.stanford.edu>  ","category":"page"},{"location":"","page":"Home","title":"Home","text":"Consulting and technical support available  ","category":"page"},{"location":"","page":"Home","title":"Home","text":"2024 (c) Paul Shen  ","category":"page"},{"location":"quarter_wavelength_antenna/#Quarter-Wavelength-Antenna","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"","category":"section"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"Complete file at examples folder","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"We simulate a quarter wavelength antenna above conductor ground plane and compute its nearfield radiation pattern","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"\nusing UnPack, LinearAlgebra, GLMakie, CoordinateTransformations, NearestNeighbors, Random\nusing GLMakie: volume\nusing Luminescent, LuminescentVisualization\n\n# if running directly without module # hide\n# include(\"$(pwd())/src/main.jl\") # hide\n# include(\"$(pwd())/../LuminescentVisualization.jl/src/main.jl\") # hide\n\nRandom.seed!\nname = \"quarter_wavelength_antenna\"\nF = Float32\ndogpu = false\nT = 8.0 # simulation duration in [periods]\nnx = 30\ndx = 1.0 / nx # pixel resolution in [wavelengths]\n\nl = 2 # simulation domain lxlxl box\nsz = nx .* (l, l, l)\nϵ = ones(F, sz)\nμ = ones(F, sz)\nσ = zeros(F, sz)\nσm = zeros(F, sz)","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"Set Spherical monitor centered on ground. Portions outside domain eg bottom hemisphere are automatically discarded","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"boundaries = [PEC(-3)] # ground plane on -z, unspecified boundaries default to PML\nmonitors = [\n    # (center, radius)\n    SphereMonitor([l / 2, l / 2, 0], 1),\n]\nsources = [\n    # (signal, center, dimensions)\n    Source(t -> cos(2π * t), [l / 2, l / 2, 0.125], [0, 0, 0.25]; Jz=1),\n]\n\nconfigs = maxwell_setup(boundaries, sources, monitors, dx, sz; F,)\n@unpack dt, geometry_padding, subpixel_averaging, field_padding, source_instances, monitor_instances, u0, = prob\n\np = apply(geometry_padding; ϵ, μ, σ, σm)\np = apply(subpixel_averaging, p)\n\n# move to gpu\nif dogpu\n    using Flux\n    # using CUDA\n    # @assert CUDA.functional()\n    u0, p, field_padding, source_instances = gpu.((u0, p, field_padding, source_instances))\nend","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"We run simulation as an accumulate loop. maxwell_update! applies Maxwells equations as staggered time stepping on E, H. It's mutating so a copy is made in order to save sequence of states","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"@showtime u = accumulate(0:dt:T, init=u0) do u, t\n    maxwell_update!(deepcopy(u), p, t, dx, dt, field_padding, source_instances)\nend\n\n# move back to cpu for plotting\nif dogpu\n    u, p, field_padding, source_instances = cpu.((u, p, field_padding, source_instances))\nend","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"Compute nearfield Poynting flux  integrated for 1 period thru our Spherical monitor consisting of points on sphere","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"nt = round(Int, 1 / dt)\nr = dt * sum(flux.(u[end-nt+1:end], (monitor_instances[1],),))\n_, θ, ϕ = eachrow(sphcoords(monitors[1])[:, inbounds(monitor_instances[1])])","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"Interpolate onto regular grid for Plot","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"tree = KDTree(hcat(θ, ϕ)')\nθ = 0:15°:360°\nϕ = 0:15°:180°\nn = length(ϕ)\nm = length(θ)\ni, = nn(tree, stack(vec(collect.(Base.product(θ, ϕ)))),)\ncfs = CartesianFromSpherical()\nrvecs = reshape(cfs.(splat(Spherical).(zip(r[i], θ * ones(n)', ones(m) * ϕ'))), m, n)\nfig = surface(getindex.(rvecs, 1), getindex.(rvecs, 2), getindex.(rvecs, 3),)\ndisplay(fig)\nsave(\"$(@__DIR__)/antennapattern.png\", fig)","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"(Image: )","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"Ready, set, action! We make movie, ","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"Ez = field.(u, :Ez)\nϵEz = field(p, :ϵEz)\ndir = @__DIR__\nrecordsim(\"$dir/$(name).mp4\", Ez, ;\n    dt,\n    field=:Ez,\n    monitor_instances,\n    source_instances,\n    geometry=ϵEz,\n    elevation=30°,\n    playback=1,\n    axis1=(; title=\"$name Ez\"),\n    # axis2=(; title=\"monitor powers\"),\n)","category":"page"},{"location":"quarter_wavelength_antenna/","page":"Quarter Wavelength Antenna","title":"Quarter Wavelength Antenna","text":"(Image: )","category":"page"}]
}
