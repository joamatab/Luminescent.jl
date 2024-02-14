"""
simulation of plane wave scattering on periodic array of dielectric spheres
"""

using UnPack, LinearAlgebra, GLMakie
# using FDTDEngine,FDTDToolkit
dir = pwd()
include("$(dir)/src/main.jl")
include("$dir/../FDTDToolkit.jl/src/main.jl")


name = "3d_scattering"
T = 8.0f0 # simulation duration in [periods]
nres = 16
dx = 1.0f0 / nres # pixel resolution in [wavelengths]

"geometry"
l = 2 # domain physical size length
sz = nres .* (l, l, l) # domain voxel dimensions
ϵ1 = ϵmin = 1 #
ϵ2 = 2.25f0 # 
b = F.([norm(v .- sz ./ 2) < 0.5 / dx for v = Base.product(Base.oneto.(sz)...)]) # sphere
ϵ = ϵ2 * b + ϵ1 * (1 .- b)

"setup"
boundaries = [Periodic(2), Periodic(3)]# unspecified boundaries default to PML
sources = [
    PlaneWave(t -> cos(F(2π) * t), -1; Jz=1) # Jz excited plane wave from -x plane (eg -1)
]
n = [1, 0, 0] # normal 
δ = 0.2f0 # margin
# A = (l - δ)^2
lm = 1 # monitor side length
monitors = [
    Monitor([δ, l / 2, l / 2], [0, lm, lm], n,), # (center, dimensions, normal)
    Monitor([l - δ, l / 2, l / 2], [0, lm, lm], n,),
]
configs = setup(boundaries, sources, monitors, dx, sz; ϵmin, T)
@unpack μ, σ, σm, dt, geometry_padding, geometry_splits, field_padding, source_instances, monitor_instances, u0, = configs

ϵ, μ, σ, σm = apply(geometry_padding; ϵ, μ, σ, σm)
p = apply(geometry_splits; ϵ, μ, σ, σm)


# run simulation
t = 0:dt:T
u = similar([u0], length(t))
@showtime u = accumulate!((u, t) -> step!(u, p, t, dx, dt, field_padding, source_instances), u, t, init=deepcopy(u0))
y = hcat([power.((m,), u) for m = monitor_instances]...)

# make movie
Ez = map(u) do u
    u[1][3]
end
ϵz = p[1][3]
dir = @__DIR__

recordsim("$dir/$(name)_nres_$nres.mp4", Ez, y;
    dt,
    monitor_instances,
    source_instances,
    geometry=ϵz,
    elevation=30°,
    playback=1,
    axis1=(; title="$name\nEz"),
    axis2=(; title="monitor powers"),
)
