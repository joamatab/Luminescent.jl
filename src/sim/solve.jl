function f1(((u,), p, (dt, field_diffdeltas, field_diffpadvals, source_instances)), t)
    u = update(u, p, t, dt, field_diffdeltas, field_diffpadvals, source_instances)
    ((u,), p, (dt, field_diffdeltas, field_diffpadvals, source_instances))
end

function f2(((u, mf), p, (dt, field_diffdeltas, field_diffpadvals, source_instances), (t0, T, monitor_instances)), t)
    u = update(u, p, t, dt, field_diffdeltas, field_diffpadvals, source_instances;)
    mf += dt / T * [[
        begin
            # global _b = u
            namedtuple([k => (field(u, k, m) * cispi(-2(t - t0) / λ)) for k = keys(u)])
        end for λ = wavelengths(m)
    ] for m = monitor_instances]
    ((u, mf), p, (dt, field_diffdeltas, field_diffpadvals, source_instances), (t0, T, monitor_instances))
end

function solve(prob, ;
    save_memory=false, ulims=(-3, 3), framerate=0, path="",
    kwargs...)
    @unpack mode_deltas, polarization, dt, u0, geometry, _geometry, source_instances, monitor_instances, Ttrans, Tss, ϵeff = prob
    @unpack F, N, sz, deltas, field_diffdeltas, field_diffpadvals, field_lims, dl, spacings, geometry_padvals, geometry_padamts, _geometry_padamts = prob.grid

    p = geometry
    _p = _geometry
    # return sum(_p.ϵ)


    p = pad_geometry(p, geometry_padvals, geometry_padamts)
    p = apply_subpixel_averaging(p, field_lims)

    _p = pad_geometry(_p, geometry_padvals, _geometry_padamts)
    invϵ = tensorinv(_p.ϵ, values(field_lims(r"E.*")), spacings)

    p = merge(p, (; invϵ))
    durations = [Ttrans, Tss]
    T = cumsum(durations)
    us0 = (u0,)
    init = (us0, p, (dt, field_diffdeltas, field_diffpadvals, source_instances))

    ts = 0:dt:T[1]-F(0.001)
    if save_memory
        (u,), = adjoint_reduce(f1, ts, init, ulims)
    else
        (u,), = reduce(ts; init) do us, t
            ignore() do
                if framerate > 0 && t > 0
                    if t % (1 / framerate) < dt
                        (u,), p, = us
                        a = u.Hz
                        g = p.ϵxx

                        _path = joinpath(path, "temp")
                        mkpath(_path)
                        CairoMakie.save(joinpath(_path, "$t.png"), quickie(a, g; monitor_instances, source_instances, ulims),)
                        # quickie(a, g; monitor_instances, source_instances)
                    end
                end
            end
            f1(us, t)
        end
    end
    ts = ts[end]+dt:dt:T[2]-F(0.001)
    init = ((u, 0), p, (dt, field_diffdeltas, field_diffpadvals, source_instances), (T[2], durations[2], monitor_instances))

    if save_memory
        (u, mf), = adjoint_reduce(f2, ts, init, ulims)
    else
        (u, mf), = reduce(f2, ts; init)
    end
    # return sum(abs, mf[1][1].Ex + mf[1][1].Ey + mf[1][1].Hz)
    ulims = 0
    # ulims = ignore_derivatives() do
    #     map(vcat(extrema.(leaves(u)), [
    #         begin
    #             c = maximum(abs.(a))
    #             (-c, c)
    #         end for a = leaves(mf)
    #     ])) do l
    #         l[1] == l[2] ? convert.(F, (-1, 1)) : l
    #     end
    # end


    v = map(mf, monitor_instances) do mf, m
        map(mf, wavelengths(m)) do u, λ
            dftfields = permutexyz(u, m.dimsperm, N)
            # if N == 2
            # if polarization == :TE
            #     Ex, Hy, Ez = invreframe(frame(m), vcat(E, H))
            #     Ex += 0sum(Ez[1:2])
            #     Hy += 0sum(Ez[1:2])
            #     dftfields = (; Ex, Hy, Ez)
            # else
            #     Hx, Ey, Hz = invreframe(frame(m), vcat(H, E))
            #     Hx += 0real(Hz[1])
            #     Ey += 0real(Hz[1])
            #     dftfields = (; Hx, Ey, Hz)
            # end
            # elseif N == 3
            #     Ex, Ey, Ez, = invreframe(frame(m), E)
            #     Hx, Hy, Hz = invreframe(frame(m), H)
            #     dftfields = (; Ex, Ey, Ez, Hx, Hy, Hz)
            # end
            # dftfields = keepxy(dftfields)
            fp = rp = c = nothing
            if !isnothing(m.λmodes)
                wm = m.λmodes[λ]
                c = mode_decomp.(wm, (dftfields,), (mode_deltas,))
                # fp = [abs(v[1])^2 for v = c]
                # rp = [abs(v[2])^2 for v = c]
            end

            dftfields, c
        end
    end
    um = [[v[1] for v = v] for v in v]
    ap = [[isnothing(v[2]) ? nothing : getindex.(v[2], 1) for v = v] for v in v]
    am = [[isnothing(v[2]) ? nothing : getindex.(v[2], 2) for v = v] for v in v]
    return Solution(u, p, _p, ulims, um, ap, am)
end

struct Solution
    u
    p
    _p
    ulims
    um
    ap
    am
end
@functor Solution

function (s::Solution)(k, m, w=1, mn=0)
    @unpack u, ulims, um, ap, am = s
    if k == "a+"
        return s.ap[m][w][mn+1]
    elseif k == "a-"
        return s.am[m][w][mn+1]
    elseif k == "P_TE"
        return flux(um[m][w], :TE)
    elseif k == "P_TM"
        return flux(um[m][w], :TM)
    elseif k == "P"
        return flux(um[m][w])
    elseif k == "um"
        return um[m][w]
    end
end
# heatmap(___p.invϵ[1, 1])