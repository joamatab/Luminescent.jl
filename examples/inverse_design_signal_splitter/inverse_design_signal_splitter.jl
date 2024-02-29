using UnPack, LinearAlgebra, Random, StatsBase, Interpolations, Zygote, Jello, Flux
using Flux: mae, Adam
using Zygote: withgradient
using BSON: @save, @load
using Optim: Options, minimizer
using Optim
using GLMakie
# using FDTDEngine,FDTDToolkit

dir = pwd()
include("$dir/src/main.jl")
include("$dir/../FDTDToolkit.jl/src/main.jl")
include("$dir/scripts/startup.jl")


F = Float32
Random.seed!(1)

"training params"
name = "inverse_design_signal_splitter"
dogpu = true
dogpu = false
T = 14 # simulation duration in [periods]
nbasis = 4 # complexity of design region
# λ = 1.55 # wavelength [um]

# loads design layout
@load "$(@__DIR__)/layout.bson" layout
@unpack base, sources, ports, designs, = layout
@load "$(@__DIR__)/modes.bson" modes lb ub λ dx hsub wwg hwg hclad ϵsub ϵclad ϵwg
ϵmin = ϵclad
hsub, wwg, hwg, hclad, dx, ub, lb = [hsub, wwg, hwg, hclad, dx, ub, lb] / λ

base = F.(base)
ϵsub, ϵwg, ϵclad = F.((ϵsub, ϵwg, ϵclad))
ϵdummy = sandwich(base, round.(Int, [hsub, hwg, hclad] / dx), [ϵsub, ϵwg, ϵclad])
sz0 = size(ϵdummy)

# "geometry generator model
@load "model.bson" model
x, re = destructure(model)

# contrast = 10.0
# model = Mask(round.(Int, designs[1].L / λ / dx) .+ 1, nbasis, contrast; symmetries=2)

model0 = deepcopy(model)

"boundaries"
boundaries = [] # unspecified boundaries default to PML

"monitors"
# monitors = vcat(
#     monitors_on_box([designs[1].c..., z], [designs[1].L..., hwg])[3:6]
# )
normal = [1, 0, 0] # normal 
δ = 0.1 / λ # margin
# (center, lower bound, upper bound; normal)
monitors = [Monitor([p.c / λ..., hsub], [0, -wwg / 2 - δ, -δ], [0, wwg / 2 + δ, hwg + δ]; normal=[p.n..., 0]) for p = ports]

# modal source
@unpack Ex, Ey, Ez, = modes[1]
Jy, Jz, Jx = map([Ex, Ey, Ez] / maximum(maximum.(abs, [Ex, Ey, Ez]))) do a
    reshape(a, 1, size(a)...)
end
# GLMakie.volume(real(Jy))
c = [sources[1].c / λ..., hsub]
lb = [0, lb...]
ub = [0, ub...]
sources = [Source(t -> cos(2π * t), c, lb, ub; Jx, Jy, Jz)]

configs = setup(boundaries, sources, monitors, dx, sz0; ϵmin)
@unpack μ, σ, σm, dt, geometry_padding, geometry_splits, field_padding, source_instances, monitor_instances, u0, = configs
nt = round(Int, 1 / dt)

t = 0:dt:T
y0 = zeros(F, length(monitor_instances))
if dogpu
    using CUDA, Flux
    @assert CUDA.functional()
    u0, model, base, μ, σ, σm, t, field_padding, source_instances =#, monitor_instances =
        gpu.((u0, model, base, μ, σ, σm, t, field_padding, source_instances))#, monitor_instances))
end

function make_geometry(model, base, μ, σ, σm)
    base_ = Buffer(base)
    base_[:, :] = base
    place!(base_, model(), round.(Int, designs[1].o / λ / dx) .+ 1)

    ϵ = sandwich(copy(base_), round.(Int, [hsub, hwg, hclad] / dx), [ϵsub, ϵwg, ϵclad])
    ϵ, μ, σ, σm = apply(geometry_padding; ϵ, μ, σ, σm)
    p = apply(geometry_splits; ϵ, μ, σ, σm)
end

function metrics(model, T=T; autodiff=true)
    p = make_geometry(model, base, μ, σ, σm)
    # run simulation
    _step = if autodiff
        step3
    else
        step3!
    end
    u = reduce((u, t) -> _step(u, p, t, dx, dt, field_padding, source_instances;), 0:dt:T-1, init=deepcopy(u0))
    y = reduce(T-1+dt:dt:T, init=(u, y0)) do (u, y), t
        _step(u, p, t, dx, dt, field_padding, source_instances),
        y + dt * power.(monitor_instances, (u,))
    end[2]

end
@show const tp = metrics(model, 2; autodiff=false)[1] # total power
# error()

function loss(y)
    # -y[2] / tp
    sum(abs, F[1, 0.5, 0.5,] - y / tp)
    # (dot([-1, -1, -1,], y) / 2 + abs(tp / 2 - y[2]) + abs(tp / 2 - y[3])) / tp
end

p0 = make_geometry(model0, base, μ, σ, σm)
volume(cpu(p0[1][2]))
# error()

"Optim functions"
# x0, re = destructure(model)
# f_ = m -> loss(metrics(m; autodiff=false))
# # f_ = m -> loss(metrics(m;))
# f = f_ ∘ re
# x = deepcopy(x0)


# @allowscalar res = optimize(f, x,
#     ParticleSwarm(; n_particles=10),
#     Optim.Options(f_tol=0, iterations=20, show_every=1, show_trace=true))
# xgf = minimizer(res)
# x = deepcopy(xgf)
# heatmap(cpu(re(x)()))
# @show metrics(re(x))
# @save "model.bson" model = re(x)
# error()

opt = Adam(0.2)
model = re(x)
opt_state = Flux.setup(opt, model)
n = 60
for i = 1:n
    @time l, (dldm,) = withgradient(m -> loss(metrics(m)), model)
    Flux.update!(opt_state, model, dldm)
    println("$i $l")
end
heatmap(cpu(model()))
@save "model.bson" model
# error()

@show metrics(model)
function runsave(x)
    model = re(x)
    p = make_geometry(model, base, μ, σ, σm)
    @showtime u = accumulate((u, t) ->
            step3!(deepcopy(u), p, t, dx, dt, field_padding, source_instances),
        t, init=u0)

    # move to cpu for plotting
    global source_instances
    if dogpu
        u, p, source_instances = cpu.((u, p, source_instances))
    end
    Ey = map(u) do u
        u[1][2]
    end
    ϵEy = p[1][2]
    dir = @__DIR__
    # error()
    recordsim("$dir/$(name).mp4", Ey, ;
        dt,
        field=:Ey,
        monitor_instances,
        source_instances,
        geometry=ϵEy,
        elevation=60°,
        playback=1,
        axis1=(; title="$name\nEy"),
        axis2=(; title="monitor powers"),
    )

end

runsave(x)