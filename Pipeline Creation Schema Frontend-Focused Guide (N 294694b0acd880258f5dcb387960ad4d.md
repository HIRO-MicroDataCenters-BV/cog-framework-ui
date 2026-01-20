# Pipeline Creation Schema : Frontend-Focused Guide (Name-Wired, UUID-Backed)

---

## 1) Big Picture

A **pipeline** is a graph (DAG) of **components** (nodes).

Edges are created by **inputs** on a component that point to:

- another component’s **output** (`component_output`),
- a **pipeline parameter** (`pipeline_inputparam`),
- or a **constant literal** (`constant`).

**Wiring uses component names**, which must be **unique** in the pipeline.

Each component also has a **UUID** so the backend can fetch the real component code from the catalog.

---

## 2) Canonical Shape (for reference)

```json
{
  "name": "string",
  "pipeline_components": [
    {
      "uuid": "string (UUID, required)",
      "name": "string (unique in pipeline, required)",
      "inputs": [
        {
          "source": "string",              // "<ComponentName>.<output>" | "<param_name>" | "<literal>"
          "destination": "string",         // input name on this component
          "value_source_type": "component_output" | "pipeline_inputparam" | "constant"
        }
      ]
    }
  ],
  "input_path": [
    { "name": "string", "default": "string", "description": "string" }
  ],
  "output_path": [
    {
      "name": "string",
      "source": { "component_name": "string", "output_name": "string" }
    }
  ]
}

```

---

## 3) Field-by-Field: What It Is & How the UI Should Handle It

### A) Root

- `name: string`
    - **What it is:** Human-friendly name of the pipeline (e.g., “TrainAndEvaluate”).
    - **UI:** Single text field. Require non-empty. Show in the page title and “Save/Run” dialogs.
- `pipeline_components: Component[]`
    - **What it is:** The list of nodes in the graph.
    - **UI:** This drives the **node palette/canvas**. Each item becomes one node card on the canvas.
- `input_path: PipelineInputParam[]` *(optional)*
    - **What it is:** Pipeline-level parameters the user can set at run time (global knobs).
    - **UI:** Manage in a **“Pipeline Parameters”** panel. Each param has a name and optional default.
- `output_path: PipelineOutput[]` *(optional)*
    - **What it is:** Which component outputs are exposed as **top-level pipeline outputs**.
    - **UI:** Let user pick a component and one of its outputs to “publish” at pipeline level (e.g., select from a dropdown on each node, then add to “Pipeline Outputs” list).

---

### B) `pipeline_components[]`

Each **component** represents an operation (e.g., Preprocess, Train, Evaluate).

- `uuid: string (UUID)`
    - **What it is:** Stable reference to the component definition in your catalog (image, interface, etc.).
    - **UI:** This is chosen when the user **adds a component** to the canvas (e.g., from a searchable catalog model). Store it silently; usually not editable.
- `name: string (unique in pipeline)`
    - **What it is:** The **label** used for wiring and display. **Must be unique**.
    - **UI:**
        - Show as the node title (editable inline).
        - On rename, **update all connections** that reference the old name (search `source` strings).
        - Validate uniqueness live (red underline + tooltip).
- `inputs: ComponentInput[]`
    - **What it is:** How values enter this component.
    - **UI:** Render as the node’s **input ports** or form fields. Each input has:
        - `destination` — the input name on this component (comes from the component’s interface; usually a fixed dropdown or text).
        - a **value type** selector → `component_output` | `pipeline_inputparam` | `constant`.
        - `source` — value depends on the chosen type:
            - `component_output`: `"<UpstreamComponentName>.<output_name>"`
            - `pipeline_inputparam`: `"<param_name>"`
            - `constant`: a literal string (user enters text/number; serialize as string)

---

### C) `input_path[]` (Pipeline Parameters)

- `name: string`
    - **What it is:** Parameter name users will reference from components.
    - **UI:** Add/edit in “Pipeline Parameters”. Must be unique within parameters.
- `default: string` *(optional)*
    - **What it is:** Default value used if the user doesn’t override at run time.
    - **UI:** Text field; keep string-encoded (numbers are fine as strings).
- `description: string` *(optional)*
    - **What it is:** Help text for UX/tooltips.

**How components use params:**

In a component input, set `value_source_type: "pipeline_inputparam"` and `source: "<param_name>"`.

---

### D) `output_path[]` (Pipeline Outputs)

- `name: string`
    - **What it is:** The pipeline’s **exported** output name.
    - **UI:** Text input; show as a list in a “Pipeline Outputs” panel.
- `source.component_name: string`
    - **What it is:** The **node name** providing the output.
    - **UI:** Dropdown of component names.
- `source.output_name: string`
    - **What it is:** Which **output** of that component to expose.
    - **UI:** After picking a component, show its available outputs in a dropdown.

> Note: Wiring for outputs is name-based (consistent with the rest of the graph).
> 

---

## 4) Creating Connections (How the UI should build `inputs[]`)

There are **three** kinds of sources:

1. **From another component’s output**
    - UI action: user **drags a line** from `A`’s output `y` to `B`’s input `x`, or picks from a dropdown.
    - Write:
        
        ```json
        {
          "destination": "x",
          "value_source_type": "component_output",
          "source": "A.y"
        }
        
        ```
        
2. **From a pipeline parameter**
    - UI action: user opens `B` node, chooses **“Pipeline Parameter”** for input `x`, then selects param `epochs`.
    - Write:
        
        ```json
        {
          "destination": "x",
          "value_source_type": "pipeline_inputparam",
          "source": "epochs"
        }
        
        ```
        
3. **From a constant**
    - UI action: user selects **“Constant”** and types `0.001`.
    - Write:
        
        ```json
        {
          "destination": "x",
          "value_source_type": "constant",
          "source": "0.001"
        }
        
        ```
        

---

## 5) Validation Rules (Frontend should enforce early)

**Root**

- `name` must be non-empty.

**Components**

- `name` must be non-empty and **unique** across `pipeline_components`.
- `uuid` must be present and a valid UUID.
- `inputs[].destination` must be non-empty and **must not contain `.`** (prevents parsing ambiguity).
- For each input:
    - If `component_output`: `source` **must include exactly one `.`** and both sides non-empty.
        - The left side (`<ComponentName>`) **must match an existing component name**.
    - If `pipeline_inputparam`: `source` must match an existing `input_path[].name`.
    - If `constant`: `source` must be non-empty (string).

**Pipeline Parameters**

- Each `input_path[].name` must be non-empty and unique among parameters.

**Pipeline Outputs**

- `component_name` must match an existing component.
- `output_name` must be non-empty.

**Graph (DAG)**

- Run a simple **cycle check** before enabling “Run/Save” (Kahn’s algorithm).
    - Build edges from every `component_output` input: `upstream_name -> current_name`.
    - If a cycle is found, block with a clear message.

---

## 6) UX Recommendations

- **Renaming a component:**
    - Prompt: “Renaming will update X connections.”
    - Automatically **rewrite** all `source: "<OldName>.<out>"` to `"<NewName>.<out>"`.
- **Deleting a component:**
    - Show the list of **downstream inputs** that will break.
    - On confirm, **remove the node** and **clear any inputs** that referenced it.
- **Changing an input type:**
    - If switching *from* `component_output`, clear the old `source` (or preserve the literal portion if feasible).
    - If switching *to* `pipeline_inputparam`, open a quick **param selector**.
- **Param management:**
    - Allow add/remove/rename of `input_path` entries.
    - When **renaming a param**, update all `inputs` using that param name.
- **Port discovery:**
    - Inputs/outputs come from the selected component’s **catalog definition** (backend artifact).
    - FE should load the component **interface** (input names & output names) when a UUID is chosen, to drive dropdowns.
- **Error surfacing:**
    - Show validation inline near the offending input/destination.
    - Provide **exact messages** (see §8).

---

## 7) Worked Example

**User actions in UI**

1. Add **DataPreprocessor** (uuid=`7b3c...`) → name it “DataPreprocessor”.
2. Add **ModelTrainer** (uuid=`c9b3...`) → name it “ModelTrainer”.
3. Add pipeline parameter **epochs** with default `10`.
4. Connect `DataPreprocessor.output_dataset` → `ModelTrainer.train_data`.
5. Set `ModelTrainer.learning_rate` to constant `"0.001"`.
6. Set `ModelTrainer.num_epochs` from param `epochs`.
7. Expose pipeline output `final_model` from `ModelTrainer.model`.

**Resulting JSON**

```json
{
  "name": "TrainAndEvaluate",
  "pipeline_components": [
    {
      "uuid": "7b3c59b9-6ce0-4a1b-8a8c-3d9a2c0a9b11",
      "name": "DataPreprocessor",
      "inputs": []
    },
    {
      "uuid": "c9b3e9d8-5b22-4a0c-9c2f-0b1f2e3d4a55",
      "name": "ModelTrainer",
      "inputs": [
        { "destination": "train_data", "value_source_type": "component_output", "source": "DataPreprocessor.output_dataset" },
        { "destination": "learning_rate", "value_source_type": "constant", "source": "0.001" },
        { "destination": "num_epochs", "value_source_type": "pipeline_inputparam", "source": "epochs" }
      ]
    }
  ],
  "input_path": [
    { "name": "epochs", "default": "10" }
  ],
  "output_path": [
    { "name": "final_model", "source": { "component_name": "ModelTrainer", "output_name": "model" } }
  ]
}

```

---

## 8) Standard Error Messages (show these verbatim where possible)

- Duplicate names:
    
    `component names must be unique; duplicates: ["X","Y"]`
    
- Bad `component_output` format:
    
    `ModelTrainer uses component_output 'X' but it must be '<ComponentName>.<output_name>'.`
    
- Unknown upstream component:
    
    `ModelTrainer references unknown upstream component 'Prepro' in 'Prepro.output'.`
    
- Unknown pipeline param:
    
    `ModelTrainer references pipeline_inputparam 'epochs' not declared in input_path.`
    
- Empty/invalid destination:
    
    `destination must not contain '.'`
    
- Cycle detected:
    
    `The component graph contains a cycle (pipeline must be a DAG).`
    

---

## 9) Frontend Pseudocode Snippets

**Connect A.y → B.x**

```tsx
function connectOutputToInput(upName: string, outName: string, compB: Component, dest: string) {
  compB.inputs = [
    ...compB.inputs.filter(i => i.destination !== dest),
    { destination: dest, value_source_type: "component_output", source: `${upName}.${outName}` }
  ];
}

```

**Bind param p → B.x**

```tsx
function bindParamToInput(paramName: string, compB: Component, dest: string) {
  compB.inputs = [
    ...compB.inputs.filter(i => i.destination !== dest),
    { destination: dest, value_source_type: "pipeline_inputparam", source: paramName }
  ];
}

```

**Set constant c → B.x**

```tsx
function setConstantToInput(literal: string, compB: Component, dest: string) {
  compB.inputs = [
    ...compB.inputs.filter(i => i.destination !== dest),
    { destination: dest, value_source_type: "constant", source: literal }
  ];
}

```

**On rename component `oldName` → `newName`**

```tsx
function renameComponent(graph: PipelineCreation, oldName: string, newName: string) {
  // ensure newName unique first
  for (const c of graph.pipeline_components) {
    for (const inp of c.inputs) {
      if (inp.value_source_type === "component_output" && inp.source.startsWith(oldName + ".")) {
        const [, out] = inp.source.split(".", 2);
        inp.source = `${newName}.${out}`;
      }
    }
  }
  for (const out of graph.output_path ?? []) {
    if (out.source.component_name === oldName) out.source.component_name = newName;
  }
}

```

---

## 10) Test Checklist (FE QA)

- [ ]  Cannot add two components with the **same name**.
- [ ]  Renaming a component rewrites all *A. → NewA.** references.
- [ ]  Dragging A.y to B.x writes `component_output` correctly and prevents self-loops.
- [ ]  Switching input type clears/updates `source` sensibly.
- [ ]  Deleting a node removes/breaks downstream inputs cleanly with a warning.
- [ ]  Adding param, binding it, and renaming it updates all references.
- [ ]  “Run” disabled if cycle is detected.
- [ ]  No `destination` allows `.` character.
- [ ]  Constants accept user text and serialize as strings.

---