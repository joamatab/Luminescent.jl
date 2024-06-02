abstract type AbstractMonitor end
struct OrthogonalMonitor <: AbstractMonitor
    c
    lb
    ub
    n
    label

    wavelengths
    modes
end

struct PointCloudMonitor <: AbstractMonitor
    p
    n
    w
    c
    s
    sz
    label
end
sphcoords(m::PointCloudMonitor) = m.s
normal(m::AbstractMonitor) = m.n

"""
    function Monitor(c, L; normal=nothing, label="")
    function Monitor(c, lb, ub; normal=nothing, label="")

Constructs monitor which can span a point, line, surface, volume or point cloud monitoring fields or power. 

Args
- c: origin or center of monitor
- L: physical dimensions of monitor
- lb: lower bounds wrt to c
- ub: upper bounds wrt to c

- normal: flux monitor direction (eg normal to flux surface)
"""
function Monitor(c, L, normal=nothing; label="")
    OrthogonalMonitor(c, -L / 2, L / 2, normal, label, nothing, nothing)
end
function ModalMonitor(modes::AbstractVector, c, L, normal; wavelength=1, wavelengths=[wavelength], label="")
    OrthogonalMonitor(c, -L / 2, L / 2, normal, label, wavelengths, modes)
end
function ModalMonitor(mode, a...; kw...)
    # if 
    ModalMonitor([mode], a...; kw...)
end

# function Monitor(c, lb, ub; normal=nothing, label="")
#     OrthogonalMonitor(c, lb, ub, normal, label)
# end

Monitor(p::AbstractMatrix; normals=nothing, weights=nothing, label="") = PointCloudMonitor(p, normals, weights, mean(p, dims=2), nothing, nothing, label)

Monitor(v::AbstractVector; kw...) = Monitor(Matrix(v); kw...)
# Spherical monitor center `c` radius `r` commonly used for antenna pattern . Instantiated to `PointCloudMonitorInstance` consisting of `N` points uniformly sampled on sphere. Points outside simulation domain are automatically discarded 
# function SphereMonitor(c, r; N=256, label="")
"""
    function SphereMonitor(c, r; dθ=5°, dϕ=5°, label="")

Spherical monitor center `c` radius `r` commonly used for antenna pattern . Instantiated to `PointCloudMonitorInstance` . Points outside simulation domain are automatically discarded 
    """
function SphereMonitor(c, r; dθ=2°, dϕ=2°, N=256, nθ=36, nϕ=18, label="")
    # n = stack(sample(Sphere((0, 0, 0), 1), HomogenousSampling(N)))\
    θlims = (0, 360°)
    ϕlims = (0, 180°)
    θ = range(θlims...; step=dθ)
    ϕ = range(ϕlims...; step=dϕ)
    nθ = length(θ)
    nϕ = length(ϕ)
    samples = getproperty.(sample(Sphere((0, 0, 0), 1), RegularSampling(nθ, nϕ)) |> collect, :coords)
    # samples = getproperty.(sample(Sphere((0, 0, 0), 1), HomogeneousSampling(N)) |> collect, :coords)
    # samples=Base.product(θ,ϕ)
    sz = (nθ, nϕ)
    n = stack(samples)
    p = c .+ n * r
    t = SphericalFromCartesian()
    s = stack([[sph.r, sph.θ, sph.ϕ] for sph = t.(samples)])
    # A = 4π * r^2
    # w = A / N
    # w = map(CartesianIndices(sz)) do i, j
    w = map(samples) do (θ, ϕ)
        r^2 * dθ * dϕ * sin(ϕ)
    end
    PointCloudMonitor(p, n, w, c, s, sz, label)
end
Base.string(m::OrthogonalMonitor) =
    """
    $(m.label): $(count((m.ub.-m.lb).!=0))-dimensional monitor, centered at $(m.c|>d2), physical size of $((m.ub-m.lb)|>d2) relative to center, flux normal towards $(normal(m)|>d2)"""
Base.string(m::PointCloudMonitor) =
    """
    $(m.label): point cloud monitor, centered at $(m.c|>d2), $(size(m.p,2)) points"""

abstract type MonitorInstance end
struct OrthogonalMonitorInstance <: MonitorInstance
    d
    roi
    frame
    dx
    v
    center
    label

    wavelengths
    modes
end
# @functor OrthogonalMonitorInstance (n,)
Base.ndims(m::OrthogonalMonitorInstance) = m.d
Base.size(m::OrthogonalMonitorInstance) = length.(m.i)
area(m::OrthogonalMonitorInstance) = m.v

struct PointCloudMonitorInstance <: MonitorInstance
    i
    roi
    n
    w
    c
    inbounds
    label
end
inbounds(m::PointCloudMonitorInstance) = m.inbounds
Base.length(m::OrthogonalMonitorInstance) = 1
Base.length(m::PointCloudMonitorInstance) = 1

frame(m::OrthogonalMonitorInstance) = m.frame
normal(m::OrthogonalMonitorInstance) = frame(m)[3][1:length(m.center)]

function MonitorInstance(m::OrthogonalMonitor, dx, field_origin, common_left_pad_amount, sz, ; F=Float32)
    @unpack n, lb, c, wavelengths, modes = m
    L = m.ub - m.lb
    singletons = findall(L .≈ 0,)
    D = length(L)
    d = length(L) - length(singletons)

    L0 = copy(L)
    deleteat!(L, singletons)
    v = isempty(L) ? 0 : prod(L,)
    L = L0

    roi = dict([k => begin
        p = (c + lb - o) / dx
        i = floor(p)
        w = 1 - mean(abs.(p - i))
        w = (w, 1 - w)
        i = [i .+ map(round(L / dx)) do n
            n == 0 ? 1 : Base.oneto(n)
        end for i = (i, i + 1)]
        [(F(w), i) for (w, i) in zip(w, i) if w > 0]
    end for (k, o) = pairs(field_origin)])
    n = isnothing(n) ? n : F.(n |> normalize)
    if D == 2
        frame = [[-n[2], n[1], 0], [0, 0, 1], [n..., 0]]
    elseif D == 3
        frame = [0, 0, n]
    end
    _center = round(c / dx) + 1 + common_left_pad_amount
    OrthogonalMonitorInstance(d, roi, frame, F(dx), F(v), _center, m.label, wavelengths, modes)
end

function MonitorInstance(m::PointCloudMonitor, dx, sz, common_left_pad_amount, flb, fl; F=Float32)
    @unpack p, n, c, w, label = m
    p = round.(p / dx) .+ 1
    _, i = size(p)
    inbounds = filter(1:i) do i
        v = p[:, i]
        all(v .> 0) && all(v .<= sz)
    end
    p = p[:, inbounds]
    n = n[:, inbounds]
    # p = stack(@. v[1])
    # n = stack(@. v[2])
    i = p .+ common_left_pad_amount
    roi = NamedTuple([k => p .+ v for (k, v) = pairs(fl)])
    c = round.(c / dx) .+ 1 + common_left_pad_amount
    PointCloudMonitorInstance(i, roi, F.(n), w, c, inbounds, label)
end

"""
    function field(u, k, m)
    
queries field, optionally at monitor instance `m`

Args
- `u`: state
- `k`: symbol or str of Ex, Ey, Ez, Hx, Hy, Hz, |E|, |E|2, |H|, |H|2
- `m`
"""
function field(u, k, m=nothing)
    if k == "|E|2"
        sum(field.(u, (:Ex, :Ey, :Ez), (m,))) do a
            a .^ 2
        end
    elseif k == "|E|"
        sqrt.(field(u, "|E|2", m))
    elseif k == "|H|2"
        sum(field.(u, (:Hx, :Hy, :Hz), (m,))) do a
            a .^ 2
        end
    elseif k == "|H|"
        sqrt.(field(u, "|H|2", m))
    else
        a = recursive_getindex(u, k)
        if isnothing(m)
            return a
        elseif isa(m, OrthogonalMonitorInstance)
            return sum([w * a[i...] for (w, i) = m.roi[k]])
        elseif isa(m, PointCloudMonitorInstance)
            return [a[v...] for v = eachcol(m.roi[k])]
        end
    end
end

Base.getindex(a, k, m::MonitorInstance) = field(a, k, m)

"""
    function flux(m::MonitorInstance, u)

 Poynting flux profile passing thru monitor 
"""
function flux(u, m::OrthogonalMonitorInstance)
    d = ndims(m)
    E = [u[k, m] for k = keys(u[:E])]
    H = [u[k, m] for k = keys(u[:H])]

    # (E × H) ⋅ normal(m)
    sum((E × H) .* normal(m))
end
function flux(u, m::PointCloudMonitorInstance)
    @unpack n = m
    E = [[field(u, k)[v...] for v = eachcol(m.roi[k])] for k = keys(u[:E])]
    H = [[field(u, k)[v...] for v = eachcol(m.roi[k])] for k = keys(u[:H])]

    dot.(stack(E × H) |> eachrow, eachcol(n))
end

"""
    function power(m::MonitorInstance, u)

total power (Poynting flux) passing thru monitor surface
"""
function power(u, m::OrthogonalMonitorInstance)
    # @assert ndims(m) == 2
    m.v * mean(flux(u, m))
end
power(u, m::PointCloudMonitorInstance) = flux(u, m) ⋅ m.w
# power(m, u) = sum(sum(pf([u[i...] for (u, i) = zip(u, collect(values(m.i)))]) .* normal(m)))

function monitors_on_box(c, L)
    ox, oy, oz = c
    lx, ly, lz = L
    rx, ry, rz = L / 2
    [
        Monitor([ox - rx, oy, oz], [0, ly, lz], [-1, 0, 0]),
        Monitor([ox + rx, oy, oz], [0, ly, lz], [1, 0, 0]),
        Monitor([ox, oy - ry, oz], [lx, 0, lz], [0, -1, 0]),
        Monitor([ox, oy + ry, oz], [lx, 0, lz], [0, 1, 0]),
        Monitor([ox, oy, oz - rz], [lx, ly, 0,], [0, 0, -1,]),
        Monitor([ox, oy, oz + rz], [lx, ly, 0,], [0, 0, 1,]),
    ]
end