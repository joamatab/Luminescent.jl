using Zygote, LinearAlgebra, UnPack
using Zygote: ignore
include("boundaries.jl")
include("sources.jl")
include("monitors.jl")
include("../ArrayPadding.jl/src/pad.jl")
# using ArrayPadding

function setup(boundaries, sources, monitors, L, dx, polarization=nothing; F=Float32)
    sz = round.(Int, L ./ dx)
    d = length(sz)
    esz = collect(sz)
    hsz = copy(esz)
    npad = zeros(Int, d, 2)
    nodes = fill(:U, d, 2)
    db = Any[PML(j * i, 1) for i = 1:d, j = (-1, 1)]

    ignore() do
        for b = boundaries
            for i = b.dims
                if typeof(b) == Periodic
                    db[i, :] = [b, b]
                else
                    if i > 0
                        db[i, 2] = b
                    else
                        db[abs(i), 1] = b

                    end
                end
            end
        end
    end

    ignore() do
        for i = 1:d
            for j = 1:2
                b = db[i, j]
                t = typeof(b)
                if t == PML
                    npad[i, j] += round(Int, b.d / dx)
                    # hpad[i, j] .+= b.d
                elseif t == PEC
                    nodes[i, j] = :E
                elseif t == PMC
                    nodes[i, j] = :H
                end
            end
        end
    end

    for i = 1:d
        if nodes[i, :] == [:U, :E]
            ignore() do
                nodes[i, 1] = :H
            end
        elseif nodes[i, :] == [:U, :H]
            ignore() do
                nodes[i, 1] = :E
            end
        elseif nodes[i, :] == [:E, :U]
            ignore() do
                nodes[i, 2] = :H
            end
        elseif nodes[i, :] == [:H, :U]
            ignore() do
                nodes[i, 2] = :E
            end
        elseif nodes[i, :] == [:U, :U]
            ignore() do
                nodes[i, :] = [:E, :H]
            end
        elseif nodes[i, :] == [:U, :U]
            ignore() do
                nodes[i, :] = [:E, :H]
            end
        elseif nodes[i, :] == [:E, :E]
            ignore() do
                hsz[i] += 1
            end
            μ = pad(μ, :replicate, fill(0, d), Int.(1:d .== i))
        elseif nodes[i, :] == [:H, :H]
            ignore() do
                esz[i] += 1
            end
            ϵ = pad(ϵ, :replicate, fill(0, d), Int.(1:d .== i))
            σ = pad(σ, :replicate, fill(0, d), Int.(1:d .== i))
        end
    end

    start = npad[:, 1] .+ 1
    Ie = [a:b for (a, b) = zip(start, start .+ esz .- 1)] # end
    Ih = [a:b for (a, b) = zip(start, start .+ hsz .- 1)] # end

    esz += sum(npad, dims=2)
    hsz += sum(npad, dims=2)
    esz = Tuple(esz)
    hsz = Tuple(hsz)
    if d == 1
        fields = (;
            Ez=zeros(F, esz),
            Hy=zeros(F, hsz),
            Jz=zeros(F, esz),)
    elseif d == 2
        if polarization == :TMz
            fields = (;
                Ez=zeros(F, esz),
                Hx=zeros(F, hsz),
                Hy=zeros(F, hsz),
                Jz=zeros(F, esz),)
        elseif polarization == :TEz
            fields = (;
                Ex=zeros(F, esz),
                Ey=zeros(F, esz),
                Hz=zeros(F, hsz),
                Jx=zeros(F, esz),
                Jy=zeros(F, esz),
            )
        end
    else
        fields = (;
            Ex=zeros(F, esz),
            Ey=zeros(F, esz),
            Ez=zeros(F, esz),
            Hx=zeros(F, hsz), Hy=zeros(F, hsz), Hz=zeros(F, hsz),
            Jx=zeros(F, esz),
            Jy=zeros(F, esz),
            Jz=zeros(F, esz),)
    end
    fields = ComponentArray(fields)

    boundary_effects = Padding[]
    geometry_effects = Padding[]
    for i = 1:d
        xyz = para = perp = [:x, :y, :z]
        ignore() do
            perp = [popat!(para, i)]
        end
        for j = 1:2
            b = db[i, j]
            if isa(b, PML)
                n = round(Int, b.d / dx)
                l = j == 1 ? [i == a ? n : 0 for a = 1:d] : zeros(Int, d)
                r = j == 2 ? [i == a ? n : 0 for a = 1:d] : zeros(Int, d)
                push!(geometry_effects, Padding(:ϵ, :replicate, l, r))
                push!(geometry_effects, Padding(:μ, :replicate, l, r))
                push!(geometry_effects, Padding(:σ, ReplicateRamp(4), l, r))
                push!(geometry_effects, Padding(:σm, ReplicateRamp(4), l, r))
                println(size(ϵ))
            end
            l = j == 1 ? Int.((1:d) .== i) : zeros(Int, d)
            r = j == 2 ? Int.((1:d) .== i) : zeros(Int, d)
            t = typeof(b)

            ignore() do
                f = nodes[i, j]
                for k = keys(fields)
                    if startswith(String(k), String(f)) && k[2] in para
                        if t == Periodic
                            push!(boundary_effects, Padding(k, :periodic, l, r,))
                        else
                            push!(boundary_effects, Padding(k, 0, l, r,))
                        end
                    end
                end
            end
        end
    end

    source_effects = 0
    ignore() do
        source_effects = [SourceEffect(s, dx, sz, start) for s = sources]
    end

    c = 0
    save_idxs = Int[]
    monitor_configs = []
    ignore() do
        for m = monitors
            @unpack span, fn = m
            sz = length.(filter(x -> !isa(x, Number), span))
            span = map(start, round.(Int, span / dx)) do s, x
                s .+ x
            end
            pos = [i:j for (i, j) = zip(first.(span), last.(span))]
            fi = [
                begin
                    fa = fields[f]
                    fcinds = label2index(fields, "$f")
                    linds = LinearIndices(fa)
                    I = Iterators.product(span...)
                    I = map(I) do I
                        fcinds[linds[(I)...]]

                    end
                end
                for f = fn
            ]
            stops = cumsum(length.(save_idxs))
            starts = [1, (stops[1:end-1] .+ 1)...]
            idxs = NamedTuple([f => i:j.+length(save_idxs) for (f, i, j) = zip(fn, starts, stops)])
            append!(save_idxs, reduce(vcat, fi))
            push!(monitor_configs, (; sz, pos, idxs))
        end
    end
    (; geometry_effects, boundary_effects, source_effects, monitor_configs, save_idxs, fields, Ie, Ih)
end

function group(fields::F, f) where {F}
    fields = NamedTuple(fields)
    [fields[k] for k = keys(fields) if startswith(String(k), String(f))]
    # ComponentArray(NamedTuple([k => fields[k] for k = keys(fields) if startswith(String(k), String(f))]))
end
# struct _F
#     v
# end

# function Base.getindex(a::ComponentArray, b::ComponentArray)
#     ComponentArray([k => a[k][b[k]] for k = keys(b)])
#     println("a")
# end
# function Base.getindex(a::ComponentArray, b::Tuple{ComponentArray})
#     getindex.((a,), b,)
# end
# function Base.getindex(a::ComponentArray, b::_F)
#     getindex.((a,), b.v,)
# end
# function Base.getindex(a, b::_F)
#     getindex.((a,), b.v,)
# end

using ChainRulesCore
comp_vec(A) = ComponentVector((; A))
comp_vec(A, B) = ComponentVector((; A, B))
comp_vec(A, B, C, D, a, b, c, d) = ComponentVector((; a => A, b => B, c => C, d => D))
# comp_vec(A, B) = ComponentVector((; A, B))
# comp_vec(A, B) = ComponentVector((; A, B))
function ChainRulesCore.rrule(::typeof(comp_vec), A)
    out = comp_vec(A)
    T = typeof(out)
    return out, Δ -> begin
        _Δ = convert(T, Δ)
        (NoTangent(), _Δ.A)
    end
end
function ChainRulesCore.rrule(::typeof(comp_vec), A, B)
    out = comp_vec(A, B)
    T = typeof(out)
    return out, Δ -> begin
        _Δ = convert(T, Δ)
        (NoTangent(), _Δ.A, _Δ.B)
    end
end
function ChainRulesCore.rrule(::typeof(comp_vec), A, B, C, D, a, b, c, d)
    out = comp_vec(A, B, C, D, a, b, c, d)
    T = typeof(out)
    return out, Δ -> begin
        _Δ = convert(T, Δ)
        (NoTangent(), _Δ[a], _Δ[b], _Δ[c], _Δ[d])
    end
end