function draw_bbox!(ax, bbox)
    isnothing(bbox) && return
    x0, y0 = bbox[:, 1]
    x1, y1 = bbox[:, 2]
    lines!(ax, [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)], color=:black)
end

° = π / 180
function quickie(u, g=nothing; dl=1, monitor_instances=[], source_instances=[], ulims=nothing, λ=1, unit="um", ratio, bbox=nothing, origin=0)

    fig = Figure()
    N = ndims(u)
    if ulims == nothing
        colorrange = (-1, 1) .* maximum(abs, u)
    else
        colorrange = ulims
    end
    colormap = :seismic
    algorithm = :absorption
    labels = []
    for (i, m) = enumerate(monitor_instances)
        text = isempty(m.label) ? "o$i" : m.label
        push!(labels, (ratio * m.center, text))
    end
    for (i, s) = enumerate(source_instances)
        text = isempty(s.label) ? "s$i" : s.label
        push!(labels, (ratio * s.center, text))
    end

    ax = fig[1, 1]
    xtickformat = x -> string.(round.(x * dl * λ + origin[1] - bbox[1, 1] * dl, digits=2)) .* (unit,)
    ytickformat = y -> string.(round.(y * dl * λ + origin[2] - bbox[2, 1] * dl, digits=2)) .* (unit,)
    ztickformat = z -> string.(round.(z * dl * λ + origin[3] - bbox[3, 1] * dl, digits=2)) .* (unit,)
    if N == 3
        l, w, h = size(u)
    else
        l, w = size(u)

    end

    title = "Hz"
    if N == 3
        ax = fig[1, 1]
        title *= " (xy slice of 3D array)"
        aspect = l / w
        axis = (; title, aspect, xtickformat, ytickformat)
        a = u[:, :, round.(Int, size(u, 3) / 2)]
        heatmap(ax, a; axis, colormap, colorrange)
        draw_bbox!(ax, bbox)

        ax = fig[1, 2]
        aspect = w / h
        axis = (; title, aspect, xtickformat=ytickformat, ytickformat=ztickformat)
        a = u[round.(Int, size(u, 1) / 2), :, :]
        heatmap(ax, a; axis, colormap, colorrange=colorrange)
        draw_bbox!(ax, bbox[2:3, :])

    else
        ax = fig[1, 1]
        title *= " (2D array)"
        aspect = l / w
        axis = (; title, aspect, xtickformat, ytickformat)
        heatmap(ax, u; axis, colormap, colorrange)
        draw_bbox!(ax, bbox)

        ax = fig[1, 2]
        # if !isnothing(g)
        #     if diff(collect(extrema(u)))[1] > 0
        #         Colorbar(ax[1, 2], plt)
        #         contour = g .> 0.99maximum(g)
        #         contour = morpholaplace(contour,)
        #         heatmap!(ax, contour; colormap=[(:gray, 0), :black], colorrange=(0, 1))
        #     end
        # end
    end
    for (pos, text) in labels
        ax = fig[1, 1]
        text!(ax, pos..., ; text, align=(:center, :center))
        # annotate!(g[1, 1], pos, text; fontsize=10, color=:black)
    end
    if isnothing(g)
        return fig
    end

    title = "ϵ"
    colormap = [:white, :gray]
    if N == 3
        ax = fig[2, 1]
        title *= " (yz slice of 3D array)"
        aspect = l / w
        axis = (; title, aspect, xtickformat, ytickformat)
        a = g[:, :, round.(Int, size(g, 3) / 2)]
        heatmap(ax, a; axis, colormap)
        draw_bbox!(ax, bbox)

        ax = fig[2, 2]
        aspect = w / h
        axis = (; title, aspect, xtickformat=ytickformat, ytickformat=ztickformat)
        a = g[round.(Int, size(g, 1) / 2), :, :]
        heatmap(ax, a; axis, colormap,)
        draw_bbox!(ax, bbox[2:3, :])
    else
        ax = fig[2, 1]
        title *= " (2D array)"
        aspect = l / w
        axis = (; title, aspect, xtickformat, ytickformat)
        heatmap(ax, g; axis, colormap)
        draw_bbox!(ax, bbox)
        # if diff(collect(extrema(g)))[1] > 0
        #     Colorbar(ax[1, 2], plt)
        # end
    end

    # i = 1
    # for k = keys(fields)
    #     j = 1
    #     # for (k2, a) = pairs(fields[k1])
    #     a = fields[k]
    #     g = fig[i, j]
    #     title = string(k)
    #     _plot!(g, a, ; title, colormap, colorrange, algorithm, labels, kw...)

    #     # j += 1
    #     i += 1
    # end
    # if !isnothing(geometry)
    #     j = 1
    #     for (k2, a) = pairs(geometry)
    #         g = fig[i, j]
    #         title = string(k2)
    #         _plot!(g, a, ; title, algorithm=:mip, kw...)

    #         j += 1
    #     end
    # end
    return fig
end

# function _plot!(g, a, ; colorrange=nothing, title="", labels=[], colormap=:seismic, algorithm=nothing,
#     azimuth=75°, elevation=75°,
#     kw...)
#     d = ndims(a)
#     if d == 2 || !gl
#         if isnothing(colorrange)
#             colorrange = extrema(a)
#         end
#         aspect = size(a, 1) / size(a, 2)
#         if d == 3
#             # println("3D array: plotting middle slice")
#             title *= " (middle slice of 3D array)"

#             a = a[:, :, round(Int, size(a, 3) / 2)]
#             ax, plt = heatmap(g[1, 1], real(a); axis=(;  title, aspect), colormap, colorrange=colorrange)

#             a = a[round(Int, size(a, 1) / 2), :, :]
#             ax, plt = heatmap(g[1, 2], real(a); axis=(;  title, aspect), colormap, colorrange=colorrange)
#         else
#             title *= " (2D array)"
#             ax, plt = heatmap(g[1, 1], real(a); axis=(;  title, aspect), colormap, colorrange=colorrange)
#         end
#         for (pos, text) in labels
#             text!(g[1, 1], pos..., ; text, align=(:center, :center))
#             # annotate!(g[1, 1], pos, text; fontsize=10, color=:black)
#         end
#     else
#         if isnothing(colorrange)
#             colorrange = extrema(a) * 0.1
#         end
#         ax, plt = volume(g[1, 1], real(a), ; axis=(;  type=Axis3, title,), colormap, colorrange, algorithm)
#         ax.elevation[] = elevation
#         ax.azimuth[] = azimuth
#     end
#     if diff(collect(extrema(a)))[1] > 0
#         Colorbar(g[1, d], plt)
#     end
# end
