# Tabari's Zoomable treemap

From https://observablehq.com/@d3/zoomable-treemap@428

# Data Overview

The file `./files/Tabari_all_treemap3.json` contains Isnads of depth three (positions 0 to 2, excluding Tabari) derived from Tabari's three books:

## Contents
1. **Isnad Chains**  
   - Includes the 50 most frequent `name_0`.
   
2. **Filtered Chains**  
   The data excludes chains that:
   - Appear fewer than 3 times (represented as `value` in the JSON file at `./files/` or `count_y` in the tables named `Tabari-all-para - start-w_haddathni-a_names_noWaw_LA_signal_g1_joined-g123(4 or 5).csv`).
   - Contain `"#####"` in any positions after `name_0` in the corresponding set.

Local files used here:
'Tabari-all-para - start-w_haddathni-a_names_noWaw_LA_signal_g1.csv' generates 'Tabari-all-para - start-w_haddathni-a_names_noWaw_LA_signal_g1_joined-g123.csv'. The latter generates ./files/Tabarai_all_treemap.json.

<!--
View this notebook in your browser by running a web server in this folder. For
example:

~~~sh
npx http-server
~~~

Or, use the [Observable Runtime](https://github.com/observablehq/runtime) to
import this module directly into your application. To npm install:

~~~sh
npm install @observablehq/runtime@5
npm install https://api.observablehq.com/@d3/zoomable-treemap@428.tgz?v=3
~~~

Then, import your notebook and the runtime as:

~~~js
import {Runtime, Inspector} from "@observablehq/runtime";
import define from "@d3/zoomable-treemap";
~~~

To log the value of the cell named “foo”:

~~~js
const runtime = new Runtime();
const main = runtime.module(define);
main.value("foo").then(value => console.log(value));
~~~

-->
