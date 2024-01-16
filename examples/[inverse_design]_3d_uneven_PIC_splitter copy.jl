"""
Solves first photonics inverse design problem in Google's Ceviche challenges. 
Design is a tight right angle waveguide bend.
"""

######################## 
# tunable configs #
###################
name = "waveguide_bend"
dir = "examples/utils"

"training params"
T = 4.0f0 # simulation duration in [periods]
nbasis = 4 # complexity of design region
trainer = :Optim # :Flux or :Optim
η = 0.2 # training rate (only applies if Flux is trainer)
Courant = 0.4f0 # Courant number
C = 1000 # scale loss

"""
training schedule
    - nres: resolution per wavelength
    - contrast: edge sharpness in design region
    - f_reltol: objective relative tolerance 
    - iterations 
"""
schedule = [(16, 0.9, 5.0f-3, 50),] # 

########################

using UnPack, LinearAlgebra, Random, StatsBase, Interpolations, Flux, Optim, Jello, GLMakie
using Flux: withgradient
using Optim: Options, minimizer
using BSON: @save, @load

include("../src/main.jl")
# include("../src/FDTDEngine.jl")
# using .FDTDEngine

include("../../FDTDToolkit.jl/src/plot_recipes.jl")

F = Float32
Random.seed!(1)

λ = 1.55
@load "$dir/layout.bson" layout
@unpack wwg, hwg, lwg, ld, hclad, hbox, l, w, h, wm, o, base, sources, ports, designs, dx = layout
ϵbox = ϵclad = ϵslab = 2.25
ϵcore = 12.25
function sandwich(base, h, ϵ)
    a = ones(F, size(base))
    ϵbox, ϵcore, ϵclad, = ϵ
    hbox, hwg, hclad = h
    cat(repeat.(
            (a * ϵbox, base * ϵcore + (1 .- base) * ϵclad, ϵclad * a),
            1,
            1,
            h
        )..., dims=3)
end
ϵ = sandwich(base, round.(Int, [hbox, hwg, hclad] / dx), [ϵbox, ϵcore, ϵclad])
sz0 = size(ϵ)
boundaries = [] # unspecified boundaries default to PML
z = [hbox, hbox + hwg]
n = [1, 0, 0]
monitors = [Monitor([x, y, z], n) for (x, y) = ports]
ox, oy, = o
oz = hbox
append!(monitors, [
    Monitor([[ox, ox + ld], [oy, oy + ld], oz], [0, 0, -1]),
    Monitor([[ox, ox + ld], [oy, oy + ld], oz + hwg], [0, 0, 1]),
    Monitor([[ox, ox + ld], oy, [oz, oz + hwg]], [0, -1, 0]),
    Monitor([[ox, ox + ld], oy + ld, [oz, oz + hwg]], [0, 1, 0]),
    Monitor([ox, [oy, oy + ld], [oz, oz + hwg]], [-1, 0, 0]),
    Monitor([ox + ld, [oy, oy + ld], [oz, oz + hwg]], [1, 0, 0]),
])

@load "$dir/mode.bson" mode
using Interpolations
@unpack Ex, Ey, Ez, bounds = mode
bounds /= λ
_dx = mode.dx / λ
Ex, Ey, Ez = [Ex, Ey, Ez] / maximum(maximum.(abs, [Ex, Ey, Ez]))
sy, sz = size.((Ex,), (1, 2))
y = range(bounds[1]..., sy)
z = range(bounds[2]..., sz)
heatmap(Ex)
heatmap(Ey)
heatmap(Ez)
f = t -> cos(F(2π) * t)
gEx = LinearInterpolation((y, z), Ez)
gEy = LinearInterpolation((y, z), Ex)
gEz = LinearInterpolation((y, z), Ey)
center = [sources[1]..., hbox]
bounds = [0, bounds...]
sources = [
    Source(f, center, bounds;
        Jx=(x, y, z) -> gEx(y, z),
        Jy=(x, y, z) -> gEy(y, z),
        Jz=(x, y, z) -> gEz(y, z),
    ),
]
fdtd_configs = setup(boundaries, sources, monitors, dx, sz0; F, Courant, T)
@unpack μ, σ, σm, dt, geometry_padding, field_padding, source_effects, monitor_instances, fields, step, power = fdtd_configs



u0 = collect(values(fields))
function loss(model)
    b = place(base, model(), round.(Int, o / dx) .+ 1)
    ϵ = sandwich(b, round.(Int, [hbox, hwg, hclad] / dx), [ϵbox, ϵcore, ϵclad])
    p = apply(geometry_padding; ϵ, μ, σ, σm)

    # run simulation
    u = reduce((u, t) -> step(u, p, t, fdtd_configs), 0:dt:T, init=u0)
    reduce(((u, l), t) -> (step(u, p, t, fdtd_configs), begin
            l + sum(power.(monitor_instances[4:9], (u,))) - 2sum(power.(monitor_instances[2:3], (u,)))
        end),
        T-1+dt:dt:T, init=(u, 0.0f0))[2]
end

contrast = 10.0f0
nbasis = 4
model = Mask(round.(Int, (ld, ld) ./ dx), nbasis, contrast)
@showtime loss(model)
# E = map(sol) do u
#     # u[1]
#     sqrt.(u[1] .^ 2 + u[2] .^ 2 + u[3] .^ 2)
# end
# recordsim(E, p[1], fdtd_configs, "$(name)_nres_$nres.mp4", title="$name";  playback=1, bipolar=false,)#umax=2,)
# volume(E[end]; colormap=[(:white, 0), (:orange, 1)])
# extrema(E[end])
# maximum(map(E) do v
#         maximum(abs, v)
#     end)
fig = Figure()
ax = Axis(fig[1, 1])
for m = monitor_instances[1:3]
    lines!(ax, power.((m,), sol))
end