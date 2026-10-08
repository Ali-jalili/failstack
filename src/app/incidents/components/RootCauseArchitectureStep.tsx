/** @format */

"use client";

import { rootCauseNodeTypeSchema } from "@/lib/validation/incident";
import { IncidentFormValues } from "@/lib/validation/incident-form";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

type RootCauseNode = IncidentFormValues["rootCauseTree"][number];

const nodeTypeLabels: Record<RootCauseNode["type"], string> = {
  ROOT_CAUSE: "Root Cause",
  CONTRIBUTING_FACTOR: "Contributing Factor",
  DIRECT_FAILURE: "Direct Failure",
  SYSTEM_IMPACT: "System Impact",
};

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500";

const labelClassName =
  "block text-xs font-mono font-medium uppercase text-slate-400";

function getDescendantIds(nodeId: string, nodes: RootCauseNode[]) {
  const descendants = new Set([nodeId]);
  let foundDescendant = true;

  while (foundDescendant) {
    foundDescendant = false;
    for (const node of nodes) {
      if (
        node.parentId !== null &&
        descendants.has(node.parentId) &&
        !descendants.has(node.id)
      ) {
        descendants.add(node.id);
        foundDescendant = true;
      }
    }
  }

  return descendants;
}

function getNodeDepth(node: RootCauseNode, nodes: RootCauseNode[]) {
  let depth = 0;
  let parentId = node.parentId;

  while (parentId !== null && depth < nodes.length) {
    const parent = nodes.find((item) => item.id === parentId);
    if (!parent) break;
    depth += 1;
    parentId = parent.parentId;
  }

  return depth;
}

export default function RootCauseArchitectureStep() {
  const {
    control,
    setValue,
    register,
    watch,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rootCauseTree",
  });
  const nodes = watch("rootCauseTree") ?? [];
  const rootCauseTreeError =
    errors.rootCauseTree?.message ?? errors.rootCauseTree?.root?.message;

  const addNode = (parentId: string | null) => {
    append({
      id: crypto.randomUUID(),
      parentId,
      type: parentId === null ? "ROOT_CAUSE" : "CONTRIBUTING_FACTOR",
      title: "",
      description: "",
      systemComponent: "",
    });
  };

  const addNodeToRoot = () => {
    const root = nodes.find((node) => node.parentId === null);
    if (root) addNode(root.id);
  };

  const removeNode = (index: number) => {
    const node = nodes[index];
    if (!node) return;

    const childIndexes = nodes.reduce<number[]>((indexes, candidate, i) => {
      if (candidate.parentId === node.id) indexes.push(i);
      return indexes;
    }, []);

    if (node.parentId === null && childIndexes.length > 0) return;

    for (const childIndex of childIndexes) {
      setValue(`rootCauseTree.${childIndex}.parentId`, node.parentId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    remove(index);
  };

  return (
    <section className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Root Cause Analysis
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Build a tree from the root cause through contributing factors,
            failures, and system impact.
          </p>
        </div>
        {nodes.length === 0 ? (
          <button
            type="button"
            onClick={() => addNode(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Root Cause
          </button>
        ) : (
          <button
            type="button"
            onClick={addNodeToRoot}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Node
          </button>
        )}
      </div>

      {rootCauseTreeError && (
        <p role="alert" className="text-xs text-rose-400">
          {rootCauseTreeError}
        </p>
      )}

      {nodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">
          Start the analysis by adding its root cause.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const node = nodes[index];
            if (!node) return null;

            const nodeErrors = errors.rootCauseTree?.[index];
            const descendantIds = getDescendantIds(node.id, nodes);
            const children = nodes.filter(
              (candidate) => candidate.parentId === node.id,
            );
            const isRoot = node.parentId === null;
            const canRemove = !isRoot || children.length === 0;
            const depth = Math.min(getNodeDepth(node, nodes), 4);

            return (
              <fieldset
                key={field.id}
                style={{ marginLeft: `${depth * 12}px` }}
                className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5"
              >
                <legend className="sr-only">Root Cause Node {index + 1}</legend>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-100">
                    {node.title.trim() || `Node ${index + 1}`}
                    <span className="ml-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono uppercase text-blue-300">
                      {nodeTypeLabels[node.type]}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addNode(node.id)}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-blue-300 transition hover:bg-blue-500/10 hover:text-blue-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Child
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNode(index)}
                      disabled={!canRemove}
                      title={
                        canRemove
                          ? undefined
                          : "Move or remove this node's children first"
                      }
                      aria-label={`Remove ${node.title.trim() || `node ${index + 1}`}`}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`root-cause-${index}-type`}
                      className={labelClassName}
                    >
                      Node Type
                    </label>
                    <select
                      id={`root-cause-${index}-type`}
                      {...register(`rootCauseTree.${index}.type` as const)}
                      className={`${inputClassName} ${
                        nodeErrors?.type
                          ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                    >
                      {rootCauseNodeTypeSchema.options.map((type) => (
                        <option
                          key={type}
                          value={type}
                          className="bg-slate-900 text-slate-100"
                        >
                          {nodeTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                    {nodeErrors?.type && (
                      <p className="mt-1 text-xs text-rose-400">
                        {nodeErrors.type.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`root-cause-${index}-parent`}
                      className={labelClassName}
                    >
                      Parent Node
                    </label>
                    {isRoot ? (
                      <p
                        id={`root-cause-${index}-parent`}
                        className={`${inputClassName} text-slate-400`}
                      >
                        No parent (root)
                      </p>
                    ) : (
                      <select
                        id={`root-cause-${index}-parent`}
                        value={node.parentId ?? ""}
                        onChange={(event) =>
                          setValue(
                            `rootCauseTree.${index}.parentId`,
                            event.target.value,
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                        className={`${inputClassName} ${
                          nodeErrors?.parentId
                            ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                            : ""
                        }`}
                      >
                        {nodes
                          .filter(
                            (candidate) => !descendantIds.has(candidate.id),
                          )
                          .map((candidate) => (
                            <option
                              key={candidate.id}
                              value={candidate.id}
                              className="bg-slate-900 text-slate-100"
                            >
                              {candidate.title.trim() ||
                                `Node ${nodes.indexOf(candidate) + 1}`}
                            </option>
                          ))}
                      </select>
                    )}
                    {nodeErrors?.parentId && (
                      <p className="mt-1 text-xs text-rose-400">
                        {nodeErrors.parentId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`root-cause-${index}-title`}
                    className={labelClassName}
                  >
                    Title
                  </label>
                  <input
                    id={`root-cause-${index}-title`}
                    type="text"
                    {...register(`rootCauseTree.${index}.title` as const)}
                    placeholder="e.g. Database connection pool exhausted"
                    className={`${inputClassName} ${
                      nodeErrors?.title
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }`}
                  />
                  {nodeErrors?.title && (
                    <p className="mt-1 text-xs text-rose-400">
                      {nodeErrors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`root-cause-${index}-description`}
                    className={labelClassName}
                  >
                    Description
                  </label>
                  <textarea
                    id={`root-cause-${index}-description`}
                    rows={3}
                    {...register(`rootCauseTree.${index}.description` as const)}
                    placeholder="Explain how this factor contributed to the incident."
                    className={`${inputClassName} resize-y ${
                      nodeErrors?.description
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }`}
                  />
                  {nodeErrors?.description && (
                    <p className="mt-1 text-xs text-rose-400">
                      {nodeErrors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`root-cause-${index}-component`}
                    className={labelClassName}
                  >
                    System Component
                  </label>
                  <input
                    id={`root-cause-${index}-component`}
                    type="text"
                    {...register(
                      `rootCauseTree.${index}.systemComponent` as const,
                    )}
                    placeholder="e.g. Payment API"
                    className={`${inputClassName} ${
                      nodeErrors?.systemComponent
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }`}
                  />
                  {nodeErrors?.systemComponent && (
                    <p className="mt-1 text-xs text-rose-400">
                      {nodeErrors.systemComponent.message}
                    </p>
                  )}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}

      <section className="space-y-5 border-t border-slate-800 pt-6">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white">
            Architecture Before / After
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Describe how the system architecture changed to address the
            incident, and clarify whether the change is based on documented
            facts or reconstructed information.
          </p>
        </div>

        <div>
          <label
            htmlFor="architecture-before-fix"
            className={labelClassName}
          >
            Architecture Before the Fix
          </label>
          <textarea
            id="architecture-before-fix"
            rows={4}
            {...register("architectureDiff.beforeFix")}
            placeholder="Describe the relevant architecture and how it behaved before the fix."
            className={`${inputClassName} resize-y ${
              errors.architectureDiff?.beforeFix
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                : ""
            }`}
          />
          {errors.architectureDiff?.beforeFix && (
            <p className="mt-1 text-xs text-rose-400">
              {errors.architectureDiff.beforeFix.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="architecture-after-fix"
            className={labelClassName}
          >
            Architecture After the Fix
          </label>
          <textarea
            id="architecture-after-fix"
            rows={4}
            {...register("architectureDiff.afterFix")}
            placeholder="Describe the changes made and how the system behaves now."
            className={`${inputClassName} resize-y ${
              errors.architectureDiff?.afterFix
                ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                : ""
            }`}
          />
          {errors.architectureDiff?.afterFix && (
            <p className="mt-1 text-xs text-rose-400">
              {errors.architectureDiff.afterFix.message}
            </p>
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className={labelClassName}>
            Is this change documented as fact?
          </legend>
          <Controller
            control={control}
            name="architectureDiff.isFact"
            render={({ field }) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-sm text-slate-200 transition has-[:checked]:border-blue-500/60 has-[:checked]:bg-blue-500/10">
                  <input
                    ref={field.ref}
                    type="radio"
                    name={field.name}
                    value="true"
                    checked={field.value}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(true)}
                    className="accent-blue-500"
                  />
                  Yes, this is documented
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-sm text-slate-200 transition has-[:checked]:border-blue-500/60 has-[:checked]:bg-blue-500/10">
                  <input
                    type="radio"
                    name={field.name}
                    value="false"
                    checked={!field.value}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(false)}
                    className="accent-blue-500"
                  />
                  No, this is reconstructed
                </label>
              </div>
            )}
          />
        </fieldset>

        {!watch("architectureDiff.isFact") && (
          <div>
            <label
              htmlFor="architecture-notes"
              className={labelClassName}
            >
              Reconstruction Notes
            </label>
            <textarea
              id="architecture-notes"
              rows={3}
              {...register("architectureDiff.notes")}
              placeholder="Explain what evidence or reasoning supports this reconstruction."
              className={`${inputClassName} resize-y ${
                errors.architectureDiff?.notes
                  ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500"
                  : ""
              }`}
            />
            {errors.architectureDiff?.notes && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.architectureDiff.notes.message}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Notes are required when the architecture details are reconstructed.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
