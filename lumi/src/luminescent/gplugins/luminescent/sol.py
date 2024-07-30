import os
import subprocess
import time
import json
import bson
import numpy as np
from .inverse_design import *
from .sparams import *
from .utils import *
from .layers import *
from .constants import *


from subprocess import Popen, PIPE


def solve(prob, dev=False):
    if "dev" in prob:
        dev = prob["dev"]
    c0 = prob["component"]
    del prob["component"]
    bson_data = bson.dumps(prob)
    prob["component"] = c0

    path = prob["path"]
    if not os.path.exists(path):
        os.makedirs(path)
    print(f"""
          using simulation folder {path}
          started julia process
          compiling julia code...
          """)
    prob_path = os.path.join(path, "prob.bson")
    with open(prob_path, "wb") as f:
        # Write the BSON data to the file
        f.write(bson_data)

    start_time = time.time()

    def run(cmd):

        proc = Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # proc.wait()
        with proc:
            for line in proc.stdout:

                print(str(line.decode().strip()), flush=True)
            err_message = proc.stderr.read().decode()
            print(err_message)
    cmd_dev = [f"julia", os.path.join(os.path.dirname(
        os.path.abspath(__file__)), "run.jl"), path,]
    cmd = ["lumi", path]
    if dev:
        print(" ".join(cmd_dev))
        run(cmd_dev)
    else:
        try:
            run(cmd)
        except Exception as e:
            print(e)
            run(cmd_dev)

    # with Popen(cmd,  stdout=PIPE, stderr=PIPE) as p:
    #     if p.stderr is not None:
    #         for line in p.stderr:
    #             print(line, flush=True)
    # exit_code = p.poll()
    # subprocess.run()
    # print(f"julia simulation took {time.time()-start_time} seconds")
    print(f"images and results saved in {path}")
    sol = load_solution(path=path)
    if prob["study"] == "inverse_design":
        c = apply_design(c0,  sol)
        sol["before"]["component"] = c0
        sol["after"]["component"] = c
    return sol


def load_sparams(sparams):
    if "re" in list(sparams.values())[0]:
        return {k: v["re"]+1j*v["im"] for k, v in sparams.items()}
    return {wl: {k: (v["re"]+1j*v["im"])
                 for k, v in d.items()} for wl, d in sparams.items()}


def load_solution(path=None, study="",):
    if path is None:
        l = sorted(os.listdir(PATH), reverse=True)
        if study:
            for p in l:
                try:
                    s = json.loads(open(os.path.join(PATH, p, "sol.json")).read())[
                        "study"]
                    if s == study:
                        path = p
                        break
                except:
                    pass
        else:
            path = l[0]
        path = os.path.join(PATH, path)
    print(f"loading solution from {path}")
    prob = bson.loads(open(os.path.join(path, "prob.bson"), "rb").read())
    p = os.path.join(path, "sol.json")
    # sol = bson.loads(p, "rb").read())["sol"]
    sol = json.loads(open(p).read())
    if prob["study"] == "sparams":
        sol["sparams"] = load_sparams(sol["sparams"])
    elif prob["study"] == "inverse_design":
        for k in ["before", "after"]:
            sol[k]["sparams"] = load_sparams(sol[k]["sparams"])
        for k in sol["after"]:
            sol[k] = sol["after"][k]
    # pic2gds(os.path.join(path, f"design{i+1}.png"), sol["dx"])

        sol["optimized_designs"] = [
            np.array(d) for d in sol["optimized_designs"]]
        pass
    return sol


def write_sparams(*args, **kwargs):
    return solve(sparams_problem(*args, **kwargs))
