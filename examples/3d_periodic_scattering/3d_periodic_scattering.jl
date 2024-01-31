"""
simulation of plane wave scattering on periodic array of dielectric spheres
"""

using UnPack, LinearAlgebra, GLMakie
# using FDTDEngine,FDTDToolkit
dir = pwd()
include("$(dir)/src/main.jl")
include("$dir/../FDTDToolkit.jl/src/main.jl")


F = Float32
name = "3d_scattering"
T = 8.0f0 # simulation duration in [periods]
nres = 16
dx = 1.0f0 / nres # pixel resolution in [wavelengths]
Courant = 0.8 / √3 # Courant number

"geometry"
l = 2 # domain physical size length
sz = nres .* (l, l, l) # domain voxel dimensions
ϵ1 = 1 #
ϵ2 = 2.25f0 # 
b = F.([norm(v .- sz ./ 2) < 0.5 / dx for v = Base.product(Base.oneto.(sz)...)]) # sphere
ϵ = ϵ2 * b + ϵ1 * (1 .- b)

"setup"
boundaries = [Periodic(2), Periodic(3)]# unspecified boundaries default to PML
# n = [1, 0, 0]
monitors = []
sources = [
    PlaneWave(t -> cos(F(2π) * t), -1; Jz=1) # Jz excited plane wave from -x plane (eg -1)
    # PlaneWave(t -> t < 1 ? cos(F(2π) * t) : 0.0f0, -1; Jz=1)
]
configs = setup(boundaries, sources, monitors, dx, sz; F, Courant, T)
@unpack μ, σ, σm, dt, geometry_padding, geometry_splits, field_padding, source_effects, monitor_instances, fields, power = configs

ϵ, μ, σ, σm = apply(geometry_padding; ϵ, μ, σ, σm)
p = apply(geometry_splits; ϵ, μ, σ, σm)
u0 = collect(values(fields))

# run simulation
t = 0:dt:T
sol = similar([u0], length(t))
@showtime sol = accumulate!((u, t) -> step!(u, p, t, configs), sol, t, init=u0)

# make movie
Ez = map(sol) do u
    u[3]
end
ϵz = p[1][3]
dir = @__DIR__
° = π / 180
recordsim(Ez, ϵz, configs, "$dir/$(name)_nres_$nres.mp4", title="$name"; elevation=30°, playback=1, bipolar=true)
